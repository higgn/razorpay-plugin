const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  number: { type: String, required: true },
  address: { type: String, required: true },
  category: { type: String, required: true, enum: ['Essay', 'Drawing', 'Photography', 'Singing'] },
  fileName: { type: String, required: true }, // Original name of the uploaded file
  filePath: { type: String, required: true }, // Path where the file is stored on the server
  fileMimetype: { type: String },           // Mimetype of the file
  submissionDate: { type: Date, default: Date.now },
  paymentId: { type: String }, // Razorpay Payment ID
  orderId: { type: String },   // Razorpay Order ID
  paymentStatus: { type: String, default: 'Pending', enum: ['Pending', 'Success', 'Failed'] },
});

module.exports = mongoose.model('Submission', submissionSchema);