const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/authController');
const productController = require('../controllers/productController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const paymentController = require('../controllers/paymentController');
const adminController = require('../controllers/adminController');
const recommendationController = require('../controllers/recommendationController');
const Category = require('../models/Category');
const { protect, adminOnly } = require('../middleware/auth');

// ─── AUTH ────────────────────────────────────────────────
router.post('/auth/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], authController.register);

router.post('/auth/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], authController.login);

router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/logout', protect, authController.logout);
router.get('/auth/me', protect, authController.getMe);

// ─── PRODUCTS ────────────────────────────────────────────
router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProduct);
router.post('/products', protect, adminOnly, [
  body('name').notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('stock').isInt({ min: 0 }),
], productController.createProduct);
router.put('/products/:id', protect, adminOnly, productController.updateProduct);
router.delete('/products/:id', protect, adminOnly, productController.deleteProduct);

// ─── CATEGORIES ──────────────────────────────────────────
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Category.findAll({ include: [{ model: Category, as: 'subcategories' }], where: { parentId: null } });
    res.json({ success: true, categories });
  } catch (err) { next(err); }
});

router.post('/categories', protect, adminOnly, async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, category });
  } catch (err) { next(err); }
});

router.put('/categories/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    await category.update(req.body);
    res.json({ success: true, category });
  } catch (err) { next(err); }
});

router.delete('/categories/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    await category.destroy();
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
});

// ─── CART ────────────────────────────────────────────────
router.get('/cart', protect, cartController.getCart);
router.post('/cart', protect, cartController.addToCart);
router.put('/cart/:itemId', protect, cartController.updateCartItem);
router.delete('/cart/:itemId', protect, cartController.removeFromCart);
router.delete('/cart', protect, cartController.clearCart);

// ─── ORDERS ──────────────────────────────────────────────
router.post('/orders', protect, orderController.placeOrder);
router.get('/orders', protect, orderController.getMyOrders);
router.get('/orders/:id', protect, orderController.getOrder);
router.patch('/orders/:id/cancel', protect, orderController.cancelOrder);

// ─── PAYMENTS ────────────────────────────────────────────
router.post('/payments/create-intent', protect, paymentController.createPaymentIntent);
router.post('/payments/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

// ─── AI RECOMMENDATIONS ──────────────────────────────────
router.get('/recommendations', protect, recommendationController.getRecommendations);

// ─── ADMIN ───────────────────────────────────────────────
router.get('/admin/dashboard', protect, adminOnly, adminController.getDashboardStats);
router.get('/admin/users', protect, adminOnly, adminController.getAllUsers);
router.patch('/admin/users/:id/toggle', protect, adminOnly, adminController.toggleUserStatus);
router.patch('/admin/orders/:id/status', protect, adminOnly, orderController.updateOrderStatus);
router.get('/admin/coupons', protect, adminOnly, adminController.getAllCoupons);
router.post('/admin/coupons', protect, adminOnly, adminController.createCoupon);
router.delete('/admin/coupons/:id', protect, adminOnly, adminController.deleteCoupon);
router.post('/coupons/validate', protect, adminController.validateCoupon);

module.exports = router;
