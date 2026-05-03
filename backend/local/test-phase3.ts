import { db } from './db.js';
import * as schema from './schema.js';
import { eq } from 'drizzle-orm';
import util from 'util';

async function testPhase3() {
  console.log('🧪 Testing Phase 3: Local Operational Core (Better-SQLite3 Sync)');

  const outletId = '5875bba0-c3d0-4832-acde-18799b5d9f22';
  const userId = '67ac21d0-4d33-496c-8f2b-cea4b65454f5'; // Seeded Admin UUID
  const now = new Date();

  // 1. Seed Master Data
  console.log('Seed master data...');
  db.insert(schema.categories).values({
    id: 'cat-1',
    name: 'Coffee',
    outletId,
    updatedAt: now,
  }).onConflictDoNothing().run();

  db.insert(schema.units).values({
    id: 'pcs',
    name: 'Pieces',
    updatedAt: now,
  }).onConflictDoNothing().run();

  db.insert(schema.ingredients).values({
    id: 'ing-beans',
    name: 'Coffee Beans',
    unit: 'gr',
    stock: 1000,
    minStock: 100,
    outletId,
    updatedAt: now,
  }).onConflictDoNothing().run();

  db.insert(schema.products).values({
    id: 'prod-latte',
    name: 'Caffe Latte',
    categoryId: 'cat-1',
    unitId: 'pcs',
    sellingPrice: 35000,
    outletId,
    updatedAt: now,
  }).onConflictDoNothing().run();

  db.insert(schema.recipes).values({
    productId: 'prod-latte',
    ingredientId: 'ing-beans',
    quantity: 18,
    updatedAt: now,
  }).onConflictDoNothing().run();

  // 2. Open Shift
  console.log('Opening shift...');
  const shiftId = 'SH-' + Date.now();
  db.insert(schema.shifts).values({
    id: shiftId,
    outletId,
    userId,
    startTime: now,
    initialCash: 500000,
    expectedCash: 500000,
    status: 'open',
  }).run();

  // 3. Perform Checkout
  console.log('Performing checkout...');
  const trxId = 'TRX-' + Date.now();
  
  db.transaction((tx) => {
    tx.insert(schema.transactions).values({
      id: trxId,
      outletId,
      cashierId: userId,
      totalAmount: 35000,
      paymentMethod: 'CASH',
      createdAt: now,
      updatedAt: now,
    }).run();

    tx.insert(schema.transactionItems).values({
      transactionId: trxId,
      productId: 'prod-latte',
      quantity: 1,
      priceAtTime: 35000,
      subtotal: 35000,
    }).run();

    const recipe = tx.select().from(schema.recipes)
      .where(eq(schema.recipes.productId, 'prod-latte'))
      .get();

    if (recipe && recipe.ingredientId) {
      const ingredient = tx.select().from(schema.ingredients)
        .where(eq(schema.ingredients.id, recipe.ingredientId))
        .get();
      
      if (ingredient && ingredient.id) {
        tx.update(schema.ingredients)
          .set({ stock: ingredient.stock - (recipe.quantity * 1), updatedAt: new Date() })
          .where(eq(schema.ingredients.id, ingredient.id))
          .run();

        tx.insert(schema.stockLogs).values({
          outletId,
          ingredientId: ingredient.id,
          changeAmount: -(recipe.quantity * 1),
          type: 'SALE',
          referenceId: trxId,
          createdAt: now,
        }).run();
      }
    }
  });

  console.log('✅ Phase 3 Test (Updated with UUIDs) Complete');
  process.exit(0);
}

testPhase3().catch(console.error);
