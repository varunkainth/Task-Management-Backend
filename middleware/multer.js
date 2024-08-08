import multer from "multer";
import path from "path";  // Import path module

// Define storage settings
const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    const originalName = file.originalname.replace(/\s+/g, "_");
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9) + "-" + originalName;
    cb(null, uniqueSuffix);
  },
});

// Define file filter
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = /jpeg|jpg|png|pdf|txt|docx|xlsx|xls|ppt|pptx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only images and documents with extensions of JPEG, JPG, PNG, PDF, TXT, DOCX, XLSX, XLS, PPT, or PPTX are allowed."), false);
  }
};

// Configure multer with storage, file filter, and size limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit (adjust as needed)
});

export default upload;
