const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = async (fileBuffer, fileType) => {
    try {
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "uploads", resource_type: fileType === "video" ? "video" : "image" },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(fileBuffer);
        });
        return result.secure_url;
    } catch (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }
};

module.exports = upload;