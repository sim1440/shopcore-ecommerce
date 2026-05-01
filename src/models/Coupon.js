const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    set(value) {
      this.setDataValue('code', value.toUpperCase());
    },
  },
  type: {
    type: DataTypes.ENUM('percentage', 'fixed'),
    allowNull: false,
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  minOrderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  maxUses: {
    type: DataTypes.INTEGER,
    defaultValue: null,
  },
  usedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

Coupon.prototype.isValid = function (orderAmount) {
  const now = new Date();
  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };
  if (this.expiresAt && now > this.expiresAt) return { valid: false, message: 'Coupon has expired' };
  if (this.maxUses && this.usedCount >= this.maxUses) return { valid: false, message: 'Coupon usage limit reached' };
  if (orderAmount < this.minOrderAmount) return { valid: false, message: `Minimum order amount is $${this.minOrderAmount}` };
  return { valid: true };
};

Coupon.prototype.calculateDiscount = function (orderAmount) {
  if (this.type === 'percentage') {
    return (orderAmount * this.value) / 100;
  }
  return Math.min(this.value, orderAmount);
};

module.exports = Coupon;
