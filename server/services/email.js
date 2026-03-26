import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { supabase } from '../config/supabase.js';

const storeName = 'HOST Training';

/**
 * Busca config do Resend no banco
 */
async function getResendConfig() {
  if (!supabase) return null;
  const { data } = await supabase
    .from('integrations_config')
    .select('config, enabled')
    .eq('provider', 'resend')
    .single();
  return data?.enabled ? data.config : null;
}

/**
 * Envia e-mail usando Resend (prioridade) ou SMTP (fallback)
 */
async function sendEmail({ to, subject, html }) {
  // Tentar Resend primeiro
  const resendConfig = await getResendConfig();
  if (resendConfig?.api_key) {
    const resend = new Resend(resendConfig.api_key);
    const fromEmail = resendConfig.from_email || 'noreply@hosttraining.com.br';
    const fromName = resendConfig.from_name || storeName;

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html,
    });

    if (error) throw new Error(error.message);
    console.log(`✉ [Resend] E-mail enviado para ${to}`);
    return { sent: true, provider: 'resend', id: data?.id };
  }

  // Fallback SMTP
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

    await transporter.sendMail({
      from: `"${storeName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });

    console.log(`✉ [SMTP] E-mail enviado para ${to}`);
    return { sent: true, provider: 'smtp' };
  }

  console.warn('⚠ Nenhum provedor de e-mail configurado.');
  return { sent: false, reason: 'No email provider configured' };
}

/**
 * Envia e-mail de confirmação de pedido
 */
export async function enviarConfirmacaoPedido(order) {
  const addr = order.shipping_address || {};

  const itensHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;">${item.product_name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;text-align:center;">${item.size || '-'}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;text-align:right;">R$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333;">
      <div style="background:#111;padding:24px;text-align:center;">
        <h1 style="color:#F5921B;margin:0;font-size:24px;">${storeName}</h1>
      </div>
      <div style="padding:24px;">
        <h2 style="font-size:20px;margin:0 0 8px;">Pedido Confirmado!</h2>
        <p style="color:#666;font-size:14px;margin:0 0 24px;">
          Olá <strong>${order.customer_name}</strong>, recebemos seu pedido com sucesso.
        </p>
        <div style="background:#f5f5f5;padding:16px;margin-bottom:24px;">
          <p style="margin:0;font-size:12px;color:#666;">Número do pedido</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:bold;font-family:monospace;">${order.order_number}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead>
            <tr style="border-bottom:2px solid #111;">
              <th style="text-align:left;padding:8px 0;font-size:12px;color:#666;">Produto</th>
              <th style="text-align:center;padding:8px 0;font-size:12px;color:#666;">Tam.</th>
              <th style="text-align:center;padding:8px 0;font-size:12px;color:#666;">Qtd</th>
              <th style="text-align:right;padding:8px 0;font-size:12px;color:#666;">Valor</th>
            </tr>
          </thead>
          <tbody>${itensHtml}</tbody>
        </table>
        <div style="border-top:2px solid #111;padding-top:12px;margin-bottom:24px;">
          <table style="width:100%;">
            <tr><td style="font-size:14px;color:#666;padding:2px 0;">Subtotal</td><td style="text-align:right;font-size:14px;">R$${order.subtotal?.toFixed(2)}</td></tr>
            <tr><td style="font-size:14px;color:#666;padding:2px 0;">Frete</td><td style="text-align:right;font-size:14px;">${order.shipping_cost === 0 ? 'Grátis' : `R$${order.shipping_cost?.toFixed(2)}`}</td></tr>
            <tr><td style="font-size:16px;font-weight:bold;padding:8px 0 0;">Total</td><td style="text-align:right;font-size:16px;font-weight:bold;padding:8px 0 0;">R$${order.total?.toFixed(2)}</td></tr>
          </table>
        </div>
        <div style="background:#f5f5f5;padding:16px;margin-bottom:24px;">
          <p style="margin:0 0 4px;font-size:12px;color:#666;font-weight:bold;">Endereço de entrega</p>
          <p style="margin:0;font-size:14px;">${addr.street || ''}${addr.complement ? `, ${addr.complement}` : ''}</p>
          <p style="margin:0;font-size:14px;">${addr.city || ''}, ${addr.state || ''} - ${addr.zip || ''}</p>
        </div>
        <div style="text-align:center;margin-top:32px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/rastreio?pedido=${order.order_number}"
             style="display:inline-block;background:#111;color:#fff;padding:14px 32px;text-decoration:none;font-size:14px;font-weight:bold;">
            Acompanhar Pedido
          </a>
        </div>
      </div>
      <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:11px;color:#999;">
        <p style="margin:0;">${storeName} | CNPJ 63.443.407/0001-03</p>
        <p style="margin:4px 0 0;">hosttraining89@gmail.com | WhatsApp: (11) 99593-3974</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: order.customer_email,
    subject: `Pedido ${order.order_number} confirmado - ${storeName}`,
    html,
  });
}

/**
 * Envia campanha para um e-mail
 */
export async function enviarCampanha({ to, subject, html }) {
  return sendEmail({ to, subject, html });
}
