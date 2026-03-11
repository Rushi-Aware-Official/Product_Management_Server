import fileUpload from "express-fileupload";

export const excelUploadMiddleware = fileUpload({
  useTempFiles: true, // keep in memory
  tempFileDir: "/tmp/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  abortOnLimit: true,
});
