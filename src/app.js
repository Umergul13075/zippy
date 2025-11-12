import express from "express";
import cookieParser from "cookie-parser";
import cors from 'cors';
import bodyParser from "body-parser";
import userRoutes from "./routes/user.routes.js"
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import addressRoutes from './routes/address.routes.js';
import chatRoutes from "./routes/chat.routes.js";
import discountsRoutes from "./routes/discount.routes.js";
import brandRoutes from "./routes/brand.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import analyticsRoutes from "./routes/log.routes.js";
import orderItemRoutes from "./routes/orderItem.routes.js";
import returnRoutes from "./routes/return.routes.js";
import notificationRoutes from "./routes/notifications.routes.js";
import searchHistoryRoutes from "./routes/searchHistory.routes.js";
import sellerRoutes from "./routes/seller.routes.js";
import shippingRoutes from "./routes/shipping.routes.js";
import subCategoryRoutes from "./routes/subCategory.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { handleStripeWebhook } from "./controllers/payment.controller.js";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

app.post(
  "/api/v1/payments/webhook",
  bodyParser.raw({ type: "application/json" }),
  handleStripeWebhook
);

app.use(express.json({limit: "16kb"}))

app.use(express.urlencoded({extended: true, limit: "16kb"}))

app.use(express.static("public"))

app.use(cookieParser())

app.use("/api/v1/users", userRoutes)
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/address", addressRoutes)
app.use("/api/v1/chats", chatRoutes);
app.use("/api/v1/discounts", discountsRoutes);
app.use("/api/v1/inventories", inventoryRoutes);
app.use("/api/v1/logs", analyticsRoutes);          
app.use("/api//v1/notifications", notificationRoutes);
app.use("/api/v1/brands", brandRoutes);
app.use("/api/v1/order-items", orderItemRoutes);
app.use("/api/v1/return", returnRoutes)
app.use("/api/v1/search-history", searchHistoryRoutes);
app.use("/api/v1/sellers", sellerRoutes);
app.use("/api/v1/shippings", shippingRoutes);
app.use("/api/v1/subCategories", subCategoryRoutes);
app.use("/api/v1/transactions", transactionRoutes);

app.use(errorHandler);






export { app } 