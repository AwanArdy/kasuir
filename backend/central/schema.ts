import { pgTable, varchar, uuid, decimal, timestamp, jsonb, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const outlets = pgTable('outlets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: varchar('id', { length: 50 }).primaryKey(),
  outletId: uuid('outlet_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const units = pgTable('units', {
  id: varchar('id', { length: 20 }).primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: varchar('id', { length: 50 }).primaryKey(),
  outletId: uuid('outlet_id').notNull(),
  categoryId: varchar('category_id', { length: 50 }).references(() => categories.id),
  unitId: varchar('unit_id', { length: 20 }).references(() => units.id),
  name: varchar('name', { length: 100 }).notNull(),
  sellingPrice: decimal('selling_price', { precision: 12, scale: 2 }).notNull(),
  hpp: decimal('hpp', { precision: 12, scale: 2 }),
  emoji: varchar('emoji', { length: 10 }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const roles = pgTable('roles', {
  id: varchar('id', { length: 20 }).primaryKey(),
  permissions: jsonb('permissions'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  outletId: uuid('outlet_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  password: text('password').notNull(),
  roleId: varchar('role_id', { length: 20 }).references(() => roles.id),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  outletId: uuid('outlet_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  points: decimal('points', { precision: 12, scale: 2 }).default('0'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ingredients = pgTable('ingredients', {
  id: varchar('id', { length: 50 }).primaryKey(),
  outletId: uuid('outlet_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  stock: decimal('stock', { precision: 12, scale: 2 }).default('0').notNull(),
  minStock: decimal('min_stock', { precision: 12, scale: 2 }).default('0').notNull(),
  avgCost: decimal('avg_cost', { precision: 12, scale: 2 }).default('0'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const recipes = pgTable('recipes', {
  productId: varchar('product_id', { length: 50 }).references(() => products.id).notNull(),
  ingredientId: varchar('ingredient_id', { length: 50 }).references(() => ingredients.id).notNull(),
  quantity: decimal('quantity', { precision: 12, scale: 2 }).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  outletId: uuid('outlet_id').notNull(),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  details: text('details'),
  type: varchar('type', { length: 20 }).notNull(), // 'access' | 'create' | 'update' | 'delete'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const transactions = pgTable('transactions', {
  id: varchar('id', { length: 50 }).primaryKey(),
  outletId: uuid('outlet_id').notNull(),
  cashierId: uuid('cashier_id'),
  memberId: uuid('member_id').references(() => members.id),
  orderType: varchar('order_type', { length: 20 }).default('dine-in'),
  tableNumber: varchar('table_number', { length: 20 }),
  deliveryPlatform: varchar('delivery_platform', { length: 50 }),
  paymentMethod: varchar('payment_method', { length: 10 }),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }).default('0'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  receivedAmount: decimal('received_amount', { precision: 12, scale: 2 }),
  changeAmount: decimal('change_amount', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const transactionItems = pgTable('transaction_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: varchar('transaction_id', { length: 50 }).references(() => transactions.id),
  productId: varchar('product_id', { length: 50 }).references(() => products.id),
  quantity: decimal('quantity', { precision: 12, scale: 2 }).notNull(),
  priceAtTime: decimal('price_at_time', { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
});

export const shifts = pgTable('shifts', {
  id: varchar('id', { length: 50 }).primaryKey(),
  outletId: uuid('outlet_id').notNull(),
  userId: uuid('user_id').references(() => users.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  initialCash: decimal('initial_cash', { precision: 12, scale: 2 }).notNull(),
  finalCash: decimal('final_cash', { precision: 12, scale: 2 }),
  expectedCash: decimal('expected_cash', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const stockLogs = pgTable('stock_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  outletId: uuid('outlet_id').notNull(),
  ingredientId: varchar('ingredient_id', { length: 50 }).references(() => ingredients.id),
  changeAmount: decimal('change_amount', { precision: 12, scale: 2 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  referenceId: varchar('reference_id', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  outletId: uuid('outlet_id').notNull(),
  userId: uuid('user_id').references(() => users.id),
  category: varchar('category', { length: 50 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  note: text('note'),
  date: timestamp('date').defaultNow().notNull(),
});

export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  contactName: varchar('contact_name', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// RELATIONS
export const outletsRelations = relations(outlets, ({ many }) => ({
  users: many(users),
  categories: many(categories),
  products: many(products),
  members: many(members),
  expenses: many(expenses),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const unitsRelations = relations(units, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  unit: one(units, {
    fields: [products.unitId],
    references: [units.id],
  }),
  recipes: many(recipes),
}));

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
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

