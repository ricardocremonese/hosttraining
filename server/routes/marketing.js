import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { enviarCampanha } from '../services/email.js';
import { gerarConteudo } from '../services/ai.js';

const router = Router();

/**
 * POST /api/marketing/campaigns/send
 * Envia uma campanha para todos os clientes com e-mail cadastrado
 */
router.post('/campaigns/send', async (req, res) => {
  try {
    const { campaignId } = req.body;
    if (!supabase) return res.status(500).json({ error: 'Supabase não configurado' });

    // Buscar campanha
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });

    // Buscar emails únicos dos clientes
    const { data: orders } = await supabase
      .from('orders')
      .select('customer_email, customer_name')
      .not('customer_email', 'is', null);

    const uniqueEmails = new Map();
    (orders || []).forEach(o => {
      if (o.customer_email && !uniqueEmails.has(o.customer_email)) {
        uniqueEmails.set(o.customer_email, o.customer_name);
      }
    });

    let sentCount = 0;
    for (const [email] of uniqueEmails) {
      try {
        const result = await enviarCampanha({
          to: email,
          subject: campaign.subject || campaign.name,
          html: campaign.body_html || `<h1>${campaign.name}</h1>`,
        });
        if (result.sent) sentCount++;
      } catch (err) {
        console.error(`Erro ao enviar para ${email}:`, err.message);
      }
    }

    // Atualizar campanha
    await supabase.from('campaigns').update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      sent_count: sentCount,
      updated_date: new Date().toISOString(),
    }).eq('id', campaignId);

    res.json({ success: true, sent_count: sentCount });
  } catch (error) {
    console.error('Erro ao enviar campanha:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/marketing/whatsapp/order-status
 * Envia mensagem de status do pedido via WhatsApp (placeholder para API do WhatsApp Business)
 */
router.post('/whatsapp/order-status', async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!supabase) return res.status(500).json({ error: 'Supabase não configurado' });

    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

    const statusMessages = {
      pending: `Olá ${order.customer_name}! Seu pedido *${order.order_number}* foi recebido e está aguardando confirmação.`,
      confirmed: `${order.customer_name}, seu pedido *${order.order_number}* foi confirmado! Estamos preparando para envio.`,
      shipped: `Boa notícia, ${order.customer_name}! Seu pedido *${order.order_number}* foi enviado! 🚚`,
      delivered: `${order.customer_name}, seu pedido *${order.order_number}* foi entregue! Esperamos que goste. ⭐`,
      cancelled: `${order.customer_name}, informamos que seu pedido *${order.order_number}* foi cancelado. Entre em contato caso tenha dúvidas.`,
    };

    const message = statusMessages[order.status] || `Atualização do pedido ${order.order_number}: ${order.status}`;
    const phone = order.customer_phone?.replace(/\D/g, '');

    // TODO: Integrar com API WhatsApp Business quando disponível
    // Por enquanto, retorna a URL do WhatsApp Web para envio manual
    const waUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;

    res.json({ success: true, message, whatsapp_url: waUrl, phone });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/marketing/ai/generate
 * Gera conteúdo com IA (placeholder - conectar com API de IA)
 */
router.post('/ai/generate', async (req, res) => {
  try {
    const result = await gerarConteudo(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar conteúdo IA:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
