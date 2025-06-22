const multer = require('multer');


const storage = multer.memoryStorage();

const uploadFileMiddleware = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, 
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF) and PDFs are allowed.'), false);
        }
    }
});

module.exports = uploadFileMiddleware;