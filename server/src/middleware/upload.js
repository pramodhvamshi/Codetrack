const multer = require('multer');

const storage = multer.memoryStorage();

const ALLOWED_MIMES = [
  /^image\//,
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
];

const fileFilter = (req, file, cb) => {
  const allowed = ALLOWED_MIMES.some(m =>
    typeof m === 'string' ? m === file.mimetype : m.test(file.mimetype)
  );
  if (allowed) {
    cb(null, true);
  } else {
    cb(new Error('Only images, PDFs and DOCX files are allowed'));
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;

