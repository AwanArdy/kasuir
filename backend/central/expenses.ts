import { Router } from 'express';
import { db } from './db.js';
import { expenses } from './schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticate, authorize, AuthRequest } from './middleware/auth.js';
import { z } from 'zod';
import { toCamel } from '../shared/utils.js';

const router = Router();

const expenseSchema = z.object({
  id: z.string().optional(),
  category: z.string(),
  amount: z.number(),
  note: z.string().optional().nullable(),
  date: z.string().optional().transform((val) => val ? new Date(val) : new Date()),
});

// GET all expenses for an outlet
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const results = await db.query.expenses.findMany({
      where: eq(expenses.outletId, req.user!.outletId),
      orderBy: (expenses, { desc }) => [desc(expenses.date)],
    });
    res.json(toCamel(results));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// CREATE expense
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = expenseSchema.parse(req.body);
    
    await db.insert(expenses).values({
      ...data,
      outletId: req.user!.outletId,
      userId: req.user!.userId,
      amount: data.amount.toString(),
    });

    res.status(201).json({ message: 'Expense recorded' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE expense
router.delete('/:id', authenticate, authorize(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    await db.delete(expenses)
      .where(and(
        eq(expenses.id, req.params.id),
        eq(expenses.outletId, req.user!.outletId)
      ));

    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
