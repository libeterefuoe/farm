const express = require('express');
const cors = require('cors');

const supplierRoutes  = require('./routes/supplierRoutes');
const fruitRoutes     = require('./routes/fruitRoutes');
const stockRoutes     = require('./routes/stockRoutes');
const vendorRoutes    = require('./routes/vendorRoutes');
const purchaseRoutes  = require('./routes/purchaseRoutes');
const salesRoutes     = require('./routes/salesRoutes');
const reportRoutes    = require('./routes/reportRoutes');

const notFound      = require('./middleware/notFound');
const errorHandler  = require('./middleware/errorHandler');
const { pingDatabase } = require('./config/db');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Health check — used by deployment platforms.
app.get('/api/health', async (req, res) => {
  try {
    await pingDatabase();
    res.json({ success: true, message: 'API up, DB reachable', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ success: false, message: 'Database unavailable' });
  }
});

app.use('/api/suppliers',  supplierRoutes);
app.use('/api/fruits',     fruitRoutes);
app.use('/api/stock',      stockRoutes);
app.use('/api/vendors',    vendorRoutes);
app.use('/api/purchases',  purchaseRoutes);
app.use('/api/sales',      salesRoutes);
app.use('/api/reports',    reportRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;