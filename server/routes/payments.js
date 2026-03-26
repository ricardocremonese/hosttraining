import { Router } from 'express';

const router = Router();

// ==========================================
// STRIPE
// ==========================================

/**
 * POST /api/payments/stripe/create-session
 * Cria sessão de checkout do Stripe
 */
router.post('/stripe/create-session', async (req, res) => {
  try {
    const { criarCheckoutSession } = await import('../services/payment-stripe.js');
    const { orderId, items, customerEmail } = req.body;

    const result = await criarCheckoutSession({
      orderId,
      items,
      customerEmail,
    });

    res.json(result);
  } catch (error) {
    console.error('Erro Stripe create-session:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar sessão de pagamento' });
  }
});

/**
 * POST /api/payments/stripe/webhook
 * Webhook do Stripe (precisa do raw body)
 */
router.post('/stripe/webhook', async (req, res) => {
  try {
    const { processarWebhookStripe } = await import('../services/payment-stripe.js');
    const sig = req.headers['stripe-signature'];
    const result = await processarWebhookStripe(req.body, sig);
    res.json(result);
  } catch (error) {
    console.error('Erro Stripe webhook:', error);
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// MERCADOPAGO
// ==========================================

/**
 * POST /api/payments/mercadopago/create-preference
 * Cria preferência de pagamento do MercadoPago
 */
router.post('/mercadopago/create-preference', async (req, res) => {
  try {
    const { criarPreferencia } = await import('../services/payment-mercadopago.js');
    const { orderId, items, customerEmail, customerName } = req.body;

    const result = await criarPreferencia({
      orderId,
      items,
      customerEmail,
      customerName,
    });

    res.json(result);
  } catch (error) {
    console.error('Erro MercadoPago create-preference:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar preferência' });
  }
});

/**
 * POST /api/payments/mercadopago/webhook
 * Webhook/IPN do MercadoPago
 */
router.post('/mercadopago/webhook', async (req, res) => {
  try {
    const { processarWebhookMercadoPago } = await import('../services/payment-mercadopago.js');
    const result = await processarWebhookMercadoPago(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro MercadoPago webhook:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
