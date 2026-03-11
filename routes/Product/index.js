import express from "express";
import { verify } from "../../middlewares/jwt.js";
import { addProduct, deleteProduct, getAllProducts, getProductById, updateProduct, viewProductPDF } from "../../services/index.js";

const routes = express.Router();

routes.post("/add-product", verify, addProduct);
routes.get("/get-product", verify, getAllProducts);
routes.get("/get-product/:id", verify, getProductById);
routes.put("/update-product/:id", verify, updateProduct);
routes.delete("/delete-product/:id", verify, deleteProduct);
routes.get("/get-pdf/:id", verify, viewProductPDF);

export default routes;
