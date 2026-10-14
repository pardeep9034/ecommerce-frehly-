import multer from "multer";
import AppError from "../utils/AppError.js";
import { ALLOWED_MIMES, MAX_FILE_BYTES, detectMime } from "../modules/partnerApplication/partnerApplicationRules.js";

// One file in the "file" field, held in memory (5 MB cap) so it can be checked before it touches the disk.
const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
  fileFilter: (req, file, cb) =>
    ALLOWED_MIMES.includes(file.mimetype) ? cb(null, true) : cb(new AppError("Only JPEG, PNG or PDF files are allowed", 415)),
}).single("file");

const uploadDocument = (req, res, next) =>
  parser(req, res, (error) => {
    if (error) {
      if (error.code === "LIMIT_FILE_SIZE") return next(new AppError("File must be 5 MB or smaller", 413));
      return next(error instanceof AppError ? error : new AppError("Invalid upload", 400));
    }
    if (!req.file) return next(new AppError("A file is required", 400));
    // The declared type is the client's word; the file's first bytes are the proof (an .exe renamed .jpg ends here).
    if (detectMime(req.file.buffer) !== req.file.mimetype) {
      return next(new AppError("File content does not match its type", 415));
    }
    next();
  });

export default uploadDocument;
