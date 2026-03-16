const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdf = require('pdf-parse');
const auth = require('../middleware/auth');

// Multer config: memory storage with 5MB limit
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// POST /api/upload/resume
router.post('/resume', auth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Only PDF files are supported.' });
    }

    const data = await pdf(req.file.buffer);
    const extractedText = data.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ message: 'Could not extract text from PDF. It may be an image-based PDF or corrupted.' });
    }

    return res.status(200).json({ extractedText: extractedText.trim() });
  } catch (error) {
    console.error('=== /upload/resume ERROR ===', error);
    return res.status(500).json({ message: 'Error parsing PDF file.', detail: error.message });
  }
});

module.exports = router;
