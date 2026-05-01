const { Cart, CartItem } = require('../models/Cart');
const Product = require('../models/Product');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ where: { userId }, include: [{ model: CartItem, as: 'items' }] });
  if (!cart) cart = await Cart.create({ userId });
  return cart;
};

exports.getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({
      where: { userId: req.user.id },
      include: [{ model: CartItem, as: 'items', include: [{ model: Product }] }],
    });

    if (!cart) return res.json({ success: true, cart: { items: [], total: 0 } });

    const total = cart.items.reduce((sum, item) => sum + item.quantity * item.Product.price, 0);
    res.json({ success: true, cart, total: parseFloat(total).toFixed(2) });
  } catch (err) {
    next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findByPk(productId);
    if (!product || !product.isActive) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.stock < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });

    const cart = await getOrCreateCart(req.user.id);

    const existingItem = await CartItem.findOne({ where: { cartId: cart.id, productId } });
    if (existingItem) {
      await existingItem.update({ quantity: existingItem.quantity + quantity });
    } else {
      await CartItem.create({ cartId: cart.id, productId, quantity });
    }

    res.json({ success: true, message: 'Item added to cart' });
  } catch (err) {
    next(err);
  }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const item = await CartItem.findByPk(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Cart item not found' });

    if (quantity <= 0) {
      await item.destroy();
      return res.json({ success: true, message: 'Item removed from cart' });
    }

    await item.update({ quantity });
    res.json({ success: true, message: 'Cart updated' });
  } catch (err) {
    next(err);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const item = await CartItem.findByPk(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    await item.destroy();
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (err) {
    next(err);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.user.id } });
    if (cart) await CartItem.destroy({ where: { cartId: cart.id } });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
};
