import axios from 'axios';
import { env } from '../config/env.js';
import { supabase } from '../config/supabase.js';

/**
 * Serviço de Pagamento - MercadoPago
 * Ativar quando decidir por MercadoPago
 */

const mpClient = axios.create({
  baseURL: 'https://api.mercadopago.com',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${env.mercadopagoAccessToken}`,
  },
});

/**
 * Cria uma preferência de pagamento (redireciona para checkout do MP)
 */
export async function criarPreferencia({ orderId, items, customerEmail, customerName }) {
  const { data } = await mpClient.post('/checkout/preferences', {
    items: items.map(item => ({
      title: item.product_name,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: 'BRL',
      picture_url: item.image || undefined,
    })),
    payer: {
      email: customerEmail,
      name: customerName,
    },
    metadata: {
      order_id: orderId,
    },
    back_urls: {
      success: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/checkout/success`,
      failure: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/checkout`,
      pending: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/checkout/pending`,
    },
    auto_return: 'approved',
    notification_url: `${process.env.API_URL || 'http://localhost:3001'}/api/payments/mercadopago/webhook`,
  });

  return {
    preferenceId: data.id,
    initPoint: data.init_point,
    sandboxInitPoint: data.sandbox_init_point,
  };
}

/**
 * Processa webhook/IPN do MercadoPago
 */
export async function processarWebhookMercadoPago(body) {
  if (body.type === 'payment') {
    const paymentId = body.data?.id;
    if (!paymentId) return { received: true };

    // Buscar detalhes do pagamento
    const { data: payment } = await mpClient.get(`/v1/payments/${paymentId}`);
    const orderId = payment.metadata?.order_id;

    if (orderId && payment.status === 'approved') {
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          updated_date: new Date().toISOString(),
        })
        .eq('id', orderId);
    }
  }

  return { received: true };
}
