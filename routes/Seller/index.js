import express from "express";
import { verify } from "../../middlewares/jwt.js";
import { addSellerByAdmin, getAllSellers, getSellerById, updateSellerProfile } from "../../services/Seller/index.js";

const routes = express.Router();

routes.post("/create-seller", verify, addSellerByAdmin);
routes.get("/get-sellers", verify, getAllSellers);
routes.get("/get-seller/:id", verify, getSellerById);
routes.put("/update-sellerProfile", verify, updateSellerProfile);

export default routes;
