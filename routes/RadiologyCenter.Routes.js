const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../middleware/upload'); 
const { uploadImage } = require('../controllers/RadiologyCenter.Controller'); 
const  uploadImag  = require('../controllers/RadiologyCenter.Controller'); 


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '.' + file.mimetype.split('/')[1]);
  },
});
const fileUpload = multer({ storage: storage });


router.post('/upload/:id', fileUpload.single('image'), uploadImage);
router.get('/getImage/:id', uploadImag.getImage);

module.exports = router;
