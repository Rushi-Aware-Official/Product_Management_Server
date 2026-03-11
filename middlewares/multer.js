import multer from "multer";
import path from "path";
import fs from "fs";

export const uploadDocx = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let destinationPath = path.join("uploads", "transform");

      if (!fs.existsSync(destinationPath)) {
        fs.mkdirSync(destinationPath, { recursive: true }, (err) => {
          console.log("Error At Upload Category Logo", err);
        });
      }
      cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
      let newFileName = Date.now() + "_" + file.originalname;
      cb(null, newFileName);
    },
  }),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("file");
