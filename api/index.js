import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Services
import { supabase } from '../server/config/supabase.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ============ HEALTH ============
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    runtime: 'vercel-serverless',
  });
});

// ============ PAYMENTS ============
app.get('/api/payments/active-provider', async (req, res) => {
  try {
    if (!supabase) return res.json({ provider: null });
    const { data } = await supabase
      .from('integrations_config')
      .select('provider, config')
      .eq('category', 'payment')
      .eq('enabled', true)
      .limit(1);

    if (data?.length > 0) {
      res.json({ provider: data[0].provider, publicKey: data[0].config?.public_key || '' });
    } else {
      res.json({ provider: null });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments/mercadopago/process', async (req, res) => {
  try {
    const { processarPagamentoCartao } = await import('../server/services/payment-mercadopago.js');
    const result = await processarPagamentoCartao(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments/mercadopago/pix', async (req, res) => {
  try {
    const { gerarPix } = await import('../server/services/payment-mercadopago.js');
    const result = await gerarPix(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments/mercadopago/webhook', async (req, res) => {
  try {
    const { processarWebhookMercadoPago } = await import('../server/services/payment-mercadopago.js');
    const result = await processarWebhookMercadoPago(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/payments/stripe/create-intent', async (req, res) => {
  try {
    const { criarPaymentIntent } = await import('../server/services/payment-stripe.js');
    const result = await criarPaymentIntent(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments/stripe/webhook', async (req, res) => {
  try {
    const { processarWebhookStripe } = await import('../server/services/payment-stripe.js');
    const result = await processarWebhookStripe(req.body, req.headers['stripe-signature']);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============ ORDERS ============
app.post('/api/orders', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'DB not configured' });
    const { items, customer_name, customer_email, customer_phone, customer_cpf, customer_birthday, shipping_address, subtotal, shipping_cost, total, order_number } = req.body;

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        order_number, items, customer_name, customer_email, customer_phone, customer_cpf, customer_birthday,
        shipping_address, subtotal, shipping_cost, total,
        status: 'pending', payment_status: 'pending',
        created_date: new Date().toISOString(), updated_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // E-mail async
    if (order.customer_email) {
      import('../server/services/email.js').then(({ enviarConfirmacaoPedido }) => {
        enviarConfirmacaoPedido(order).catch(console.error);
      }).catch(console.error);
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'DB not configured' });
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SHIPPING ============
app.post('/api/shipping/quote', async (req, res) => {
  try {
    const { calcularFrete } = await import('../server/services/shipping.js');
    const result = await calcularFrete(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ MARKETING ============
app.post('/api/marketing/campaigns/send', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'DB not configured' });
    const { enviarCampanha } = await import('../server/services/email.js');
    const { campaignId } = req.body;

    const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });

    const { data: orders } = await supabase.from('orders').select('customer_email, customer_name').not('customer_email', 'is', null);
    const uniqueEmails = new Map();
    (orders || []).forEach(o => { if (o.customer_email && !uniqueEmails.has(o.customer_email)) uniqueEmails.set(o.customer_email, o.customer_name); });

    let sentCount = 0;
    for (const [email] of uniqueEmails) {
      try {
        const result = await enviarCampanha({ to: email, subject: campaign.subject || campaign.name, html: campaign.body_html || `<h1>${campaign.name}</h1>` });
        if (result.sent) sentCount++;
      } catch {}
    }

    await supabase.from('campaigns').update({ status: 'sent', sent_at: new Date().toISOString(), sent_count: sentCount, updated_date: new Date().toISOString() }).eq('id', campaignId);
    res.json({ success: true, sent_count: sentCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/marketing/whatsapp/order-status', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'DB not configured' });
    const { orderId } = req.body;
    const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

    const statusMessages = {
      pending: `Olá ${order.customer_name}! Seu pedido *${order.order_number}* foi recebido.`,
      confirmed: `${order.customer_name}, seu pedido *${order.order_number}* foi confirmado!`,
      shipped: `Boa notícia! Seu pedido *${order.order_number}* foi enviado! 🚚`,
      delivered: `Seu pedido *${order.order_number}* foi entregue! ⭐`,
      cancelled: `Seu pedido *${order.order_number}* foi cancelado.`,
    };
    const message = statusMessages[order.status] || `Atualização do pedido ${order.order_number}`;
    const phone = order.customer_phone?.replace(/\D/g, '');
    res.json({ success: true, message, whatsapp_url: `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, phone });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/marketing/ai/generate', async (req, res) => {
  try {
    const { gerarConteudo } = await import('../server/services/ai.js');
    const result = await gerarConteudo(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export for Vercel
export default app;
