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
  adminGetAllProducts,
  recommendProducts,
} from "../controllers/product.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();
router.get("/", getAllProducts);

router.get("/:id", getProductById);
router.get("/search/query", searchProducts);
router.get("/filter/query", filterProducts);
router.get("/featured/list", getFeaturedProducts);
router.get("/top-selling/list", getTopSellingProducts);
router.get("/related/:id", getRelatedProducts);
router.get("/category/:categoryId", getProductsByCategory);
router.get("/brand/:brandId", getProductsByBrand);
router.get("/:id/reviews", getProductReviews);
router.get("/recommended/list", recommendProducts);


router.post(
  "/create",
  verifyJWT,
  authorizeRoles("seller", "admin"),
  upload.single("image"),
  createProduct
);

router.put(
  "/:id",
  verifyJWT,
  authorizeRoles("seller", "admin"),
  updateProduct
);

router.delete(
  "/:id",
  verifyJWT,
  authorizeRoles("seller", "admin"),
  deleteProduct
);

router.put(
  "/stock/:id",
  verifyJWT,
  authorizeRoles("seller", "admin"),
  updateStock
);


router.get(
  "/seller/:id",
  verifyJWT,
  authorizeRoles("seller", "admin"),
  getSellerProducts
);

router.put(
  "/bulk-stock/update",
  verifyJWT,
  authorizeRoles("seller", "admin"),
  bulkUpdateStock
);


router.get(
  "/admin/all",
  verifyJWT,
  authorizeRoles("admin"),
  adminGetAllProducts
);

export default router;
