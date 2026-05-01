const { Order, OrderItem } = require('../models/Order');
const Product = require('../models/Product');

exports.getRecommendations = async (req, res, next) => {
  try {
    // Get user's order history
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [{ model: OrderItem, as: 'items', include: [{ model: Product, attributes: ['name', 'tags', 'categoryId'] }] }],
      limit: 10,
      order: [['createdAt', 'DESC']],
    });

    const purchasedProducts = orders.flatMap((o) =>
      o.items.map((i) => ({ name: i.Product.name, tags: i.Product.tags, categoryId: i.Product.categoryId }))
    );

    // Get some available products to recommend from
    const availableProducts = await Product.findAll({
      where: { isActive: true },
      limit: 30,
      order: [['totalSales', 'DESC']],
    });

    const productList = availableProducts.map((p) => `- ${p.name} ($${p.price}) [tags: ${(p.tags || []).join(', ')}]`).join('\n');
    const historyList = purchasedProducts.length
      ? purchasedProducts.map((p) => `- ${p.name}`).join('\n')
      : 'No purchase history yet';

    const prompt = `You are a smart e-commerce recommendation engine.

User's purchase history:
${historyList}

Available products:
${productList}

Based on the user's purchase history, recommend 4 products from the available list that they are most likely to enjoy. 
If there's no purchase history, recommend the most popular/trending items.

Respond ONLY with a valid JSON array like this (no extra text):
[
  { "name": "Product Name", "reason": "Short reason why they'd like it" },
  ...
]`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content[0].text.trim();
    const recommendations = JSON.parse(text);

    // Match recommendations back to real products
    const enriched = recommendations.map((rec) => {
      const match = availableProducts.find((p) => p.name.toLowerCase().includes(rec.name.toLowerCase().split(' ')[0]));
      return { ...rec, product: match || null };
    });

    res.json({ success: true, recommendations: enriched });
  } catch (err) {
    next(err);
  }
};
