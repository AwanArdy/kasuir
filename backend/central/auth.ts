import { Router } from 'express';
import { db } from './db.js';
import { users, outlets } from './schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const registerSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  roleId: z.string().optional(),
  outletId: z.string().optional(),
  businessName: z.string().optional(), // For owner registration
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    let outletId = data.outletId;
    let roleId = data.roleId || 'manager';

    await db.transaction(async (tx) => {
      // If it's an owner registration (no outletId provided, but businessName is)
      if (!outletId && data.businessName) {
        const newOutletId = uuidv4();
        await tx.insert(outlets).values({
          id: newOutletId,
          name: data.businessName,
        });
        outletId = newOutletId;
        roleId = 'manager'; // Owners are managers of their own outlet
      }

      if (!outletId) {
        throw new Error('Outlet ID is required for registration');
      }

      const userId = uuidv4();
      await tx.insert(users).values({
        id: userId,
        name: data.name,
        email: data.email,
        password: hashedPassword,
        roleId: roleId,
        outletId: outletId,
      });

      const token = jwt.sign(
        { userId, role: roleId, outletId },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.status(201).json({
        user: {
          id: userId,
          name: data.name,
          role: roleId,
          outletId: outletId,
        },
        token,
      });
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.roleId, 
        outletId: user.outletId 
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Response matches FE User interface from BACKEND_DATA_SCHEMA.md
    res.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.roleId,
        outletId: user.outletId,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
