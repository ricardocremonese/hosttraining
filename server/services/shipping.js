import axios from 'axios';
import { env } from '../config/env.js';

/**
 * Serviço de Frete - Onlog Express
 * Documentação: consulte a API da Onlog para endpoints exatos
 */

const onlogClient = axios.create({
  baseURL: env.onlogApiUrl,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${env.onlogApiKey}`,
  },
});

/**
 * Calcula o frete com base no CEP de destino e dimensões dos itens
 */
export async function calcularFrete({ cepDestino, itens }) {
  // TODO: Ajustar payload conforme documentação da Onlog Express
  const payload = {
    shipper: {
      cnpj: env.onlogCnpj,
    },
    recipient: {
      zipcode: cepDestino,
    },
    packages: itens.map(item => ({
      weight: item.peso || 0.5,       // kg
      height: item.altura || 10,       // cm
      width: item.largura || 20,       // cm
      length: item.comprimento || 30,  // cm
      quantity: item.quantity || 1,
      value: item.price || 0,
    })),
  };

  try {
    const { data } = await onlogClient.post('/quote', payload);

    // Normalizar resposta para o frontend
    return {
      success: true,
      options: (data.options || data || []).map(option => ({
        carrier: option.carrier || option.transportadora,
        service: option.service || option.servico,
        price: parseFloat(option.price || option.valor || 0),
        deadline: option.deadline || option.prazo || 0,
        deadline_unit: 'dias úteis',
      })),
    };
  } catch (error) {
    console.error('Erro ao calcular frete Onlog:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Erro ao calcular frete',
    };
  }
}

/**
 * Rastreia uma encomenda
 */
export async function rastrearEncomenda(trackingCode) {
  try {
    const { data } = await onlogClient.get(`/tracking/${trackingCode}`);
    return { success: true, tracking: data };
  } catch (error) {
    console.error('Erro ao rastrear:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Erro ao rastrear encomenda',
    };
  }
}
