const mongoose = require('mongoose')


const OrderSchema = new mongoose.Schema({
    productId: String,
    customerId: String,
    quantity: Number,
    status: { type: String, default: "Pending" },
    paymentMethod: String,
    createdAt: { type: Date, default: Date.now }
  });
  
  const OrderModel = mongoose.model("Order", OrderSchema);
  module.exports = OrderModel