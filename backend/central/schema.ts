import { pgTable, varchar, uuid, decimal, timestamp, jsonb, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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
  memberId: uuid('member_id'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 10 }),
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

// RELATIONS
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
