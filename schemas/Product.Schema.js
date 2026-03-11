import mongoose from "mongoose";

const Schema = mongoose.Schema;

// Brand Schema
const brandSchema = new Schema({
    brand_name: {
        type: String,
        required: true,
        trim: true
    },

    detail: {
        type: String,
        required: true
    },

    image: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true,
        min: 0
    }

}, { _id: false });


// Product Schema
const productSchema = new Schema({

    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seller",
        required: true
    },

    product_name: {
        type: String,
        required: true,
        trim: true
    },

    product_description: {
        type: String,
        required: true
    },

    brands: {
        type: [brandSchema],
        validate: {
            validator: function (value) {
                return value.length > 0;
            },
            message: "At least one brand is required"
        }
    }

}, { timestamps: true });

export const ProductModel = mongoose.model("Product", productSchema);