import { Router } from 'express';
import { db } from './db.js';
import { transactions, stockLogs, ingredients } from './schema.js';
import { eq, sql, and, gte, lte } from 'drizzle-orm';
import { authenticate, authorize, AuthRequest } from './middleware/auth.js';
import { toCamel } from '../shared/utils.js';

const router = Router();

// --- SALES SUMMARY ---
router.get('/sales-summary', authenticate, authorize(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Aggregation Query
    const summary = await db.select({
      outletId: transactions.outletId,
      totalSales: sql<number>`sum(${transactions.totalAmount})`,
      transactionCount: sql<number>`count(${transactions.id})`,
    })
    .from(transactions)
    .where(
      startDate && endDate 
        ? and(
            gte(transactions.createdAt, new Date(startDate as string)),
            lte(transactions.createdAt, new Date(endDate as string))
          )
        : undefined
    )
    .groupBy(transactions.outletId);

    res.json(toCamel(summary));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch sales summary' });
  }
});

// --- INVENTORY STATUS (Low Stock Alerts) ---
router.get('/inventory-status', authenticate, authorize(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const lowStock = await db.select()
      .from(ingredients)
      .where(sql`${ingredients.stock} <= ${ingredients.minStock}`);

    res.json(toCamel(lowStock));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch inventory status' });
  }
});

// --- TRANSACTION LOGS (Global View) ---
router.get('/transactions', authenticate, authorize(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const results = await db.query.transactions.findMany({
      orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
      limit: 50,
    });
    res.json(toCamel(results));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

export default router;
