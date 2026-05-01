// Run this to add demo data: node seed.js
require('dotenv').config();
const bcrypt = require('bcryptjs');

const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('shopcore', 'root', '', {
  host: 'localhost', dialect: 'mysql', logging: false
});

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connected!');

    // Raw queries for speed
    const q = (sql, r=[]) => sequelize.query(sql, { replacements: r, type: Sequelize.QueryTypes.RAW });

    const hash = await bcrypt.hash('demo1234', 12);
    const adminHash = await bcrypt.hash('admin1234', 12);

    // Categories
    await q(`INSERT IGNORE INTO Categories (id,name,description,createdAt,updatedAt) VALUES
      ('cat-shoes','Shoes','Footwear collection',NOW(),NOW()),
      ('cat-clothes','Clothing','Apparel and fashion',NOW(),NOW()),
      ('cat-bags','Bags','Handbags and accessories',NOW(),NOW())`);

    // Products
    await q(`INSERT IGNORE INTO Products (id,name,description,price,stock,categoryId,tags,isActive,averageRating,totalSales,createdAt,updatedAt) VALUES
      ('prod-1','Nike Air Max 270','Lightweight running shoes with Air cushioning',129.99,48,'cat-shoes','["running","nike","bestseller"]',1,4.8,320,NOW(),NOW()),
      ('prod-2','Adidas Ultraboost 23','Premium performance running shoe',189.99,22,'cat-shoes','["adidas","running","premium"]',1,4.9,210,NOW(),NOW()),
      ('prod-3','Lululemon Align Leggings','High-waist yoga leggings',98.00,35,'cat-clothes','["yoga","activewear","womens"]',1,4.7,180,NOW(),NOW()),
      ('prod-4','Zara Mini Dress','Floral summer mini dress',59.99,60,'cat-clothes','["summer","casual","trending"]',1,4.5,290,NOW(),NOW()),
      ('prod-5','Louis Vuitton Tote Bag','Classic monogram canvas tote',1200.00,5,'cat-bags','["luxury","designer","iconic"]',1,5.0,45,NOW(),NOW()),
      ('prod-6','New Balance 574','Classic retro sneaker',89.99,61,'cat-shoes','["newbalance","retro","classic"]',1,4.6,410,NOW(),NOW())`);

    // Demo customer
    await q(`INSERT IGNORE INTO Users (id,name,email,password,role,isActive,createdAt,updatedAt) VALUES
      ('user-demo','Harsimran Kaur','demo@shopcore.dev',?,'customer',1,NOW(),NOW())`, [hash]);

    // Coupons
    await q(`INSERT IGNORE INTO Coupons (id,code,type,value,minOrderAmount,maxUses,usedCount,isActive,expiresAt,createdAt,updatedAt) VALUES
      ('coup-1','SAVE20','percentage',20,50,100,12,1,'2027-01-01',NOW(),NOW()),
      ('coup-2','FLAT50','fixed',50,200,50,5,1,'2027-01-01',NOW(),NOW()),
      ('coup-3','WELCOME10','percentage',10,0,200,89,1,'2027-01-01',NOW(),NOW())`);

    console.log('✅ Seed data added!');
    console.log('👤 Customer: demo@shopcore.dev / demo1234');
    console.log('🔑 Admin:    admin@shopcore.dev / admin1234');
    process.exit(0);
  } catch(e) {
    console.error(e.message);
    process.exit(1);
  }
}
seed();
