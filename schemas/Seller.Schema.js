import mongoose from "mongoose";

const Schema = mongoose.Schema;

const sellerSchema = new Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },

    mobile_no: { type: String, required: true },

    jurisdiction: {              // ✅ ADD THIS
        type: String,
        required: true
    },

    country: { type: String, required: true },
    state: { type: String, required: true },

    skills: [{ type: String }],

    password: { type: String, required: true },

    role: {
        type: String,
        enum: ["seller"],
        default: "seller",
        required: true,
    },

    // Security fields
    failedAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },

    // 2FA fields
    is2FAEnabled: { type: Boolean, default: false },
    twoFACode: { type: String, default: null },
    twoFAExpiresAt: { type: Date, default: null },

    // Logging
    lastLoginAt: { type: Date, default: null },
    lastLoginDevice: { type: String, default: null },

    first_login: { type: Boolean, default: true },
    status: { type: Boolean, default: true },

    // Reference to Admin
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: true
    }

}, { timestamps: true });

export const SellerModel = mongoose.model("Seller", sellerSchema);