import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import express from "express";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const app = express();
app.set("view engine", "ejs");
app.set("views", path.resolve("views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const POD_NAME = process.env.HOSTNAME || "local";
const FEATURE_IMAGE_UPLOAD = (process.env.FEATURE_IMAGE_UPLOAD || "false").toLowerCase() === "true";

// S3 env vars
const AWS_REGION = process.env.AWS_REGION || "";
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || "";
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "";
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "";

// Simple in-memory items list (demo only)
const items = [];

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Configure S3 client if feature enabled
let s3 = null;
if (FEATURE_IMAGE_UPLOAD) {
  if (!AWS_REGION || !AWS_S3_BUCKET) {
    console.warn("[WARN] FEATURE_IMAGE_UPLOAD enabled but AWS_REGION/AWS_S3_BUCKET not set.");
  }
  s3 = new S3Client({
    region: AWS_REGION || "us-east-1",
    credentials: (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) ? {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY
    } : undefined // Allow IAM roles inside K8s/EKS if keys are not set
  });
}

app.get("/", (req, res) => {
  res.render("index", {
    items,
    podName: POD_NAME,
    featureImageUpload: FEATURE_IMAGE_UPLOAD,
    s3Bucket: AWS_S3_BUCKET
  });
});

app.post("/items", (req, res) => {
  const { item } = req.body;
  if (item && item.trim().length > 0) {
    items.push({ id: crypto.randomUUID(), text: item.trim(), at: new Date().toISOString() });
  }
  res.redirect("/");
});

app.post("/upload", upload.single("image"), async (req, res) => {
  if (!FEATURE_IMAGE_UPLOAD) {
    return res.status(403).send("Image upload feature is disabled.");
  }
  if (!s3 || !AWS_S3_BUCKET) {
    return res.status(500).send("S3 is not configured.");
  }
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  const ext = path.extname(req.file.originalname) || ".bin";
  const key = `uploads/${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  const contentType = req.file.mimetype || "application/octet-stream";
  try {
    await s3.send(new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: contentType
    }));
    const readUrl = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key
    }), { expiresIn: 900 }); // 15 minutes
    return res.status(200).send(`Upload OK. S3 key: ${key}\nTemporary URL (15m): ${readUrl}\n<a href="/">Back</a>`);
  } catch (e) {
    console.error("Upload failed:", e);
    return res.status(500).send("Upload failed: " + e.message);
  }
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}. Pod: ${POD_NAME}`));
}

export default app;