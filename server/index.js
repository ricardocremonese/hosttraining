import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';

// Routes
import shippingRoutes from './routes/shipping.js';
import paymentRoutes from './routes/payments.js';
import orderRoutes from './routes/orders.js';
import marketingRoutes from './routes/marketing.js';

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      onlog: !!env.onlogApiKey,
      stripe: !!env.stripeSecretKey,
      mercadopago: !!env.mercadopagoAccessToken,
      supabase: !!env.supabaseServiceKey,
    },
  });
});

// Rotas
app.use('/api/shipping', shippingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/marketing', marketingRoutes);

// Start
app.listen(env.port, () => {
  console.log(`\n  HOST Training API rodando em http://localhost:${env.port}`);
  console.log(`  Health check: http://localhost:${env.port}/api/health\n`);
});
