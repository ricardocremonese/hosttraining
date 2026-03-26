import 'dotenv/config';

export const env = {
  port: process.env.PORT || 3001,

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,

  // Onlog Express
  onlogApiUrl: process.env.ONLOG_API_URL,
  onlogApiKey: process.env.ONLOG_API_KEY,
  onlogCnpj: process.env.ONLOG_CNPJ,

  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

  // MercadoPago
  mercadopagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  mercadopagoWebhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
};
