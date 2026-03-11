import mongoose from "mongoose";

const Schema = mongoose.Schema;

const adminSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["admin", "super_admin"],
        default: "admin",
        required: true,
    },
    // Optional fields you might want:
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

adminSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    // next();
});

export const AdminModel = mongoose.model("Admin", adminSchema);