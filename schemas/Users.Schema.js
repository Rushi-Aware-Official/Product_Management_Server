import mongoose from "mongoose";

const Schema = mongoose.Schema;

const otpSchema = Schema(
  {
    email: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // OTP expires after 300 seconds (5 minutes)
    },
  },
  { timestamps: true }
);

export const OTPModel = mongoose.model("OTP", otpSchema, "OTP");

const notificationSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },

    message: {
      type: String,
      required: true
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin"
    },

    recipientType: {
      type: String,
      enum: ["all_sellers", "seller"],
      required: true
    },

    recipientModel: {
      type: String,
      enum: ["Seller", null],
      default: null
    },

    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      default: null
    },

    isRead: {
      type: Boolean,
      default: false
    }

  },
  { timestamps: true }
);

export const notificationModel = mongoose.model(
  "Notification",
  notificationSchema
);

