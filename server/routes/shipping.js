import { Router } from 'express';
import { calcularFrete, rastrearEncomenda } from '../services/shipping.js';

const router = Router();

/**
 * POST /api/shipping/quote
 * Calcula o frete para um CEP de destino
 * Body: { cepDestino: "01001000", itens: [{ peso, altura, largura, comprimento, quantity, price }] }
 */
router.post('/quote', async (req, res) => {
  try {
    const { cepDestino, itens } = req.body;

    if (!cepDestino) {
      return res.status(400).json({ error: 'CEP de destino é obrigatório' });
    }

    const result = await calcularFrete({ cepDestino, itens: itens || [] });
    res.json(result);
  } catch (error) {
    console.error('Erro na rota de frete:', error);
    res.status(500).json({ error: 'Erro interno ao calcular frete' });
  }
});

/**
 * GET /api/shipping/tracking/:code
 * Rastreia uma encomenda
 */
router.get('/tracking/:code', async (req, res) => {
  try {
    const result = await rastrearEncomenda(req.params.code);
    res.json(result);
  } catch (error) {
    console.error('Erro na rota de rastreio:', error);
    res.status(500).json({ error: 'Erro interno ao rastrear' });
  }
});

export default router;
