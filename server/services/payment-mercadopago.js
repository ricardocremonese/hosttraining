import axios from 'axios';
import { supabase } from '../config/supabase.js';

/**
 * Busca config do MercadoPago no banco
 */
async function getConfig() {
  if (!supabase) throw new Error('Supabase não configurado');
  const { data } = await supabase
    .from('integrations_config')
    .select('config, enabled')
    .eq('provider', 'mercadopago')
    .single();

  if (!data?.enabled) throw new Error('MercadoPago não está ativo');
  return data.config;
}

/**
 * Processa pagamento com cartão via Checkout Transparente (API de Orders)
 */
export async function processarPagamentoCartao({ orderId, orderNumber, token, installments, paymentMethodId, payer, transactionAmount }) {
  const config = await getConfig();

  const { data } = await axios.post('https://api.mercadopago.com/v1/payments', {
    transaction_amount: transactionAmount,
    token,
    installments: installments || 1,
    payment_method_id: paymentMethodId,
    payer: {
      email: payer.email,
      identification: {
        type: 'CPF',
        number: payer.cpf?.replace(/\D/g, ''),
      },
    },
    metadata: {
      order_id: orderId,
      order_number: orderNumber,
    },
    description: `Pedido ${orderNumber} - HOST Training`,
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.access_token}`,
      'X-Idempotency-Key': `${orderId}-${Date.now()}`,
    },
  });

  // Atualizar status no banco
  if (data.status === 'approved') {
    await supabase.from('orders').update({
      payment_status: 'paid',
      status: 'confirmed',
      updated_date: new Date().toISOString(),
    }).eq('id', orderId);
  } else if (data.status === 'pending' || data.status === 'in_process') {
    await supabase.from('orders').update({
      payment_status: 'pending',
      updated_date: new Date().toISOString(),
    }).eq('id', orderId);
  }

  return {
    status: data.status,
    status_detail: data.status_detail,
    payment_id: data.id,
  };
}

/**
 * Gera pagamento via Pix
 */
export async function gerarPix({ orderId, orderNumber, payer, transactionAmount }) {
  const config = await getConfig();

  const { data } = await axios.post('https://api.mercadopago.com/v1/payments', {
    transaction_amount: transactionAmount,
    payment_method_id: 'pix',
    payer: {
      email: payer.email,
      identification: {
        type: 'CPF',
        number: payer.cpf?.replace(/\D/g, ''),
      },
    },
    metadata: {
      order_id: orderId,
      order_number: orderNumber,
    },
    description: `Pedido ${orderNumber} - HOST Training`,
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.access_token}`,
      'X-Idempotency-Key': `pix-${orderId}-${Date.now()}`,
    },
  });

  return {
    status: data.status,
    payment_id: data.id,
    qr_code: data.point_of_interaction?.transaction_data?.qr_code,
    qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64,
    ticket_url: data.point_of_interaction?.transaction_data?.ticket_url,
  };
}

/**
 * Webhook do MercadoPago
 */
export async function processarWebhookMercadoPago(body) {
  if (body.type === 'payment' || body.action === 'payment.updated') {
    const paymentId = body.data?.id;
    if (!paymentId) return { received: true };

    const config = await getConfig();
    const { data: payment } = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${config.access_token}` },
    });

    const orderId = payment.metadata?.order_id;
    if (orderId && payment.status === 'approved') {
      await supabase.from('orders').update({
        payment_status: 'paid',
        status: 'confirmed',
        updated_date: new Date().toISOString(),
      }).eq('id', orderId);
    }
  }
  return { received: true };
}
