import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const fromEmail = process.env.SMTP_FROM || 'hosttraining89@gmail.com';
const storeName = 'HOST Training';

/**
 * Envia e-mail de confirmação de pedido para o cliente
 */
export async function enviarConfirmacaoPedido(order) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠ SMTP não configurado. E-mail não enviado.');
    return { sent: false, reason: 'SMTP not configured' };
  }

  const itensHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;">${item.product_name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;text-align:center;">${item.size || '-'}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;text-align:right;">R$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const addr = order.shipping_address || {};

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
              <th style="text-align:left;padding:8px 0;font-size:12px;text-transform:uppercase;color:#666;">Produto</th>
              <th style="text-align:center;padding:8px 0;font-size:12px;text-transform:uppercase;color:#666;">Tam.</th>
              <th style="text-align:center;padding:8px 0;font-size:12px;text-transform:uppercase;color:#666;">Qtd</th>
              <th style="text-align:right;padding:8px 0;font-size:12px;text-transform:uppercase;color:#666;">Valor</th>
            </tr>
          </thead>
          <tbody>${itensHtml}</tbody>
        </table>

        <div style="border-top:2px solid #111;padding-top:12px;margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:4px;">
            <span style="color:#666;">Subtotal</span>
            <span>R$${order.subtotal?.toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:4px;">
            <span style="color:#666;">Frete</span>
            <span>${order.shipping_cost === 0 ? 'Grátis' : `R$${order.shipping_cost?.toFixed(2)}`}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:bold;margin-top:8px;">
            <span>Total</span>
            <span>R$${order.total?.toFixed(2)}</span>
          </div>
        </div>

        <div style="background:#f5f5f5;padding:16px;margin-bottom:24px;">
          <p style="margin:0 0 4px;font-size:12px;color:#666;text-transform:uppercase;font-weight:bold;">Endereço de entrega</p>
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

  try {
    await transporter.sendMail({
      from: `"${storeName}" <${fromEmail}>`,
      to: order.customer_email,
      subject: `Pedido ${order.order_number} confirmado - ${storeName}`,
      html,
    });
    console.log(`✉ E-mail enviado para ${order.customer_email}`);
    return { sent: true };
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return { sent: false, error: error.message };
  }
}
