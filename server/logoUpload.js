const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tenantId = req.body.tenantId;
    const dir = path.join(__dirname, '../assets/tenant-logos');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Get tenantId from query string
    let tenantId = req.query.tenantId;
    if (!tenantId) tenantId = 'unknown';
    cb(null, `${tenantId}-logo${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

router.post('/upload-logo', upload.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const tenantId = req.query.tenantId;
  const logoPath = `/assets/tenant-logos/${tenantId}-logo${path.extname(req.file.originalname)}`;
  res.json({ logoUrl: logoPath });
});

module.exports = router;
