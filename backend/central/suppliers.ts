import { Router } from 'express';
import { db } from './db.js';
import { suppliers } from './schema.js';
import { eq } from 'drizzle-orm';
import { authenticate, authorize, AuthRequest } from './middleware/auth.js';
import { z } from 'zod';
import { toCamel } from '../shared/utils.js';

const router = Router();

const supplierSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  contactName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

// GET all suppliers
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const results = await db.query.suppliers.findMany();
    res.json(toCamel(results));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// CREATE supplier (Manager/Admin only)
router.post('/', authenticate, authorize(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const data = supplierSchema.parse(req.body);
    await db.insert(suppliers).values(data);
    res.status(201).json({ message: 'Supplier created' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// UPDATE supplier
router.put('/:id', authenticate, authorize(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const data = supplierSchema.partial().parse(req.body);
    await db.update(suppliers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(suppliers.id, req.params.id));
    res.json({ message: 'Supplier updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE supplier
router.delete('/:id', authenticate, authorize(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    await db.delete(suppliers)
      .where(eq(suppliers.id, req.params.id));
    res.json({ message: 'Supplier deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
