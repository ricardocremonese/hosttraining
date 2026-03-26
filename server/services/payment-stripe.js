import Stripe from 'stripe';
import { env } from '../config/env.js';
import { supabase } from '../config/supabase.js';

/**
 * Serviço de Pagamento - Stripe
 * Ativar quando decidir por Stripe
 */

let stripe = null;

function getStripe() {
  if (!stripe && env.stripeSecretKey) {
    stripe = new Stripe(env.stripeSecretKey);
  }
  return stripe;
}

/**
 * Cria uma sessão de checkout do Stripe
 */
export async function criarCheckoutSession({ orderId, items, customerEmail, successUrl, cancelUrl }) {
  const s = getStripe();
  if (!s) throw new Error('Stripe não configurado');

  const session = await s.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: customerEmail,
    metadata: { order_id: orderId },
    line_items: items.map(item => ({
      price_data: {
        currency: 'brl',
        product_data: {
          name: item.product_name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100), // centavos
      },
      quantity: item.quantity,
    })),
    mode: 'payment',
    success_url: successUrl || `${process.env.FRONTEND_URL || 'http://localhost:8080'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:8080'}/checkout`,
  });

  return { sessionId: session.id, url: session.url };
}

/**
 * Processa webhook do Stripe
 */
export async function processarWebhookStripe(rawBody, signature) {
  const s = getStripe();
  if (!s) throw new Error('Stripe não configurado');

  const event = s.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata.order_id;

    if (orderId) {
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
