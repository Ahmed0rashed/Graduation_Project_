// routes/cloudinaryRoutes.js

const express = require('express');
const router = express.Router();
const cloudinaryController = require('../controllers/dicomController');

// API لطلب الصور باستخدام DICOM ID
router.get('/images/:dicomId', async (req, res) => {
  const dicomId = req.params.dicomId;

  try {
    const imageUrls = await cloudinaryController.getImagesFromDicomId(dicomId);

    // إرسال الرد بالصور
    if (imageUrls.length > 0) {
      return res.json({ imageUrls });
    } else {
      return res.status(404).json({ message: `No images found for DICOM ID: ${dicomId}` });
    }

  } catch (error) {
    return res.status(500).json({ message: 'Error fetching images', error: error.message });
  }
});

module.exports = router;
