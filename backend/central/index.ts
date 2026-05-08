import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './auth.js';
import usersRoutes from './users.js';
import auditLogsRoutes from './audit-logs.js';
import productRoutes from './products.js';
import inventoryRoutes from './inventory.js';
import syncRoutes from './sync.js';
import reportRoutes from './reports.js';
import memberRoutes from './members.js';
import expenseRoutes from './expenses.js';
import outletRoutes from './outlets.js';
import supplierRoutes from './suppliers.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || origin !== '') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'], 
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/audit-logs', auditLogsRoutes);
app.use('/products', productRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/sync', syncRoutes);
app.use('/reports', reportRoutes);
app.use('/members', memberRoutes);
app.use('/expenses', expenseRoutes);
app.use('/outlets', outletRoutes);
app.use('/suppliers', supplierRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'central' });
});

app.listen(PORT, () => {
  console.log(`Central Backend running on http://localhost:${PORT}`);
});

export default app;
