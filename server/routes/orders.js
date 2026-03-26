import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { enviarConfirmacaoPedido } from '../services/email.js';

const router = Router();

/**
 * POST /api/orders
 * Cria um novo pedido e inicia o fluxo de pagamento
 */
router.post('/', async (req, res) => {
  try {
    const { items, customer_name, customer_email, shipping_address, subtotal, shipping_cost, total } = req.body;

    // Criar pedido no Supabase
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        items,
        customer_name,
        customer_email,
        shipping_address,
        subtotal,
        shipping_cost,
        total,
        status: 'pending',
        payment_status: 'pending',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Envia e-mail de confirmação (async, não bloqueia resposta)
    if (order.customer_email) {
      enviarConfirmacaoPedido(order).catch(err => console.error('Falha ao enviar e-mail:', err));
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

/**
 * GET /api/orders/:id
 * Busca um pedido por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

    res.json(order);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
});

export default router;
