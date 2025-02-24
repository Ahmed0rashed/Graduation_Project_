const multer = require('multer');

// تحديد مكان تخزين الملفات
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');  // تأكد من وجود مجلد "uploads"
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// تعريف multer
const upload = multer({ storage: storage });

module.exports = upload;
