import { Router } from 'express';
import { db } from './db.js';
import { users } from './schema.js';
import { eq } from 'drizzle-orm';
import { authenticate, AuthRequest } from './middleware/auth.js';
import { toCamel } from '../shared/utils.js';

const router = Router();

// GET all users for the current user's outlet
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const results = await db.query.users.findMany({
      where: eq(users.outletId, req.user!.outletId),
    });
    
    // Remove sensitive data
    const safeResults = results.map(({ password, ...rest }) => rest);
    
    res.json(toCamel(safeResults));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
