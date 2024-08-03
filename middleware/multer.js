import multer from "multer";

const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    const originalName = file.originalname.replace(/\s+/g, "_");
    const unique_suffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + originalName;
    cb(null, unique_suffix);
  },
});
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Only images are allowed with extention of (JPEG, JPG, PNG) for upload."
      )
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, //5MB limit
});
export default upload;
