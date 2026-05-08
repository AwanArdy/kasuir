import { Router } from 'express';
import { db } from './db.js';
import * as schema from './schema.js';
import { eq, gt, and } from 'drizzle-orm';
import { authenticate, AuthRequest } from './middleware/auth.js';
import { toCamel } from '../shared/utils.js';
import { z } from 'zod';

const router = Router();

// --- STEP 1: PULL Master Data (Central -> Local) ---
router.get('/pull', authenticate, async (req: AuthRequest, res) => {
  try {
    const lastSync = req.query.last_sync ? new Date(req.query.last_sync as string) : new Date(0);
    const outletId = req.user!.outletId;

    console.log(`[PULL] Request - Outlet: ${outletId}, LastSync: ${lastSync.toISOString()}`);

    // Query each table explicitly for better error isolation and logging
    const cats = await db.select().from(schema.categories)
      .where(and(eq(schema.categories.outletId, outletId), gt(schema.categories.updatedAt, lastSync)));
    console.log(`[PULL] Categories found: ${cats.length}`);

    const unts = await db.select().from(schema.units)
      .where(gt(schema.units.updatedAt, lastSync));
    console.log(`[PULL] Units found: ${unts.length}`);

    const prods = await db.select().from(schema.products)
      .where(and(eq(schema.products.outletId, outletId), gt(schema.products.updatedAt, lastSync)));
    console.log(`[PULL] Products found: ${prods.length}`);

    const ings = await db.select().from(schema.ingredients)
      .where(and(eq(schema.ingredients.outletId, outletId), gt(schema.ingredients.updatedAt, lastSync)));
    console.log(`[PULL] Ingredients found: ${ings.length}`);

    const recs = await db.select().from(schema.recipes)
      .where(gt(schema.recipes.updatedAt, lastSync));
    console.log(`[PULL] Recipes found: ${recs.length}`);

    // Temporary skip for missing tables
    /*
    const mems = await db.select().from(schema.members)
      .where(and(eq(schema.members.outletId, outletId), gt(schema.members.updatedAt, lastSync)));
    */

    res.json(toCamel({
      categories: cats,
      units: unts,
      products: prods,
      ingredients: ings,
      recipes: recs,
      members: [],
      suppliers: [],
      serverTime: new Date().toISOString(),
    }));
  } catch (error: any) {
    console.error('[PULL] Error:', error);
    res.status(500).json({ message: 'Pull failed', error: error.message });
  }
});

// --- STEP 2: PUSH Operational Data (Local -> Central) ---
const pushSchema = z.object({
  transactions: z.array(z.any()),
  shifts: z.array(z.any()),
  stockLogs: z.array(z.any()),
  expenses: z.array(z.any()).optional(),
});

router.post('/push', authenticate, async (req: AuthRequest, res) => {
  try {
    const { transactions, shifts, stockLogs, expenses: incomingExpenses } = pushSchema.parse(req.body);
    const outletId = req.user!.outletId;

    await db.transaction(async (tx) => {
      // Ingest Transactions
      for (const trx of transactions) {
        // Remove local-only fields
        const { isSynced, items, ...cleanTrx } = trx;
        
        // Convert date strings back to Dates for PG
        if (cleanTrx.createdAt) cleanTrx.createdAt = new Date(cleanTrx.createdAt);
        if (cleanTrx.updatedAt) cleanTrx.updatedAt = new Date(cleanTrx.updatedAt);

        await tx.insert(schema.transactions)
          .values({ ...cleanTrx, outletId })
          .onConflictDoUpdate({
            target: schema.transactions.id,
            set: { ...cleanTrx, outletId, updatedAt: new Date() }
          });
      }

      // Ingest Shifts
      for (const shift of shifts) {
        const { isSynced, ...cleanShift } = shift;
        if (cleanShift.startTime) cleanShift.startTime = new Date(cleanShift.startTime);
        if (cleanShift.endTime) cleanShift.endTime = new Date(cleanShift.endTime);

        await tx.insert(schema.shifts)
          .values({ ...cleanShift, outletId })
          .onConflictDoUpdate({
            target: schema.shifts.id,
            set: { ...cleanShift, outletId, updatedAt: new Date() }
          });
      }

      // Ingest Stock Logs
      for (const log of stockLogs) {
        const { isSynced, ...cleanLog } = log;
        if (cleanLog.createdAt) cleanLog.createdAt = new Date(cleanLog.createdAt);

        await tx.insert(schema.stockLogs)
          .values({ ...cleanLog, outletId })
          .onConflictDoNothing(); // Stock logs are usually append-only
      }

      // Ingest Expenses
      if (incomingExpenses) {
        for (const exp of incomingExpenses) {
          const { isSynced, ...cleanExp } = exp;
          if (cleanExp.date) cleanExp.date = new Date(cleanExp.date);

          await tx.insert(schema.expenses)
            .values({ ...cleanExp, outletId })
            .onConflictDoUpdate({
              target: schema.expenses.id,
              set: { ...cleanExp, outletId }
            });
        }
      }
    });

    res.json({ message: 'Push successful' });
  } catch (error) {
    console.error('PUSH Error:', error);
    res.status(500).json({ message: 'Push failed', error: String(error) });
  }
});

export default router;
