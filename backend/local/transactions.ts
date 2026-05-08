import { Router } from 'express';
import { db } from './db.js';
import { transactions, transactionItems, stockLogs, ingredients, recipes, products } from './schema.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const checkoutSchema = z.object({
  id: z.string(),
  outletId: z.string(),
  cashierId: z.string(),
  memberId: z.string().optional(),
  orderType: z.enum(['dine-in', 'take-away', 'delivery']).optional(),
  tableNumber: z.string().optional(),
  deliveryPlatform: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'QRIS']),
  subtotal: z.number(),
  discountAmount: z.number().optional(),
  taxAmount: z.number().optional(),
  totalAmount: z.number(),
  receivedAmount: z.number().optional(),
  changeAmount: z.number().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number(),
    priceAtTime: z.number(),
    subtotal: z.number(),
  })),
});

router.post('/checkout', async (req, res) => {
  try {
    const data = checkoutSchema.parse(req.body);
    const now = new Date();

    // 1. Start a transaction (SQLite transaction)
    await db.transaction(async (tx) => {
      // 2. Save Transaction
      await tx.insert(transactions).values({
        id: data.id,
        outletId: data.outletId,
        cashierId: data.cashierId,
        memberId: data.memberId,
        orderType: data.orderType || 'dine-in',
        tableNumber: data.tableNumber,
        deliveryPlatform: data.deliveryPlatform,
        paymentMethod: data.paymentMethod,
        subtotal: data.subtotal,
        discountAmount: data.discountAmount || 0,
        taxAmount: data.taxAmount || 0,
        totalAmount: data.totalAmount,
        receivedAmount: data.receivedAmount,
        changeAmount: data.changeAmount,
        createdAt: now,
        updatedAt: now,
      });

      // 3. Save Items & Deduct Stock
      for (const item of data.items) {
        await tx.insert(transactionItems).values({
          transactionId: data.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtTime: item.priceAtTime,
          subtotal: item.subtotal,
        });

        // Get recipes for this product to deduct ingredients
        const productRecipes = await tx.query.recipes.findMany({
          where: eq(recipes.productId, item.productId),
        });

        for (const recipe of productRecipes) {
          const totalDeduction = recipe.quantity * item.quantity;

          // Update ingredient stock
          const ingredient = await tx.query.ingredients.findFirst({
            where: eq(ingredients.id, recipe.ingredientId),
          });

          if (ingredient) {
            await tx.update(ingredients)
              .set({ 
                stock: ingredient.stock - totalDeduction,
                updatedAt: now 
              })
              .where(eq(ingredients.id, ingredient.id));

            // Log stock change
            await tx.insert(stockLogs).values({
              outletId: data.outletId,
              ingredientId: ingredient.id,
              changeAmount: -totalDeduction,
              type: 'SALE',
              referenceId: data.id,
              createdAt: now,
            });
          }
        }
      }
    });

    res.status(201).json({ message: 'Checkout successful', transactionId: data.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
