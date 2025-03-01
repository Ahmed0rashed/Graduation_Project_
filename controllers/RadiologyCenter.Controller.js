const cloudinary = require('cloudinary').v2;
const RadiologyCenter = require('../models/Radiology_Centers.Model');

cloudinary.config({
  cloud_name: 'dncawa23w',
  api_key: '451913596668632',
  api_secret: 'KboaQ-CpKdNpD0oJ0JvAagR3N_4',
});

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('Received file:', req.file);
    console.log('Request ID:', req.params.id);

    
    const result = await cloudinary.uploader.upload_stream(
      { folder: 'radiology_centers' },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error);
          return res.status(500).json({ message: 'Cloudinary upload failed', error: error.message });
        }

        console.log('Cloudinary response:', result);

        const center = await RadiologyCenter.findById(req.params.id);
        if (!center) {
          return res.status(404).json({ message: 'Center not found' });
        }

        center.path = result.secure_url;
        await center.save();

        res.status(200).json({
          message: 'Image uploaded successfully',
          url: result.secure_url,
        });
      }
    ).end(req.file.buffer); 
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



  exports.getImage = async (req, res) => {
    try {
      const center = await RadiologyCenter.findById(req.params.id);
      if (!center) {
        return res.status(404).json({ message: 'Center not found' });
      }
  
      console.log('Image URL from DB:', center.path);
  
      res.status(200).json({
        message: 'Image retrieved successfully',
        imageUrl: center.path,  
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  



