import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './auth.js';
import auditLogsRoutes from './audit-logs.js';
import productRoutes from './products.js';
import inventoryRoutes from './inventory.js';
import syncRoutes from './sync.js';
import reportRoutes from './reports.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/audit-logs', auditLogsRoutes);
app.use('/products', productRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/sync', syncRoutes);
app.use('/reports', reportRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'central' });
});

app.listen(PORT, () => {
  console.log(`Central Backend running on http://localhost:${PORT}`);
});

export default app;
