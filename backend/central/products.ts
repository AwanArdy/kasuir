import { Router } from 'express';
import { db } from './db.js';
import { products, categories, units } from './schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticate, authorize, AuthRequest } from './middleware/auth.js';
import { z } from 'zod';
import { toCamel } from '../shared/utils.js';

const router = Router();

// Zod Schemas
const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  categoryId: z.string(),
  unitId: z.string(),
  sellingPrice: z.number(),
  hpp: z.number().optional(),
  emoji: z.string().optional(),
});

// GET all products for an outlet
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const results = await db.query.products.findMany({
      where: eq(products.outletId, req.user!.outletId),
      with: {
        category: true,
        unit: true,
      }
    });
    res.json(toCamel(results));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// CREATE product (Manager/Admin only)
router.post('/', authenticate, authorize(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const data = productSchema.parse(req.body);
    
    await db.insert(products).values({
      ...data,
      outletId: req.user!.outletId,
      sellingPrice: data.sellingPrice.toString(), // DB decimal is string in Drizzle
      hpp: data.hpp?.toString(),
    });

    res.status(201).json({ message: 'Product created' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// UPDATE product
router.put('/:id', authenticate, authorize(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    const data = productSchema.partial().parse(req.body);
    
    await db.update(products)
      .set({
        ...data,
        sellingPrice: data.sellingPrice?.toString(),
        hpp: data.hpp?.toString(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(products.id, req.params.id),
        eq(products.outletId, req.user!.outletId)
      ));

    res.json({ message: 'Product updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE product
router.delete('/:id', authenticate, authorize(['admin', 'manager']), async (req: AuthRequest, res) => {
  try {
    await db.delete(products)
      .where(and(
        eq(products.id, req.params.id),
        eq(products.outletId, req.user!.outletId)
      ));

    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
