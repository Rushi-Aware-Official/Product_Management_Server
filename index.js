import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import logger from "./utils/logger.js";
import {
  AuthRoutes,
  ProductRoutes,
  SellerRoutes,
} from "./routes/index.js";
import handleErrors from "./middlewares/errorHandler.js";
import cookieParser from "cookie-parser";
import { verify } from "./middlewares/jwt.js";
import fs from "fs";
import path from "path";
import mime from "mime";

const app = express();

app.use(cookieParser());

// Security headers
app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  })
);

// Rate-limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: "Too many requests from this IP",
  })
);

// app.use(
//   fileUpload({
//     useTempFiles: true,
//     tempFileDir: "/tmp/",
//   })
// );

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(logger);

// All API routes
app.use("/auth", AuthRoutes);
app.use("/seller", SellerRoutes);
app.use("/product", ProductRoutes);
app.use("/uploads", express.static("uploads"));

// Middleware for file upload

app.get("/file", verify, (req, res) => {
  let { fileUrl } = req.query;
  if (!fileUrl)
    return res.status(400).json({ message: "File URL is required" });

  // Decode URL to handle spaces
  fileUrl = decodeURIComponent(fileUrl.toString());
  // Normalize slashes and prevent directory traversal
  const safePath = fileUrl.replace(/\\/g, "/").replace(/^(\.\.(\/|\\|$))+/, "");

  const filePath = path.join(process.cwd(), safePath);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: `File not found at ${filePath}` });
  }

  const mimeType = mime.getType(filePath) || "application/octet-stream";
  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Disposition", "inline");
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: "Error sending file" });
    }
  });
});

// Global error handler
app.use(handleErrors);

export default app;
