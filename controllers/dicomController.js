// controllers/cloudinaryController.js

const cloudinary = require('cloudinary').v2;

// إعداد بيانات Cloudinary الخاصة بك
cloudinary.config({
    cloud_name: "dncawa23w",
    api_key: "451913596668632",
    api_secret: "KboaQ-CpKdNpD0oJ0JvAagR3N_4",
});

// دالة لتحميل الصور من فولدر معين باستخدام DICOM ID
const getImagesFromDicomId = async (dicomId) => {
  try {
    // إزالة الترميز المزدوج للمسار (لو كان موجود)
    const decodedDicomId = decodeURIComponent(dicomId);  // فك الترميز URL

    // لو حابب تتأكد من المسار المرسل
    console.log('Decoded DICOM ID:', decodedDicomId);

    // البحث باستخدام DICOM ID بعد فك الترميز
    const result = await cloudinary.search
      .expression(`folder:Dicom_image/${decodedDicomId}`)  // البحث في الفولدر
      .sort_by('public_id', 'asc')  // ترتيب الصور بناءً على public_id
      .max_results(30)  // عدد النتائج المسموح بها
      .execute();  // تنفيذ البحث

    // طباعة نتيجة البحث للتأكد
    console.log('Search result:', result);

    // استخراج روابط الصور من النتيجة
    const imageUrls = result.resources.map(file => file.secure_url);

    // لو مفيش صور، نطبع رسالة
    if (imageUrls.length === 0) {
      console.log(`❌ No images found for DICOM ID: ${dicomId}`);
    }

    return imageUrls;  // إرجاع الروابط

  } catch (error) {
    console.error('❌ Error fetching images:', error);  // طباعة أي خطأ
    throw error;  // رمي الخطأ
  }
};

// تصدير الدالة
module.exports = {
  getImagesFromDicomId
};
