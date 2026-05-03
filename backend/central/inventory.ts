import { Router } from 'express';
import { db } from './db.js';
import { categories, units, ingredients, recipes } from './schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticate, authorize, AuthRequest } from './middleware/auth.js';
import { z } from 'zod';
import { toCamel } from '../shared/utils.js';

const router = Router();

// --- CATEGORIES ---
const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
});

router.get('/categories', authenticate, async (req: AuthRequest, res) => {
  const result = await db.query.categories.findMany({
    where: eq(categories.outletId, req.user!.outletId),
  });
  res.json(toCamel(result));
});

router.post('/categories', authenticate, authorize(['admin', 'manager']), async (req: AuthRequest, res) => {
  const data = categorySchema.parse(req.body);
  await db.insert(categories).values({ ...data, outletId: req.user!.outletId });
  res.status(201).json({ message: 'Category created' });
});

// --- UNITS ---
router.get('/units', authenticate, async (req: AuthRequest, res) => {
  const result = await db.query.units.findMany();
  res.json(toCamel(result));
});

// --- INGREDIENTS ---
const ingredientSchema = z.object({
  id: z.string(),
  name: z.string(),
  unit: z.string(),
  minStock: z.number(),
});

router.get('/ingredients', authenticate, async (req: AuthRequest, res) => {
  const result = await db.query.ingredients.findMany({
    where: eq(ingredients.outletId, req.user!.outletId),
  });
  res.json(toCamel(result));
});

router.post('/ingredients', authenticate, authorize(['admin', 'manager']), async (req: AuthRequest, res) => {
  const data = ingredientSchema.parse(req.body);
  await db.insert(ingredients).values({ 
    ...data, 
    outletId: req.user!.outletId,
    minStock: data.minStock.toString() 
  });
  res.status(201).json({ message: 'Ingredient created' });
});

// --- RECIPES ---
const recipeSchema = z.object({
  productId: z.string(),
  ingredientId: z.string(),
  quantity: z.number(),
});

router.post('/recipes', authenticate, authorize(['admin', 'manager']), async (req: AuthRequest, res) => {
  const data = recipeSchema.parse(req.body);
  await db.insert(recipes).values({
    ...data,
    quantity: data.quantity.toString(),
  });
  res.status(201).json({ message: 'Recipe item added' });
});

export default router;
