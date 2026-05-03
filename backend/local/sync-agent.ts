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

    const { categories, units, products, ingredients, recipes } = response.data;

    db.transaction((tx) => {
      for (const cat of categories) {
        const prepared = prepareForSQLite(cat);
        tx.insert(schema.categories).values(prepared).onConflictDoUpdate({
          target: schema.categories.id,
          set: { name: prepared.name, updatedAt: prepared.updatedAt }
        }).run();
      }

      for (const prod of products) {
        const prepared = prepareForSQLite(prod);
        tx.insert(schema.products).values(prepared).onConflictDoUpdate({
          target: schema.products.id,
          set: { 
            name: prepared.name, 
            sellingPrice: prepared.sellingPrice, 
            updatedAt: prepared.updatedAt 
          }
        }).run();
      }
      
      // Units, Ingredients, Recipes should follow same pattern
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

    const unsyncedTrx = db.select().from(schema.transactions)
      .where(eq(schema.transactions.isSynced, false))
      .all();

    if (unsyncedTrx.length === 0) {
      console.log('No data to push');
      return;
    }

    const payload = {
      transactions: unsyncedTrx,
      shifts: [],
      stockLogs: []
    };

    await axios.post(`${CENTRAL_URL}/sync/push`, payload, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    db.transaction((tx) => {
      for (const trx of unsyncedTrx) {
        tx.update(schema.transactions)
          .set({ isSynced: true })
          .where(eq(schema.transactions.id, trx.id))
          .run();
      }
    });

    console.log('✅ Push complete');
  } catch (error) {
    console.error('❌ Push failed:', error?.message || error);
    if (error.response) {
      console.error('Server response:', error.response.data);
    }
  }
}
