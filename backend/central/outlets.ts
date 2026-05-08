import { Router } from 'express';
import { db } from './db.js';
import { outlets } from './schema.js';
import { eq } from 'drizzle-orm';
import { authenticate, authorize, AuthRequest } from './middleware/auth.js';
import { z } from 'zod';
import { toCamel } from '../shared/utils.js';

const router = Router();

const outletSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
});

// GET all outlets (Admin only)
router.get('/', authenticate, authorize(['admin']), async (req: AuthRequest, res) => {
  try {
    const results = await db.query.outlets.findMany();
    res.json(toCamel(results));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET outlet by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    // Only admin can see other outlets, managers see their own
    if (req.user!.role !== 'admin' && req.user!.outletId !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const result = await db.query.outlets.findFirst({
      where: eq(outlets.id, req.params.id),
    });
    
    if (!result) return res.status(404).json({ message: 'Outlet not found' });
    res.json(toCamel(result));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// CREATE outlet (Admin only)
router.post('/', authenticate, authorize(['admin']), async (req: AuthRequest, res) => {
  try {
    const data = outletSchema.parse(req.body);
    await db.insert(outlets).values(data);
    res.status(201).json({ message: 'Outlet created' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// UPDATE outlet (Admin only)
router.put('/:id', authenticate, authorize(['admin']), async (req: AuthRequest, res) => {
  try {
    const data = outletSchema.partial().parse(req.body);
    await db.update(outlets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(outlets.id, req.params.id));
    res.json({ message: 'Outlet updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
