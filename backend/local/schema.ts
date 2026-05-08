import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// --- MASTER DATA (Local Copies) ---
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  outletId: text('outlet_id').notNull(),
  name: text('name').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const units = sqliteTable('units', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  outletId: text('outlet_id').notNull(),
  categoryId: text('category_id').references(() => categories.id),
  unitId: text('unit_id').references(() => units.id),
  name: text('name').notNull(),
  sellingPrice: real('selling_price').notNull(),
  hpp: real('hpp'),
  emoji: text('emoji'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  outletId: text('outlet_id').notNull(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  points: real('points').default(0),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const ingredients = sqliteTable('ingredients', {
  id: text('id').primaryKey(),
  outletId: text('outlet_id').notNull(),
  name: text('name').notNull(),
  unit: text('unit').notNull(),
  stock: real('stock').default(0).notNull(),
  minStock: real('min_stock').default(0).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const recipes = sqliteTable('recipes', {
  productId: text('product_id').references(() => products.id).notNull(),
  ingredientId: text('ingredient_id').references(() => ingredients.id).notNull(),
  quantity: real('quantity').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// --- OPERATIONAL DATA (Local Origin) ---
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(), // TRX-1714654321
  outletId: text('outlet_id').notNull(),
  cashierId: text('cashier_id').notNull(),
  memberId: text('member_id').references(() => members.id),
  orderType: text('order_type').default('dine-in'),
  tableNumber: text('table_number'),
  deliveryPlatform: text('delivery_platform'),
  paymentMethod: text('payment_method').notNull(), // 'CASH' | 'QRIS'
  subtotal: real('subtotal').notNull(),
  discountAmount: real('discount_amount').default(0),
  taxAmount: real('tax_amount').default(0),
  totalAmount: real('total_amount').notNull(),
  receivedAmount: real('received_amount'),
  changeAmount: real('change_amount'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  isSynced: integer('is_synced', { mode: 'boolean' }).default(false),
});

export const transactionItems = sqliteTable('transaction_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  transactionId: text('transaction_id').references(() => transactions.id).notNull(),
  productId: text('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  priceAtTime: real('price_at_time').notNull(),
  subtotal: real('subtotal').notNull(),
});

export const shifts = sqliteTable('shifts', {
  id: text('id').primaryKey(), // SH-1714654321
  outletId: text('outlet_id').notNull(),
  userId: text('user_id').notNull(),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
  initialCash: real('initial_cash').notNull(),
  finalCash: real('final_cash'),
  expectedCash: real('expected_cash').notNull(),
  status: text('status').notNull(), // 'open', 'closed'
  isSynced: integer('is_synced', { mode: 'boolean' }).default(false),
});

export const stockLogs = sqliteTable('stock_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  outletId: text('outlet_id').notNull(),
  ingredientId: text('ingredient_id').references(() => ingredients.id).notNull(),
  changeAmount: real('change_amount').notNull(),
  type: text('type').notNull(), // 'SALE', 'ADJUSTMENT', 'RESTOCK'
  referenceId: text('reference_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  isSynced: integer('is_synced', { mode: 'boolean' }).default(false),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(), // UUID
  outletId: text('outlet_id').notNull(),
  userId: text('user_id'),
  action: text('action').notNull(),
  details: text('details'),
  type: text('type').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  isSynced: integer('is_synced', { mode: 'boolean' }).default(false),
});

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  outletId: text('outlet_id').notNull(),
  userId: text('user_id').notNull(),
  category: text('category').notNull(),
  amount: real('amount').notNull(),
  note: text('note'),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  isSynced: integer('is_synced', { mode: 'boolean' }).default(false),
});

// --- RELATIONS ---
export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  member: one(members, {
    fields: [transactions.memberId],
    references: [members.id],
  }),
  items: many(transactionItems),
}));

export const membersRelations = relations(members, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionItemsRelations = relations(transactionItems, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionItems.transactionId],
    references: [transactions.id],
  }),
  product: one(products, {
    fields: [transactionItems.productId],
    references: [products.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  recipes: many(recipes),
}));

export const recipesRelations = relations(recipes, ({ one }) => ({
  product: one(products, {
    fields: [recipes.productId],
    references: [products.id],
  }),
  ingredient: one(ingredients, {
    fields: [recipes.ingredientId],
    references: [ingredients.id],
  }),
}));

