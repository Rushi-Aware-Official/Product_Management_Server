import CryptoJS from "crypto-js";
import mongoose from "mongoose";

const SECRET_KEY =
  process.env.ENCRYPTION_KEY ||
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

if (!SECRET_KEY) {
  throw new Error("ENCRYPTION_KEY is not defined");
}

export const decryptFormData = (req, res, next) => {
  if (!req.body) return next();

  const decryptValue = (value) => {
    if (typeof value === "string") {
      try {
        const bytes = CryptoJS.AES.decrypt(value, SECRET_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return decrypted ? JSON.parse(decrypted) : value;
      } catch {
        return value;
      }
    } else if (Array.isArray(value)) {
      return value.map((v) => decryptValue(v));
    } else if (typeof value === "object" && value !== null) {
      const decryptedObj = {};
      for (const k of Object.keys(value)) {
        decryptedObj[k] = decryptValue(value[k]);
      }
      return decryptedObj;
    }
    return value;
  };

  req.body = decryptValue(req.body);
  next();
};

export const decryptEncryptedData = (data) => {
  if (!data) return "Data is required.";

  const decryptValue = (value) => {
    if (typeof value === "string") {
      try {
        const bytes = CryptoJS.AES.decrypt(value, SECRET_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return decrypted ? JSON.parse(decrypted) : value;
      } catch {
        return value;
      }
    } else if (Array.isArray(value)) {
      return value.map((v) => decryptValue(v));
    } else if (typeof value === "object" && value !== null) {
      const decryptedObj = {};
      for (const k of Object.keys(value)) {
        decryptedObj[k] = decryptValue(value[k]);
      }
      return decryptedObj;
    }
    return value;
  };

  return decryptValue(data);
};

export const decryptString = (value) => {
  if (typeof value === "string") {
    try {
      const bytes = CryptoJS.AES.decrypt(value, SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted ? JSON.parse(decrypted) : value;
    } catch {
      return value;
    }
  }
  return value;
};

export const isObjectId = (value) => {
  // Check if it's a Mongoose ObjectId instance
  if (
    mongoose.Types.ObjectId.isValid(value) &&
    (typeof value === "string" || value instanceof mongoose.Types.ObjectId)
  ) {
    return true;
  }
  return false;
};

export const encryptEmail = (email) => {
  try {
    if (!email) return null;

    // 1. Clean the data (Lowercase and Trim)
    const cleanEmail = email.toLowerCase().trim();

    // 2. Encrypt the string
    const encrypted = CryptoJS.AES.encrypt(cleanEmail, SECRET_KEY).toString();

    return encrypted;
  } catch (error) {
    console.error("Encryption failed:", error.message);
    return null;
  }
};

export const encryptString = (text) => {
  if (text === null || text === undefined || text === "") return text;

  // Convert to string and encrypt
  // Use JSON.stringify only if you want to keep quotes around strings (standard for the FormData loop)
  const dataToEncrypt = typeof text === "string" ? text : JSON.stringify(text);
  return CryptoJS.AES.encrypt(dataToEncrypt, SECRET_KEY).toString();
};

export const encryptFormData = (data) => {
  const encryptValue = (value, key) => {
    if (
      isObjectId(value) ||
      isEnumField(key) ||
      isExceptedField(key) ||
      typeof value === "boolean" ||
      typeof value === "number"
    ) {
      return value; // don't encrypt ObjectId, enum, or boolean
    } else if (typeof value === "string" || typeof value === "number") {
      return CryptoJS.AES.encrypt(JSON.stringify(value), SECRET_KEY).toString();
    } else if (Array.isArray(value)) {
      return value.map((v) => encryptValue(v, key));
    } else if (typeof value === "object" && value !== null) {
      const encryptedObj = {};
      for (const k of Object.keys(value)) {
        encryptedObj[k] = encryptValue(value[k], k);
      }
      return encryptedObj;
    }
    return value;
  };

  return encryptValue(data);
};

// Helper to detect enum fields
const enumFields = ["makerModel", "matter_status", "auditTrail"];
const isEnumField = (fieldName) => enumFields.includes(fieldName);

const exceptedFields = ["phone_number"];
const isExceptedField = (fieldName) => exceptedFields.includes(fieldName);
