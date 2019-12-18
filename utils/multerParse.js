const multer = require('multer');

module.exports = (req, res, next) => {
  const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, `storage/user-${req.userId}`); },
    filename: (req, file, cb) => { cb(null, file.originalname); }
  });

  const upload = multer({ storage: fileStorage });
  upload.array('files', 10);

  next();
};