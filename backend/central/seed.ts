import { db } from './db.js';
import { users, roles, categories, units, products, ingredients } from './schema.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import util from 'util';

async function seed() {
  console.log('🌱 Seeding database with Demo Data...');

  try {
    const demoOutletId = 'd0000000-0000-0000-0000-000000000001';
    const password = await bcrypt.hash('password123', 10);

    // 1. Seed Roles
    console.log('Inserting roles...');
    await db.insert(roles).values([
      { id: 'superadmin', permissions: { all: true } },
      { id: 'manager', permissions: { report: true, inventory: true, products: true } },
      { id: 'cashier', permissions: { transactions: true, shifts: true } },
    ]).onConflictDoNothing({ target: roles.id });

    // 2. Seed Demo Users
    console.log('Inserting demo users...');
    await db.insert(users).values([
      {
        id: uuidv4(),
        name: 'Internal Developer',
        email: 'dev@teratur.id',
        password: password,
        roleId: 'superadmin',
        outletId: demoOutletId,
      },
      {
        id: uuidv4(),
        name: 'Owner Demo',
        email: 'demo-owner@teratur.id',
        password: password,
        roleId: 'manager',
        outletId: demoOutletId,
      },
      {
        id: uuidv4(),
        name: 'Cashier Demo',
        email: 'demo-cashier@teratur.id',
        password: password,
        roleId: 'cashier',
        outletId: demoOutletId,
      }
    ]).onConflictDoNothing({ target: users.email });

    // 3. Seed Master Data (Categories & Units)
    console.log('Inserting categories and units...');
    await db.insert(categories).values([
      { id: 'cat-coffee', outletId: demoOutletId, name: 'Coffee' },
      { id: 'cat-bakery', outletId: demoOutletId, name: 'Bakery' },
      { id: 'cat-noncoffee', outletId: demoOutletId, name: 'Non-Coffee' },
    ]).onConflictDoNothing({ target: categories.id });

    await db.insert(units).values([
      { id: 'pcs', name: 'Pieces' },
      { id: 'ml', name: 'Milliliters' },
      { id: 'gr', name: 'Grams' },
    ]).onConflictDoNothing({ target: units.id });

    // 4. Seed Ingredients
    console.log('Inserting ingredients...');
    await db.insert(ingredients).values([
      { id: 'ing-bean', outletId: demoOutletId, name: 'Espresso Beans', unit: 'gr', stock: '5000', minStock: '500', avgCost: '250' },
      { id: 'ing-milk', outletId: demoOutletId, name: 'Fresh Milk', unit: 'ml', stock: '10000', minStock: '1000', avgCost: '20' },
      { id: 'ing-sugar', outletId: demoOutletId, name: 'Palm Sugar', unit: 'gr', stock: '2000', minStock: '200', avgCost: '50' },
    ]).onConflictDoNothing({ target: ingredients.id });

    // 5. Seed Products
    console.log('Inserting products...');
    await db.insert(products).values([
      { 
        id: 'p-espresso', 
        outletId: demoOutletId, 
        categoryId: 'cat-coffee', 
        unitId: 'pcs', 
        name: 'Espresso', 
        sellingPrice: '15000', 
        hpp: '5000', 
        emoji: '☕' 
      },
      { 
        id: 'p-latte', 
        outletId: demoOutletId, 
        categoryId: 'cat-coffee', 
        unitId: 'pcs', 
        name: 'Cafe Latte', 
        sellingPrice: '25000', 
        hpp: '12000', 
        emoji: '🥛' 
      },
      { 
        id: 'p-croissant', 
        outletId: demoOutletId, 
        categoryId: 'cat-bakery', 
        unitId: 'pcs', 
        name: 'Butter Croissant', 
        sellingPrice: '18000', 
        hpp: '8000', 
        emoji: '🥐' 
      },
    ]).onConflictDoNothing({ target: products.id });

    console.log('✅ Seeding complete!');
    console.log('Demo Credentials (Password: password123):');
    console.log('- dev@teratur.id (Superadmin)');
    console.log('- demo-owner@teratur.id (Manager)');
    console.log('- demo-cashier@teratur.id (Cashier)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:');
    console.error(util.inspect(err, { depth: null, colors: true }));
    process.exit(1);
  }
}

seed();
