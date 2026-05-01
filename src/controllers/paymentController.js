const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Order } = require('../models/Order');

exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ where: { id: orderId, userId: req.user.id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.paymentStatus === 'paid') return res.status(400).json({ success: false, message: 'Order already paid' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100), // in cents
      currency: 'usd',
      metadata: { orderId: order.id, userId: req.user.id },
    });

    await order.update({ stripePaymentIntentId: paymentIntent.id });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    next(err);
  }
};

exports.stripeWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return res.status(400).json({ message: `Webhook error: ${err.message}` });
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const order = await Order.findOne({ where: { stripePaymentIntentId: paymentIntent.id } });
      if (order) {
        await order.update({ paymentStatus: 'paid', status: 'confirmed' });
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const order = await Order.findOne({ where: { stripePaymentIntentId: paymentIntent.id } });
      if (order) await order.update({ paymentStatus: 'unpaid' });
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
};
