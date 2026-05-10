import path from "path";
import fs from "fs";
import { Router } from "express";
import multer from "multer";
import { randomBytes } from "crypto";
import type { AuthedRequest } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${randomBytes(16).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
    cb(null, ok);
  },
});

router.post("/", upload.single("file"), (req: AuthedRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const publicPath = `/uploads/${req.file.filename}`;
  return res.json({ url: publicPath });
});

export default router;
