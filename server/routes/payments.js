import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

/**
 * GET /api/payments/active-provider
 * Retorna qual provedor de pagamento está ativo
 */
router.get('/active-provider', async (req, res) => {
  try {
    if (!supabase) return res.json({ provider: null });
    const { data } = await supabase
      .from('integrations_config')
      .select('provider, config')
      .eq('category', 'payment')
      .eq('enabled', true)
      .limit(1);

    if (data?.length > 0) {
      // Retorna apenas a public_key, nunca a secret
      const provider = data[0].provider;
      const publicKey = data[0].config?.public_key || '';
      res.json({ provider, publicKey });
    } else {
      res.json({ provider: null });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// MERCADO PAGO - Checkout Transparente
// ==========================================

/**
 * POST /api/payments/mercadopago/process
 * Processa pagamento com cartão
 */
router.post('/mercadopago/process', async (req, res) => {
  try {
    const { processarPagamentoCartao } = await import('../services/payment-mercadopago.js');
    const result = await processarPagamentoCartao(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro MercadoPago process:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.message || error.message });
  }
});

/**
 * POST /api/payments/mercadopago/pix
 * Gera pagamento via Pix
 */
router.post('/mercadopago/pix', async (req, res) => {
  try {
    const { gerarPix } = await import('../services/payment-mercadopago.js');
    const result = await gerarPix(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro MercadoPago pix:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.message || error.message });
  }
});

/**
 * POST /api/payments/mercadopago/webhook
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

// ==========================================
// STRIPE - Payment Intents (Embedded)
// ==========================================

/**
 * POST /api/payments/stripe/create-intent
 * Cria PaymentIntent para processar no frontend com Stripe Elements
 */
router.post('/stripe/create-intent', async (req, res) => {
  try {
    const { criarPaymentIntent } = await import('../services/payment-stripe.js');
    const result = await criarPaymentIntent(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro Stripe create-intent:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/stripe/webhook
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

export default router;
