const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { sequelize, User, Category, MenuItem, Order, OrderItem } = require('../models');
const {
  assertSafeForOrdinarySeed,
  assertDatabaseEmptyForSeed,
} = require('../utils/dbSafety');

// Ensure sample images exist in uploads directory
const createPlaceholderImages = () => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const sampleImages = [
    { name: 'truffle-bruschetta.svg', color: '#E28743', title: 'Truffle Bruschetta' },
    { name: 'calamari.svg', color: '#E07A5F', title: 'Crispy Calamari' },
    { name: 'ribeye-steak.svg', color: '#8D0801', title: 'Dry-Aged Ribeye' },
    { name: 'salmon-fillet.svg', color: '#F4A261', title: 'Pan-Seared Salmon' },
    { name: 'margherita-pizza.svg', color: '#D90429', title: 'Margherita Pizza' },
    { name: 'truffle-pasta.svg', color: '#DDA15E', title: 'Truffle Fettuccine' },
    { name: 'wagyu-burger.svg', color: '#774936', title: 'Prime Wagyu Burger' },
    { name: 'crispy-chicken-burger.svg', color: '#BC6C25', title: 'Spicy Chicken Burger' },
    { name: 'tiramisu.svg', color: '#6F4E37', title: 'Classic Tiramisu' },
    { name: 'lava-cake.svg', color: '#3D0C02', title: 'Molten Lava Cake' },
    { name: 'berry-lemonade.svg', color: '#2A9D8F', title: 'Wild Berry Lemonade' },
    { name: 'cold-brew.svg', color: '#264653', title: 'Vanilla Nitro Cold Brew' },
  ];

  for (const img of sampleImages) {
    const filePath = path.join(uploadsDir, img.name);
    if (!fs.existsSync(filePath)) {
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${img.color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#grad)" rx="16"/>
  <circle cx="300" cy="180" r="70" fill="rgba(255,255,255,0.15)"/>
  <text x="300" y="195" font-family="system-ui, sans-serif" font-size="48" font-weight="bold" fill="#ffffff" text-anchor="middle">🍽️</text>
  <text x="300" y="290" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#ffffff" text-anchor="middle">${img.title}</text>
  <text x="300" y="325" font-family="system-ui, sans-serif" font-size="16" fill="rgba(255,255,255,0.8)" text-anchor="middle">Gourmet Restaurant System</text>
</svg>`;
      fs.writeFileSync(filePath, svgContent, 'utf8');
    }
  }
};

/**
 * Inserts sample data into the database.
 * Omits admin accounts. Requires explicitly supplied SEED_USER_PASSWORD in env.
 */
const seedData = async () => {
  createPlaceholderImages();
  console.log('✅ Sample uploaded food assets verified.');

  const seedPassword = process.env.SEED_USER_PASSWORD || process.env.SEED_DEFAULT_PASSWORD;
  if (!seedPassword) {
    throw new Error(
      '[SECURITY ERROR] Seeding aborted: Required environment variable SEED_USER_PASSWORD is not set.\n' +
      'Development sample accounts require an explicitly supplied password in your environment.\n' +
      'Never fall back to a public or hardcoded default credential.'
    );
  }

  // 1. Seed Users (Excluding admin accounts)
  console.log('👤 Seeding sample development users (customer & staff only, no admin)...');
  const hashedSeedPassword = await bcrypt.hash(seedPassword, 10);

  const users = await User.bulkCreate([
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'customer',
      phone: '+1 (555) 234-5678',
      password: hashedSeedPassword,
    },
    {
      name: 'Bob Smith',
      email: 'bob@example.com',
      role: 'customer',
      phone: '+1 (555) 345-6789',
      password: hashedSeedPassword,
    },
    {
      name: 'Chef Marco Rossi',
      email: 'marco@restaurant.com',
      role: 'staff',
      phone: '+1 (555) 456-7890',
      password: hashedSeedPassword,
    },
  ]);

  // 2. Seed Categories
  console.log('📂 Seeding Categories...');
  const categories = await Category.bulkCreate([
    {
      name: 'Starters & Appetizers',
      description: 'Crisp, tantalizing small plates to kick off your culinary experience.',
    },
    {
      name: 'Signature Mains',
      description: 'Chef-crafted meat, poultry, and seafood prepared to mouthwatering perfection.',
    },
    {
      name: 'Woodfired Pizzas & Pastas',
      description: 'Traditional hearth-baked Neapolitan pizzas and hand-rolled pasta.',
    },
    {
      name: 'Gourmet Burgers',
      description: 'Juicy 100% prime patties paired with artisan brioche buns and seasoned fries.',
    },
    {
      name: 'Artisan Desserts',
      description: 'Sweet indulgences made fresh in our pastry kitchen each morning.',
    },
    {
      name: 'Beverages & Mocktails',
      description: 'Refreshing botanicals, specialty sodas, and hand-shaken mocktails.',
    },
  ]);

  // 3. Seed MenuItems
  console.log('🍔 Seeding Menu Items...');
  const menuItems = await MenuItem.bulkCreate([
    // Starters
    {
      name: 'Truffle & Herb Bruschetta',
      description: 'Grilled sourdough topped with vine-ripened tomatoes, white truffle oil, and aged balsamic glaze.',
      price: 11.50,
      categoryId: categories[0].id,
      imageUrl: '/uploads/truffle-bruschetta.svg',
      isAvailable: true,
    },
    {
      name: 'Crispy Calamari Fritti',
      description: 'Tender squid rings lightly dusted with smoked paprika and served with lemon-garlic aioli.',
      price: 14.00,
      categoryId: categories[0].id,
      imageUrl: '/uploads/calamari.svg',
      isAvailable: true,
    },
    // Mains
    {
      name: 'Dry-Aged Ribeye Steak',
      description: '12oz prime cut beef grilled to your liking, served with truffle butter and roasted asparagus.',
      price: 34.50,
      categoryId: categories[1].id,
      imageUrl: '/uploads/ribeye-steak.svg',
      isAvailable: true,
    },
    {
      name: 'Pan-Seared Atlantic Salmon',
      description: 'Crispy skin salmon over creamy saffron risotto, charred broccolini, and lemon beurre blanc.',
      price: 27.00,
      categoryId: categories[1].id,
      imageUrl: '/uploads/salmon-fillet.svg',
      isAvailable: true,
    },
    // Pizza & Pasta
    {
      name: 'Classic Margherita Pizza',
      description: 'San Marzano tomato sauce, fresh buffalo mozzarella, fragrant sweet basil, and extra virgin olive oil.',
      price: 16.50,
      categoryId: categories[2].id,
      imageUrl: '/uploads/margherita-pizza.svg',
      isAvailable: true,
    },
    {
      name: 'Black Truffle Fettuccine',
      description: 'Fresh handmade pasta ribbons in a rich black truffle and 24-month Parmigiano-Reggiano cream sauce.',
      price: 22.00,
      categoryId: categories[2].id,
      imageUrl: '/uploads/truffle-pasta.svg',
      isAvailable: true,
    },
    // Burgers
    {
      name: 'Prime Wagyu Cheeseburger',
      description: 'Half-pound Wagyu patty, aged cheddar, caramelized shallots, brioche bun, and house secret sauce.',
      price: 19.50,
      categoryId: categories[3].id,
      imageUrl: '/uploads/wagyu-burger.svg',
      isAvailable: true,
    },
    {
      name: 'Spicy Nashville Chicken Burger',
      description: 'Buttermilk fried chicken tossed in hot spice blend, sweet pickles, and creamy coleslaw.',
      price: 17.50,
      categoryId: categories[3].id,
      imageUrl: '/uploads/crispy-chicken-burger.svg',
      isAvailable: true,
    },
    // Desserts
    {
      name: 'Classic Venetian Tiramisu',
      description: 'Espresso-soaked savoiardi ladyfingers layered with whipped mascarpone and dark cocoa powder.',
      price: 9.50,
      categoryId: categories[4].id,
      imageUrl: '/uploads/tiramisu.svg',
      isAvailable: true,
    },
    {
      name: 'Molten Belgian Lava Cake',
      description: 'Warm dark chocolate cake with a molten center, served with Madagascan vanilla bean gelato.',
      price: 10.50,
      categoryId: categories[4].id,
      imageUrl: '/uploads/lava-cake.svg',
      isAvailable: true,
    },
    // Beverages
    {
      name: 'Sparkling Wild Berry Lemonade',
      description: 'Freshly squeezed lemons infused with crushed blackberries, mint sprigs, and soda water.',
      price: 6.00,
      categoryId: categories[5].id,
      imageUrl: '/uploads/berry-lemonade.svg',
      isAvailable: true,
    },
    {
      name: 'Vanilla Nitro Cold Brew',
      description: 'Slow-steeped single-origin coffee infused with nitrogen and vanilla bean syrup.',
      price: 5.50,
      categoryId: categories[5].id,
      imageUrl: '/uploads/cold-brew.svg',
      isAvailable: true,
    },
  ]);

  // 4. Seed Orders inside a transaction
  console.log('🧾 Seeding Sample Orders...');
  await sequelize.transaction(async (t) => {
    // Order 1: Alice's ready order
    const order1 = await Order.create(
      {
        userId: users[0].id,
        status: 'ready',
        totalAmount: 37.00,
        notes: 'Please pack extra napkins and dressing on the side.',
      },
      { transaction: t }
    );

    await OrderItem.bulkCreate(
      [
        {
          orderId: order1.id,
          menuItemId: menuItems[4].id, // Margherita
          quantity: 1,
          unitPrice: 16.50,
          subtotal: 16.50,
        },
        {
          orderId: order1.id,
          menuItemId: menuItems[0].id, // Bruschetta
          quantity: 1,
          unitPrice: 11.50,
          subtotal: 11.50,
        },
        {
          orderId: order1.id,
          menuItemId: menuItems[8].id, // Tiramisu
          quantity: 1,
          unitPrice: 9.50,
          subtotal: 9.50,
        },
      ],
      { transaction: t }
    );

    // Order 2: Bob's preparing order
    const order2 = await Order.create(
      {
        userId: users[1].id,
        status: 'preparing',
        totalAmount: 40.00,
        notes: 'Medium-rare for the burger please.',
      },
      { transaction: t }
    );

    await OrderItem.bulkCreate(
      [
        {
          orderId: order2.id,
          menuItemId: menuItems[6].id, // Wagyu burger
          quantity: 1,
          unitPrice: 19.50,
          subtotal: 19.50,
        },
        {
          orderId: order2.id,
          menuItemId: menuItems[1].id, // Calamari
          quantity: 1,
          unitPrice: 14.00,
          subtotal: 14.00,
        },
        {
          orderId: order2.id,
          menuItemId: menuItems[10].id, // Berry Lemonade
          quantity: 1,
          unitPrice: 6.50,
          subtotal: 6.50,
        },
      ],
      { transaction: t }
    );

    // Order 3: Completed order for Alice
    const order3 = await Order.create(
      {
        userId: users[0].id,
        status: 'completed',
        totalAmount: 45.00,
        notes: 'Dine-in Table 4',
      },
      { transaction: t }
    );

    await OrderItem.bulkCreate(
      [
        {
          orderId: order3.id,
          menuItemId: menuItems[2].id, // Ribeye
          quantity: 1,
          unitPrice: 34.50,
          subtotal: 34.50,
        },
        {
          orderId: order3.id,
          menuItemId: menuItems[9].id, // Lava cake
          quantity: 1,
          unitPrice: 10.50,
          subtotal: 10.50,
        },
      ],
      { transaction: t }
    );
  });
};

/**
 * Normal, non-destructive seed command.
 * Strictly verifies environment safety and refuses to overwrite an existing database.
 */
const seedDatabase = async () => {
  try {
    // 1. Verify environment safety
    assertSafeForOrdinarySeed();

    console.log('🔄 Connecting to database for safe seeding...');
    await sequelize.authenticate();
    console.log('✅ Connected.');

    // 2. Safe table synchronization without force
    await sequelize.sync({ force: false });

    // 3. Ensure database is empty before inserting data
    await assertDatabaseEmptyForSeed({ User, Category, MenuItem });

    // 4. Seed data
    await seedData();

    console.log('🎉 Database successfully seeded with sample categories, menu items, orders, and non-admin users.');
    console.log('ℹ️  Note: Administrator accounts are NOT seeded. Use "npm run admin:create" to provision an administrator.');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    try {
      await sequelize.close();
    } catch {
      // Ignore close errors
    }
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = {
  createPlaceholderImages,
  seedData,
  seedDatabase,
};
