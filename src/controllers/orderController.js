const { Order, OrderItem } = require('../models/Order');
const { Cart, CartItem } = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const socketConfig = require('../config/socket');

exports.placeOrder = async (req, res, next) => {
  try {
    const { shippingAddress, couponCode, notes } = req.body;

    const cart = await Cart.findOne({
      where: { userId: req.user.id },
      include: [{ model: CartItem, as: 'items', include: [{ model: Product }] }],
    });

    if (!cart || !cart.items.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    let totalAmount = cart.items.reduce((sum, item) => sum + item.quantity * item.Product.price, 0);
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      appliedCoupon = await Coupon.findOne({ where: { code: couponCode.toUpperCase() } });
      if (appliedCoupon) {
        const validity = appliedCoupon.isValid(totalAmount);
        if (validity.valid) {
          discountAmount = appliedCoupon.calculateDiscount(totalAmount);
          appliedCoupon.usedCount += 1;
          await appliedCoupon.save();
        }
      }
    }

    const finalAmount = totalAmount - discountAmount;

    const order = await Order.create({
      userId: req.user.id,
      totalAmount: finalAmount,
      discountAmount,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      shippingAddress,
      notes,
      status: 'pending',
    });

    const orderItems = cart.items.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.Product.price,
    }));

    await OrderItem.bulkCreate(orderItems);

    // Update product stock
    for (const item of cart.items) {
      await item.Product.update({ stock: item.Product.stock - item.quantity, totalSales: item.Product.totalSales + item.quantity });
    }

    // Clear cart
    await CartItem.destroy({ where: { cartId: cart.id } });

    // Emit real-time event
    try {
      const io = socketConfig.getIO();
      io.to(`order_${order.id}`).emit('order_update', { orderId: order.id, status: 'pending' });
    } catch (_) {}

    res.status(201).json({ success: true, message: 'Order placed successfully', order });
  } catch (err) {
    next(err);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [{ model: OrderItem, as: 'items', include: [{ model: Product, attributes: ['name', 'imageUrl'] }] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: OrderItem, as: 'items', include: [{ model: Product }] }],
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    }

    await order.update({ status: 'cancelled' });

    try {
      const io = socketConfig.getIO();
      io.to(`order_${order.id}`).emit('order_update', { orderId: order.id, status: 'cancelled' });
    } catch (_) {}

    res.json({ success: true, message: 'Order cancelled', order });
  } catch (err) {
    next(err);
  }
};

// Admin: update order status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    await order.update({ status });

    try {
      const io = socketConfig.getIO();
      io.to(`order_${order.id}`).emit('order_update', { orderId: order.id, status });
    } catch (_) {}

    res.json({ success: true, message: 'Order status updated', order });
  } catch (err) {
    next(err);
  }
};
