import dotenv from "dotenv";
import cloudinary from "cloudinary";
import path from "path";
import fs from "fs";
import crypto from "crypto";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadImage(imageName) {
  let imagePath = path.join(process.cwd(), "public/uploads", imageName); // Corrected path

  // Check if file exists before uploading
  if (!fs.existsSync(imagePath)) {
    console.error("File not found:", imagePath);
    return null;
  }

  try {
    const timestamp = Math.round(new Date().getTime() / 1000); // Correct timestamp
    const api_secret = process.env.CLOUDINARY_API_SECRET;

    // Validate secret key
    if (!api_secret) {
      throw new Error("Cloudinary API secret is missing in .env");
    }

    // Correct Signature Generation
    const signature = crypto
      .createHash("sha1")
      .update(`timestamp=${timestamp}${api_secret}`)
      .digest("hex");

    // Upload Image with Signature
    const result = await cloudinary.uploader.upload(imagePath, {
      api_key: process.env.CLOUDINARY_API_KEY,
      timestamp,
      signature,
    });

    console.log("Image uploaded to Cloudinary:", result.secure_url);

    // Delete the file after successful upload
    fs.unlink(imagePath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return null;
  }
}

export default uploadImage;




