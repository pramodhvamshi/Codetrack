const path = require('path');
const multer = require('multer');

const uploadsDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    const unique = Date.now();
    cb(null, `${base}-${unique}${ext}`);
  }
});

const ALLOWED_MIMES = [
  /^image\//,
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
];

const fileFilter = (req, file, cb) => {
  // Allow images, PDFs and DOCX
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

