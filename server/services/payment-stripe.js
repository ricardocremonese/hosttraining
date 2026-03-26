import Stripe from 'stripe';
import { supabase } from '../config/supabase.js';

/**
 * Busca config do Stripe no banco
 */
async function getConfig() {
  if (!supabase) throw new Error('Supabase não configurado');
  const { data } = await supabase
    .from('integrations_config')
    .select('config, enabled')
    .eq('provider', 'stripe')
    .single();

  if (!data?.enabled) throw new Error('Stripe não está ativo');
  return data.config;
}

/**
 * Cria um PaymentIntent para processar cartão no frontend
 */
export async function criarPaymentIntent({ orderId, orderNumber, amount, customerEmail }) {
  const config = await getConfig();
  const stripe = new Stripe(config.secret_key);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // centavos
    currency: 'brl',
    metadata: {
      order_id: orderId,
      order_number: orderNumber,
    },
    receipt_email: customerEmail,
    description: `Pedido ${orderNumber} - HOST Training`,
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Webhook do Stripe
 */
export async function processarWebhookStripe(rawBody, signature) {
  const config = await getConfig();
  const stripe = new Stripe(config.secret_key);

  // Se tiver webhook secret configurado, verificar assinatura
  let event;
  if (config.webhook_secret) {
    event = stripe.webhooks.constructEvent(rawBody, signature, config.webhook_secret);
  } else {
    event = JSON.parse(rawBody);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata?.order_id;

    if (orderId) {
      await supabase.from('orders').update({
        payment_status: 'paid',
        status: 'confirmed',
        updated_date: new Date().toISOString(),
      }).eq('id', orderId);
    }
  }

  return { received: true };
}
