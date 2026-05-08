import { Router } from 'express';
import { db } from './db.js';
import { members } from './schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticate, authorize, AuthRequest } from './middleware/auth.js';
import { z } from 'zod';
import { toCamel } from '../shared/utils.js';

const router = Router();

const memberSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  points: z.number().optional().default(0),
});

// GET all members for an outlet
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const results = await db.query.members.findMany({
      where: eq(members.outletId, req.user!.outletId),
    });
    res.json(toCamel(results));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// CREATE member
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = memberSchema.parse(req.body);
    
    await db.insert(members).values({
      ...data,
      outletId: req.user!.outletId,
      points: data.points.toString(),
    });

    res.status(201).json({ message: 'Member created' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// UPDATE member
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = memberSchema.partial().parse(req.body);
    
    await db.update(members)
      .set({
        ...data,
        points: data.points?.toString(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(members.id, req.params.id),
        eq(members.outletId, req.user!.outletId)
      ));

    res.json({ message: 'Member updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE member
router.delete('/:id', authenticate, authorize(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    await db.delete(members)
      .where(and(
        eq(members.id, req.params.id),
        eq(members.outletId, req.user!.outletId)
      ));

    res.json({ message: 'Member deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
