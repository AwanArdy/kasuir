import { Router } from 'express';
import { db } from './db.js';
import { auditLogs } from './schema.js';
import { authenticate, AuthRequest } from './middleware/auth.js';
import { z } from 'zod';

const router = Router();

const auditLogSchema = z.object({
  action: z.string(),
  details: z.string().optional(),
  type: z.enum(['access', 'create', 'update', 'delete']),
});

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { action, details, type } = auditLogSchema.parse(req.body);

    await db.insert(auditLogs).values({
      outletId: req.user!.outletId,
      userId: req.user!.userId,
      action,
      details,
      type,
    });

    res.status(201).json({ message: 'Audit log added' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
