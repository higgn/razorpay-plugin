// routes/submissions.js (Updated for GCS)
require('dotenv').config(); // Ensure env vars are loaded
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const multer = require('multer'); // We still use multer, but for memory storage
const { Storage } = require('@google-cloud/storage'); // Import GCS
const path = require('path');

const Submission = require('../models/Submission');

const router = express.Router();

// --- Configure Razorpay ---
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- Configure Google Cloud Storage ---
// Creates a client using Application Default Credentials (ADC)
// ADC will be automatically available when running on Cloud Run/GCE etc.
// For local testing, you might need to authenticate via `gcloud auth application-default login`
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME; // Get bucket name from .env
if (!bucketName) {
    console.error("FATAL ERROR: GCS_BUCKET_NAME environment variable not set.");
    // Optionally exit or handle appropriately
    // process.exit(1); // Consider uncommenting in production if bucket name is critical
}
const bucket = storage.bucket(bucketName);

// --- Configure Multer for In-Memory Storage ---
// We'll process the file buffer directly instead of saving to disk first
const multerMemoryStorage = multer.memoryStorage();
const upload = multer({
    storage: multerMemoryStorage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
    fileFilter: (req, file, cb) => {
         // Keep basic file type validation
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf' || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images, PDF, audio, or video allowed.'), false);
        }
    }
});

// --- Route to Create Razorpay Order --- (No Changes Here)
router.post('/create-order', async (req, res) => {
    const amount = 10000; // Amount in paise (100 INR * 100)
    const currency = 'INR';
    const options = {
        amount: amount,
        currency: currency,
        receipt: `receipt_order_${Date.now()}`,
        payment_capture: 1
    };

    try {
        const order = await razorpayInstance.orders.create(options);
        console.log("Razorpay Order Created:", order);
        res.json({
            orderId: order.id,
            currency: order.currency,
            amount: order.amount,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ message: 'Failed to create payment order', error: error.message });
    }
});


// --- Route to Handle Form Submission (Modified for GCS) ---
router.post('/submit', upload.single('submissionFile'), async (req, res) => {
    const { name, email, number, address, category, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    // --- Verify Razorpay Payment Signature --- (No Changes Here)
    const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest('hex');

    if (generated_signature !== razorpay_signature) {
        console.error("Payment Verification Failed: Signature mismatch.");
        // No file to delete from disk here
        return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }
    console.log("Payment Verified Successfully.");

    // Check if file exists in memory
    if (!req.file) {
        return res.status(400).json({ message: 'Submission file is required.' });
    }

    // --- Upload File Buffer to Google Cloud Storage ---
    const originalFileName = req.file.originalname.replace(/\s+/g, '_'); // Replace spaces
    const gcsFileName = `<span class="math-inline">\{Date\.now\(\)\}\-</span>{Math.round(Math.random() * 1E9)}-${originalFileName}`;
    const fileUpload = bucket.file(gcsFileName);

    const blobStream = fileUpload.createWriteStream({
        metadata: {
            contentType: req.file.mimetype,
        },
        // Make the file publicly readable - SIMPLEST approach
        // WARNING: Anyone with the link can access the file.
        // For sensitive data, use Signed URLs instead (more complex).
         predefinedAcl: 'publicRead'
    });

    blobStream.on('error', (err) => {
        console.error('GCS Upload Error:', err);
        return res.status(500).json({ message: 'Failed to upload file.', error: err.message });
    });

    blobStream.on('finish', async () => {
        // File upload is complete. Get the public URL.
        // The public URL format is https://storage.googleapis.com/[BUCKET_NAME]/[OBJECT_NAME]
        const publicUrl = `https://storage.googleapis.com/<span class="math-inline">\{bucket\.name\}/</span>{gcsFileName}`;
        console.log(`File uploaded to GCS: ${publicUrl}`);

        // --- Create New Submission Document in MongoDB ---
        const newSubmission = new Submission({
            name,
            email,
            number,
            address,
            category,
            fileName: originalFileName, // Store original filename
            filePath: publicUrl,       // Store the GCS public URL
            fileMimetype: req.file.mimetype,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            paymentStatus: 'Success',
        });

        try {
            const savedSubmission = await newSubmission.save();
            console.log('Submission saved:', savedSubmission._id);
            res.status(201).json({
                message: 'Submission successful!',
                submissionId: savedSubmission._id,
                redirectUrl: '/thankyou'
            });
        } catch (error) {
            console.error('Error saving submission to MongoDB:', error);
            // If DB save fails *after* GCS upload, ideally delete the GCS file
            try {
                await bucket.file(gcsFileName).delete();
                console.log(`Deleted GCS file ${gcsFileName} after DB save failure.`);
            } catch (delErr) {
                console.error(`Failed to delete GCS file ${gcsFileName} after DB error:`, delErr);
            }
            res.status(500).json({ message: 'Failed to save submission data after upload.', error: error.message });
        }
    });

    // Pipe the file buffer from memory to the GCS stream
    blobStream.end(req.file.buffer);
});

module.exports = router;