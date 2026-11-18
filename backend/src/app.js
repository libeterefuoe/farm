const express = require('express');
const cors = require('cors');

const authRoutes      = require('./routes/authRoutes');
const supplierRoutes  = require('./routes/supplierRoutes');
const fruitRoutes     = require('./routes/fruitRoutes');
const stockRoutes     = require('./routes/stockRoutes');
const vendorRoutes    = require('./routes/vendorRoutes');
const purchaseRoutes  = require('./routes/purchaseRoutes');
const salesRoutes     = require('./routes/salesRoutes');
const reportRoutes    = require('./routes/reportRoutes');

const authMiddleware = require('./middleware/auth');
const notFound      = require('./middleware/notFound');
const errorHandler  = require('./middleware/errorHandler');
const { pingDatabase } = require('./config/db');

const app = express();

// CORS — allow the Authorization header, keep FRONTEND_URL from .env.
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ---------- PUBLIC ROUTES ----------
app.get('/api/health', async (req, res) => {
  try {
    await pingDatabase();
    res.json({ success: true, message: 'API up, DB reachable', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ success: false, message: 'Database unavailable' });
  }
});

// Auth login is public; /api/auth/me is protected inside authRoutes.
app.use('/api/auth', authRoutes);

// ---------- PROTECTED ROUTES ----------
// Everything below requires a valid Bearer token.
app.use('/api/suppliers',  authMiddleware, supplierRoutes);
app.use('/api/fruits',     authMiddleware, fruitRoutes);
app.use('/api/stock',      authMiddleware, stockRoutes);
app.use('/api/vendors',    authMiddleware, vendorRoutes);
app.use('/api/purchases',  authMiddleware, purchaseRoutes);
app.use('/api/sales',      authMiddleware, salesRoutes);
app.use('/api/reports',    authMiddleware, reportRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;