require('dotenv').config();
const http = require('http');
const app = require('./app');
const sequelize = require('./config/database');
const socketConfig = require('./config/socket');

// Import all models to register associations
const User = require('./models/User');
const Product = require('./models/Product');
const Category = require('./models/Category');
const { Cart, CartItem } = require('./models/Cart');
const { Order, OrderItem } = require('./models/Order');
const Coupon = require('./models/Coupon');

// Associations
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Product, { foreignKey: 'categoryId' });
User.hasOne(Cart, { foreignKey: 'userId' });
Cart.belongsTo(User, { foreignKey: 'userId' });
CartItem.belongsTo(Product, { foreignKey: 'productId' });
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
socketConfig.init(server);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected successfully');

    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');

    server.listen(PORT, () => {
      console.log(`🚀 ShopCore API running on http://localhost:${PORT}`);
      console.log(`📡 WebSocket server ready`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
