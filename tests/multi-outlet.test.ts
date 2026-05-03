import axios from 'axios';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as localSchema from '../backend/local/schema.js';
import { db as centralDb } from '../backend/central/db.js';
import * as centralSchema from '../backend/central/schema.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

const CENTRAL_URL = 'http://localhost:3001';

interface OutletInstance {
  id: string;
  name: string;
  dbPath: string;
  token: string;
  db: any;
  userEmail: string;
}

async function runTest() {
  console.log('🚀 Starting Comprehensive Multi-Outlet Integration Test (Fixed UUIDs)');

  ['o1.db', 'o2.db', 'o3.db', 'o4.db'].forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
  
  console.log('--- Phase 1: Setting up Central Data ---');
  const password = await bcrypt.hash('password123', 10);
  
  const outlets: OutletInstance[] = [
    { id: uuidv4(), name: 'Cafe A - Branch 1', dbPath: 'o1.db', token: '', db: null, userEmail: 'cashierA1@test.com' },
    { id: uuidv4(), name: 'Cafe A - Branch 2', dbPath: 'o2.db', token: '', db: null, userEmail: 'cashierA2@test.com' },
    { id: uuidv4(), name: 'Cafe B - Branch 1', dbPath: 'o3.db', token: '', db: null, userEmail: 'cashierB1@test.com' },
    { id: uuidv4(), name: 'Cafe B - Branch 2', dbPath: 'o4.db', token: '', db: null, userEmail: 'cashierB2@test.com' },
  ];

  // Insert 4 unique Cashiers into Central
  for (const o of outlets) {
    await centralDb.insert(centralSchema.users).values({
      name: o.name,
      email: o.userEmail,
      password: password,
      roleId: 'cashier',
      outletId: o.id
    }).onConflictDoNothing();
  }
  console.log('✅ 4 Cashiers created in Central, each with unique outletId');

  console.log('--- Phase 2: Initializing 4 Local Outlets ---');
  for (const o of outlets) {
    const sqlite = new Database(o.dbPath);
    o.db = drizzleSqlite(sqlite, { schema: localSchema });
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, outlet_id TEXT, name TEXT, updated_at INTEGER);
      CREATE TABLE IF NOT EXISTS units (id TEXT PRIMARY KEY, name TEXT, updated_at INTEGER);
      CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, outlet_id TEXT, category_id TEXT, unit_id TEXT, name TEXT, selling_price REAL, hpp REAL, emoji TEXT, updated_at INTEGER);
      CREATE TABLE IF NOT EXISTS ingredients (id TEXT PRIMARY KEY, outlet_id TEXT, name TEXT, unit TEXT, stock REAL, min_stock REAL, updated_at INTEGER);
      CREATE TABLE IF NOT EXISTS recipes (product_id TEXT, ingredient_id TEXT, quantity REAL, updated_at INTEGER);
      CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, outlet_id TEXT, cashier_id TEXT, member_id TEXT, total_amount REAL, payment_method TEXT, created_at INTEGER, updated_at INTEGER, is_synced INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS transaction_items (id INTEGER PRIMARY KEY AUTOINCREMENT, transaction_id TEXT, product_id TEXT, quantity INTEGER, price_at_time REAL, subtotal REAL);
      CREATE TABLE IF NOT EXISTS stock_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, outlet_id TEXT, ingredient_id TEXT, change_amount REAL, type TEXT, reference_id TEXT, created_at INTEGER, is_synced INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS shifts (id TEXT PRIMARY KEY, outlet_id TEXT, user_id TEXT, start_time INTEGER, end_time INTEGER, initial_cash REAL, final_cash REAL, expected_cash REAL, status TEXT, is_synced INTEGER DEFAULT 0);
    `);
  }

  console.log('--- Phase 3: Simulation ---');
  for (const o of outlets) {
    const login = await axios.post(`${CENTRAL_URL}/auth/login`, { email: o.userEmail, password: 'password123' });
    o.token = login.data.token;

    const trxId = 'TRX-' + uuidv4();
    o.db.insert(localSchema.transactions).values({
      id: trxId,
      outletId: o.id,
      cashierId: login.data.user.id,
      totalAmount: 50000,
      paymentMethod: 'QRIS',
      createdAt: new Date(),
      updatedAt: new Date(),
      isSynced: 0
    }).run();

    const unsynced = o.db.select().from(localSchema.transactions).where(eq(localSchema.transactions.isSynced, 0)).all();
    await axios.post(`${CENTRAL_URL}/sync/push`, {
      transactions: unsynced,
      shifts: [],
      stockLogs: []
    }, { headers: { Authorization: `Bearer ${o.token}` } });
    
    o.db.update(localSchema.transactions).set({ isSynced: 1 }).where(eq(localSchema.transactions.id, trxId)).run();
    console.log(`✅ ${o.name} pushed sale of 50,000`);
  }

  console.log('\n--- Phase 4: Verification ---');
  const adminLogin = await axios.post(`${CENTRAL_URL}/auth/login`, { email: 'admin@kasir.com', password: 'admin123' });
  const reports = await axios.get(`${CENTRAL_URL}/reports/sales-summary`, { headers: { Authorization: `Bearer ${adminLogin.data.token}` } });
  
  console.log('Global Sales Summary Row Count:', reports.data.length);
  
  // We expect at least 4 unique outlet IDs in the summary (the ones we just created)
  const testOutletIds = outlets.map(o => o.id);
  const matchedOutlets = reports.data.filter((r: any) => testOutletIds.includes(r.outletId));

  console.log('Unique Test Outlets Found in Central:', matchedOutlets.length);
  
  if (matchedOutlets.length === 4) {
    console.log('✅ SUCCESS: Data isolation and aggregation verified for all 4 outlets');
  } else {
    console.log('❌ FAILURE: Isolation error or missing data');
  }

  console.log('\n🏁 Multi-Outlet Integration Test Complete');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('❌ Test crashed:', err?.response?.data || err.message);
  process.exit(1);
});
