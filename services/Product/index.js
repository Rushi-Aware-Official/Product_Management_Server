import { ProductModel } from "../../schemas/Product.Schema.js";
import PDFDocument from "pdfkit";
import mongoose from "mongoose";

//Add Product with brand Function
export const addProduct = async (req, res) => {
  try {
    const sellerId = req.user.id;
    let { product_name, product_description, brands } = req.body;

    // Trim inputs
    product_name = product_name?.trim();
    product_description = product_description?.trim();

    // Basic validations
    if (!product_name)
      return res.status(400).json({ message: "Product name is required" });

    if (!product_description)
      return res.status(400).json({ message: "Product description is required" });

    if (!Array.isArray(brands) || brands.length === 0)
      return res.status(400).json({ message: "At least one brand is required" });

    // Prevent duplicate product for same seller
    const existingProduct = await ProductModel.findOne({
      seller: sellerId,
      product_name: { $regex: `^${product_name}$`, $options: "i" }
    });

    if (existingProduct) {
      return res.status(409).json({
        message: "Product with this name already exists"
      });
    }

    // Brand validations
    for (const brand of brands) {
      if (!brand.brand_name?.trim())
        return res.status(400).json({ message: "Brand name is required" });

      if (!brand.detail?.trim())
        return res.status(400).json({ message: "Brand detail is required" });

      if (!brand.image)
        return res.status(400).json({ message: "Brand image is required" });

      if (!brand.price || brand.price <= 0)
        return res.status(400).json({ message: "Brand price must be greater than 0" });
    }

    const product = await ProductModel.create({
      seller: sellerId,
      product_name,
      product_description,
      brands
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: product
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

//Get All Product data With Pagination Function
export const getAllProducts = async (req, res) => {
  try {

    const sellerId = req.user.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalProducts = await ProductModel.countDocuments({ seller: sellerId });

    const products = await ProductModel
      .find({ seller: sellerId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: totalProducts,
      page,
      totalPages: Math.ceil(totalProducts / limit),
      data: products
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

//Get Id wies Product data Function
export const getProductById = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const productId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const product = await ProductModel.findOne({
      _id: productId,
      seller: sellerId
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {

    console.error("Product Fetch Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }
};

//Update the product wies Id Function
export const updateProduct = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const productId = req.params.id;
    let { product_name, product_description, brands } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    // Trim inputs
    product_name = product_name?.trim();
    product_description = product_description?.trim();

    // Validate fields
    if (!product_name)
      return res.status(400).json({ message: "Product name is required" });

    if (!product_description)
      return res.status(400).json({ message: "Product description is required" });

    if (!Array.isArray(brands) || brands.length === 0)
      return res.status(400).json({ message: "At least one brand is required" });

    // Validate brands
    for (const brand of brands) {

      if (!brand.brand_name?.trim())
        return res.status(400).json({ message: "Brand name is required" });

      if (!brand.detail?.trim())
        return res.status(400).json({ message: "Brand detail is required" });

      if (!brand.image)
        return res.status(400).json({ message: "Brand image is required" });

      if (!brand.price || brand.price <= 0)
        return res.status(400).json({ message: "Brand price must be greater than 0" });

    }

    // Check if product exists for this seller
    const product = await ProductModel.findOne({
      _id: productId,
      seller: sellerId
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unauthorized"
      });
    }

    // Prevent duplicate product name for same seller
    const duplicateProduct = await ProductModel.findOne({
      seller: sellerId,
      product_name: { $regex: `^${product_name}$`, $options: "i" },
      _id: { $ne: productId }
    });

    if (duplicateProduct) {
      return res.status(409).json({
        success: false,
        message: "Product with this name already exists"
      });
    }

    // Update product
    product.product_name = product_name;
    product.product_description = product_description;
    product.brands = brands;

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//Delete Product Using the Id 
export const deleteProduct = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const productId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id"
      });
    }

    const product = await ProductModel.findOneAndDelete({
      _id: productId,
      seller: sellerId
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unauthorized"
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

//Pdf Generating Function
export const viewProductPDF = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const productId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id"
      });
    }

    const product = await ProductModel.findOne({
      _id: productId,
      seller: sellerId
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=${product.product_name}.pdf`
    );

    doc.pipe(res);
    doc.fontSize(20).text("Product Details", { underline: true });
    doc.moveDown();
    doc.fontSize(14).text(`Product Name: ${product.product_name}`);
    doc.text(`Description: ${product.product_description}`);
    doc.moveDown();
    doc.text("Brands:");

    let totalPrice = 0;

    product.brands.forEach((brand, index) => {

      doc.moveDown();
      doc.text(`Brand ${index + 1}`);
      doc.text(`Name: ${brand.brand_name}`);
      doc.text(`Detail: ${brand.detail}`);
      doc.text(`Price: ${brand.price}`);

      totalPrice += brand.price;
    });

    doc.moveDown();
    doc.fontSize(16).text(`Total Price: ${totalPrice}`);
    doc.end();

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


