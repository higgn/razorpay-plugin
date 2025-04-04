require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const submissionRoutes = require('./routes/submissions');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 8080;

// --- Middleware ---
app.use(cors()); // Enable CORS for all origins (adjust for production)
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

// --- Database Connection ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => {
      console.error('MongoDB Connection Error:', err);
      process.exit(1); // Exit if DB connection fails
  });

// --- API Routes ---
app.use('/api/submissions', submissionRoutes);
app.use('/api/admin', adminRoutes);

// --- Basic HTML File Serving (for direct access) ---
// Optional: You might rely solely on frontend JS navigation
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/form', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'form.html'));
});
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin_login.html'));
});
app.get('/dashboard', (req, res) => {
    // Add security check here if implementing session/JWT auth
    res.sendFile(path.join(__dirname, 'public', 'admin_dashboard.html'));
});
app.get('/thankyou', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'thank_you.html'));
});

// --- Global Error Handler (Basic) ---
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.stack);
  res.status(500).send('Something broke!');
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});