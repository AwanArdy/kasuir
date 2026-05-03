import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import transactionRoutes from './transactions.js';
import shiftRoutes from './shifts.js';

dotenv.config();

const app = express();
const PORT = process.env.LOCAL_PORT || 3002;

app.use(cors());
app.use(express.json());

// Routes
app.use('/transactions', transactionRoutes);
app.use('/shifts', shiftRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'local' });
});

app.listen(PORT, () => {
  console.log(`Local Backend running on http://localhost:${PORT}`);
});

export default app;
