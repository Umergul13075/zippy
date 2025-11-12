import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Payment } from "../models/payment.model.js";
import { Order} from "../models/order.model.js"
import { stripe } from "../config/stripe.config.js";
import mongoose from "mongoose";


const createPayment = asyncHandler(async (req, res) => {
  const { order, method, amount, transactionId, paidAt } = req.body;

  if (!order || !method || !amount) {
    throw new ApiError(400, "Order, method, and amount are required");
  }

  const validMethods = ["card", "cash_on_delivery", "bank_transfer", "wallet"];
  if (!validMethods.includes(method)) {
    throw new ApiError(400, "Invalid payment method");
  }

  const orderExists = await Order.findById(order);
  if (!orderExists) throw new ApiError(404, "Order not found");

  if (amount !== orderExists.totalAmount) {
   throw new ApiError(400, "Amount mismatch with order total");
   }
   
  const payment = await Payment.create({
    order,
    method,
    amount,
    status: "pending",
    transactionId: transactionId || null,
    paidAt: paidAt || null,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, payment, "Payment created successfully"));
});

const getPaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
  throw new ApiError(400, "Invalid payment ID");
  }
  const payment = await Payment.findById(id)
    .populate("order", "totalAmount status user")
    .lean();

  if (!payment) throw new ApiError(404, "Payment not found");

  return res
    .status(200)
    .json(new ApiResponse(200, payment, "Payment fetched successfully"));
});

const getAllPayments = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const payments = await Payment
    .find()
    .skip(skip)
    .limit(limit)
    .populate("order", "totalAmount status user")
    .sort({ createdAt: -1 })
    .lean();

  if (!payments.length) throw new ApiError(404, "No payments found");

  return res
    .status(200)
    .json(new ApiResponse(200, payments, "All payments fetched successfully"));
});

const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
  throw new ApiError(400, "Invalid payment ID");
  }

  const validStatuses = ["pending", "completed", "failed"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid payment status");
  }

  const payment = await Payment.findById(id);
  if (!payment) throw new ApiError(404, "Payment not found");

  payment.status = status;
  if (status === "completed") payment.paidAt = new Date();
  await payment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, payment, "Payment status updated successfully"));
});


const deletePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const payment = await Payment.findById(id);
  if (!payment) throw new ApiError(404, "Payment not found");

  await payment.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Payment deleted successfully"));
});


const getPaymentsByFilter = asyncHandler(async (req, res) => {
  const { status, method } = req.query;
  const query = {};

  if (status) query.status = status;
  if (method) query.method = method;

  const payments = await Payment.find(query)
    .populate("order", "totalAmount status user")
    .sort({ createdAt: -1 })
    .lean();

  if (!payments.length) throw new ApiError(404, "No payments found for given filter");

  return res
    .status(200)
    .json(new ApiResponse(200, payments, "Payments fetched by filter"));
});

const getUserPayments = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const payments = await Payment.find()
    .populate({
      path: "order",
      match: { user: userId },
      select: "totalAmount status createdAt"
    })
    .sort({ createdAt: -1 })
    .lean();

  const userPayments = payments.filter(p => p.order !== null);

  if (!userPayments.length) throw new ApiError(404, "No payments found for this user");

  return res.status(200)
    .json(new ApiResponse(200, userPayments, "User payments fetched successfully"));
});

const getSellerPayments = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    throw new ApiError(400, "Invalid seller ID");
  }

  const payments = await Payment.find()
    .populate({
      path: "order",
      match: { seller: sellerId },
      select: "totalAmount status createdAt"
    })
    .sort({ createdAt: -1 })
    .lean();

  const sellerPayments = payments.filter(p => p.order !== null);

  if (!sellerPayments.length) throw new ApiError(404, "No payments found for this seller");

  return res.status(200)
    .json(new ApiResponse(200, sellerPayments, "Seller payments fetched successfully"));
});

const refundPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid payment ID");
  }

  const payment = await Payment.findById(id);
  if (!payment) throw new ApiError(404, "Payment not found");

  if (payment.status !== "completed") {
    throw new ApiError(400, "Only completed payments can be refunded");
  }

  payment.status = "refunded";
  payment.refundReason = reason || "No reason specified";
  payment.refundedAt = new Date();
  await payment.save();

  return res.status(200).json(
    new ApiResponse(200, payment, "Payment refunded successfully")
  );
});

const retryPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { transactionId } = req.body;

  const payment = await Payment.findById(id);
  if (!payment) throw new ApiError(404, "Payment not found");

  if (payment.status !== "failed") {
    throw new ApiError(400, "Only failed payments can be retried");
  }

  if (payment.retryCount >= 3) {
  throw new ApiError(400, "Maximum retry attempts reached");
  }

  payment.status = "pending";
  payment.transactionId = transactionId || null;
  payment.retryCount = (payment.retryCount || 0) + 1;
  await payment.save();

  return res.status(200).json(
    new ApiResponse(200, payment, "Payment retry initiated successfully")
  );
});

// for admin dashboard
const getPaymentStats = asyncHandler(async (req, res) => {
  const stats = await Payment.aggregate([
    {
      $group: {
        _id: "$status",
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  return res.status(200)
    .json(new ApiResponse(200, stats, "Payment statistics fetched successfully"));
});
// for admin
const getRecentPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate("order", "user totalAmount")
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return res.status(200)
    .json(new ApiResponse(200, payments, "Recent payments fetched successfully"));
});


const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    // Verify Stripe’s signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400)
    .send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log("Payment succeeded:", paymentIntent.id);

        // Find the payment record and update its status
        await Payment.findOneAndUpdate(
          { transactionId: paymentIntent.id },
          {
            status: "completed",
            paidAt: new Date(),
          }
        );

        // Also mark order as paid
        await Order.findOneAndUpdate(
          { _id: paymentIntent.metadata.orderId },
          { status: "Paid" }
        );

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        console.log(" Payment failed:", paymentIntent.id);

        await Payment.findOneAndUpdate(
          { transactionId: paymentIntent.id },
          { status: "failed" }
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200)
    .json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error.message);
    res.status(500)
    .json({ error: "Webhook handling failed" });
  }
};


export {
    createPayment,
    getAllPayments,
    getPaymentById,
    deletePayment,
    updatePaymentStatus,
    getPaymentsByFilter,
    getUserPayments,
    getSellerPayments,
    refundPayment,
    retryPayment,
    getPaymentStats,
    getRecentPayments,
    handleStripeWebhook
}