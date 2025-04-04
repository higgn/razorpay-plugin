// routes/admin.js (Updated for GCS Download)
const express = require('express');
const Submission = require('../models/Submission');

const router = express.Router();

// --- Simple Admin Key Check Middleware (INSECURE - Same as before) ---
const checkAdminKey = (req, res, next) => {
    // NOTE: Passing the key via query param for download is also insecure.
    // Proper JWT/Session auth is strongly recommended for real apps.
    const providedKey = req.headers['admin-key'] || req.body.key || req.query.key;
    if (providedKey && providedKey === process.env.ADMIN_KEY) {
        next(); // Key is correct, proceed
    } else {
        res.status(401).json({ message: 'Unauthorized: Invalid admin key' });
    }
};


// --- Route for Admin Login --- (No Changes Here)
router.post('/login', (req, res) => {
    const { key } = req.body;
    if (key && key === process.env.ADMIN_KEY) {
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid admin key' });
    }
});


// --- Route to Get All Submissions (Protected) --- (No Changes Here)
router.get('/submissions', checkAdminKey, async (req, res) => {
    try {
        const submissions = await Submission.find().sort({ submissionDate: -1 }); // Sort by newest
        res.json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ message: 'Failed to fetch submissions' });
    }
});


// --- Route to Download a Submission File (MODIFIED FOR GCS) ---
// This now redirects the user's browser to the public GCS URL
router.get('/download/:id', checkAdminKey, async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id);
        if (!submission) {
            return res.status(404).send('Submission not found');
        }

        // filePath now holds the public GCS URL like 'https://storage.googleapis.com/...'
        const gcsUrl = submission.filePath;

        if (gcsUrl) {
            console.log(`Redirecting download request for ${submission.fileName} to: ${gcsUrl}`);
            // Redirect the browser to the GCS URL
            // The browser will handle the download based on the file's Content-Type
             // Adding filename to Content-Disposition can suggest filename to browser
            // This might not always work depending on browser/GCS settings, but worth trying.
            res.setHeader('Content-Disposition', `attachment; filename="${submission.fileName}"`);
            res.redirect(gcsUrl);
        } else {
            res.status(404).send('File path not found for this submission.');
        }
    } catch (error) {
        console.error('Error processing download redirect:', error);
        res.status(500).send('Error processing download request');
    }
});

module.exports = router;