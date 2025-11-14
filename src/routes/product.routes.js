import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateStock,
  getSellerProducts,
  getFeaturedProducts,
  getTopSellingProducts,
  searchProducts,
  filterProducts,
  getRelatedProducts,
  getProductsByCategory,
  getProductsByBrand,
  getProductReviews,
  bulkUpdateStock,
  sellerGetAllProducts,
  recommendProducts,
} from "../controllers/product.controller.js";

import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();
router.get("/", getAllProducts);

router.get("/search/query", searchProducts);
router.get("/filter/query", filterProducts);
router.get("/featured/list", getFeaturedProducts);
router.get("/top-selling/list", getTopSellingProducts);
router.get("/recommended/list", recommendProducts);
router.get("/category/:categoryId", getProductsByCategory);
router.get("/brand/:brandId", getProductsByBrand);
router.get("/related/:id", getRelatedProducts);
router.get("/seller/:id",verifyJWT,authorizeRoles("seller"),getSellerProducts);
router.get("/:id/reviews", getProductReviews);
router.get("/:id", getProductById);


router.post(
  "/create",
  verifyJWT,
  authorizeRoles("seller"),
  upload.single("image"),
  createProduct
);

router.put(
  "/:id",
  verifyJWT,
  authorizeRoles("seller"),
  updateProduct
);

router.delete(
  "/:id",
  verifyJWT,
  authorizeRoles("seller"),
  deleteProduct
);

router.put(
  "/stock/:id",
  verifyJWT,
  authorizeRoles("seller"),
  updateStock
);


router.put(
  "/bulk-stock/update",
  verifyJWT,
  authorizeRoles("seller"),
  bulkUpdateStock
);


router.get(
  "/seller/all",
  verifyJWT,
  authorizeRoles("seller"),
  sellerGetAllProducts
);

export default router;
