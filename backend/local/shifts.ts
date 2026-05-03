import { Router } from 'express';
import { db } from './db.js';
import { shifts } from './schema.js';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const openShiftSchema = z.object({
  id: z.string(),
  outletId: z.string(),
  userId: z.string(),
  initialCash: z.number(),
});

const closeShiftSchema = z.object({
  finalCash: z.number(),
});

router.post('/open', async (req, res) => {
  try {
    const data = openShiftSchema.parse(req.body);
    const now = new Date();

    await db.insert(shifts).values({
      id: data.id,
      outletId: data.outletId,
      userId: data.userId,
      startTime: now,
      initialCash: data.initialCash,
      expectedCash: data.initialCash,
      status: 'open',
    });

    res.status(201).json({ message: 'Shift opened', shiftId: data.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/close/:id', async (req, res) => {
  try {
    const { finalCash } = closeShiftSchema.parse(req.body);
    const now = new Date();

    await db.update(shifts)
      .set({
        finalCash,
        endTime: now,
        status: 'closed',
      })
      .where(eq(shifts.id, req.params.id));

    res.json({ message: 'Shift closed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
