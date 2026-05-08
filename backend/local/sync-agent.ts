import axios from 'axios';
import { db } from './db.js';
import * as schema from './schema.js';
import { eq } from 'drizzle-orm';

const CENTRAL_URL = process.env.CENTRAL_URL || 'http://localhost:3001';
let authToken = '';

export async function setAuthToken(token: string) {
  authToken = token;
}

function prepareForSQLite(item: any) {
  const prepared = { ...item };
  if (prepared.updatedAt) prepared.updatedAt = new Date(prepared.updatedAt);
  if (prepared.createdAt) prepared.createdAt = new Date(prepared.createdAt);
  if (prepared.startTime) prepared.startTime = new Date(prepared.startTime);
  if (prepared.endTime) prepared.endTime = new Date(prepared.endTime);
  return prepared;
}

// --- PULL AGENT (Downstream) ---
export async function pullMasterData() {
  try {
    console.log('🔄 Pulling master data from Central...');
    
    const response = await axios.get(`${CENTRAL_URL}/sync/pull`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const { categories, units, products, ingredients, recipes, members, suppliers } = response.data;

    db.transaction((tx) => {
      // Helper to handle upsert for any table
      const upsert = (table: any, items: any[], fieldsToUpdate: string[]) => {
        for (const item of items) {
          const prepared = prepareForSQLite(item);
          const set: any = {};
          fieldsToUpdate.forEach(f => { set[f] = prepared[f]; });
          if (prepared.updatedAt) set.updatedAt = prepared.updatedAt;

          tx.insert(table).values(prepared).onConflictDoUpdate({
            target: table.id || (table.productId && [table.productId, table.ingredientId]),
            set
          }).run();
        }
      };

      if (categories) upsert(schema.categories, categories, ['name', 'outletId']);
      if (units) upsert(schema.units, units, ['name']);
      if (products) upsert(schema.products, products, ['name', 'sellingPrice', 'hpp', 'emoji', 'categoryId', 'unitId']);
      if (ingredients) upsert(schema.ingredients, ingredients, ['name', 'unit', 'stock', 'minStock']);
      if (members) upsert(schema.members, members, ['name', 'email', 'phone', 'points']);
      
      // Recipes (composite key)
      if (recipes) {
        for (const rec of recipes) {
          const prepared = prepareForSQLite(rec);
          tx.insert(schema.recipes).values(prepared).onConflictDoUpdate({
            target: [schema.recipes.productId, schema.recipes.ingredientId],
            set: { quantity: prepared.quantity, updatedAt: prepared.updatedAt }
          }).run();
        }
      }
    });

    console.log('✅ Pull complete');
  } catch (error) {
    console.error('❌ Pull failed:', error);
  }
}

// --- PUSH AGENT (Upstream) ---
export async function pushOperationalData() {
  try {
    console.log('🔄 Pushing operational data to Central...');

    const unsyncedTrx = db.select().from(schema.transactions).where(eq(schema.transactions.isSynced, false)).all();
    const unsyncedShifts = db.select().from(schema.shifts).where(eq(schema.shifts.isSynced, false)).all();
    const unsyncedLogs = db.select().from(schema.stockLogs).where(eq(schema.stockLogs.isSynced, false)).all();
    const unsyncedExpenses = db.select().from(schema.expenses).where(eq(schema.expenses.isSynced, false)).all();

    if (unsyncedTrx.length === 0 && unsyncedShifts.length === 0 && unsyncedLogs.length === 0 && unsyncedExpenses.length === 0) {
      console.log('No data to push');
      return;
    }

    const payload = {
      transactions: unsyncedTrx,
      shifts: unsyncedShifts,
      stockLogs: unsyncedLogs,
      expenses: unsyncedExpenses
    };

    await axios.post(`${CENTRAL_URL}/sync/push`, payload, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    db.transaction((tx) => {
      const markSynced = (table: any, items: any[]) => {
        for (const item of items) {
          tx.update(table).set({ isSynced: true }).where(eq(table.id, item.id)).run();
        }
      };

      markSynced(schema.transactions, unsyncedTrx);
      markSynced(schema.shifts, unsyncedShifts);
      markSynced(schema.stockLogs, unsyncedLogs);
      markSynced(schema.expenses, unsyncedExpenses);
    });

    console.log('✅ Push complete');
  } catch (error) {
    console.error('❌ Push failed:', error?.message || error);
  }
}
