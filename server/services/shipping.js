import axios from 'axios';
import { supabase } from '../config/supabase.js';

/**
 * Busca provedores de frete ativos no banco
 */
async function getActiveShippingProviders() {
  if (!supabase) return [];
  const { data } = await supabase
    .from('integrations_config')
    .select('*')
    .eq('category', 'shipping')
    .eq('enabled', true);
  return data || [];
}

/**
 * Correios - calcula frete
 */
async function cotarCorreios(config, { cepDestino, itens }) {
  const peso = itens.reduce((sum, i) => sum + (i.peso || 0.5) * (i.quantity || 1), 0);
  try {
    const { data } = await axios.get('https://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx', {
      params: {
        nCdEmpresa: config.contrato || '',
        sDsSenha: config.senha || '',
        nCdServico: '04014,04510', // SEDEX, PAC
        sCepOrigem: config.cep_origem?.replace(/\D/g, ''),
        sCepDestino: cepDestino.replace(/\D/g, ''),
        nVlPeso: peso,
        nCdFormato: 1,
        nVlComprimento: 30,
        nVlAltura: 10,
        nVlLargura: 20,
        nVlDiametro: 0,
        sCdMaoPropria: 'N',
        nVlValorDeclarado: 0,
        sCdAvisoRecebimento: 'N',
        StrRetorno: 'xml',
        nIndicaCalculo: 3,
      },
    });
    // Parse XML response simplificado
    const results = [];
    const services = { '04014': 'SEDEX', '04510': 'PAC' };
    for (const [code, name] of Object.entries(services)) {
      const valorMatch = data.match(new RegExp(`<Codigo>${code}<\\/Codigo>[\\s\\S]*?<Valor>([^<]+)<\\/Valor>`));
      const prazoMatch = data.match(new RegExp(`<Codigo>${code}<\\/Codigo>[\\s\\S]*?<PrazoEntrega>([^<]+)<\\/PrazoEntrega>`));
      if (valorMatch) {
        results.push({
          carrier: 'Correios',
          service: name,
          price: parseFloat(valorMatch[1].replace(',', '.')),
          deadline: parseInt(prazoMatch?.[1] || '7'),
          deadline_unit: 'dias úteis',
        });
      }
    }
    return results;
  } catch (error) {
    console.error('Erro Correios:', error.message);
    return [];
  }
}

/**
 * Melhor Envio - calcula frete
 */
async function cotarMelhorEnvio(config, { cepDestino, itens }) {
  try {
    const products = itens.map(item => ({
      id: item.product_id || '1',
      width: item.largura || 20,
      height: item.altura || 10,
      length: item.comprimento || 30,
      weight: item.peso || 0.5,
      insurance_value: item.price || 0,
      quantity: item.quantity || 1,
    }));

    const { data } = await axios.post('https://melhorenvio.com.br/api/v2/me/shipment/calculate', {
      from: { postal_code: config.cep_origem?.replace(/\D/g, '') },
      to: { postal_code: cepDestino.replace(/\D/g, '') },
      products,
    }, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    return (data || [])
      .filter(o => !o.error)
      .map(option => ({
        carrier: option.company?.name || 'Melhor Envio',
        service: option.name,
        price: parseFloat(option.price || 0),
        deadline: parseInt(option.delivery_time || 7),
        deadline_unit: 'dias úteis',
      }));
  } catch (error) {
    console.error('Erro Melhor Envio:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Onlog Express - calcula frete
 */
async function cotarOnlog(config, { cepDestino, itens }) {
  try {
    const { data } = await axios.post(`${config.api_url || 'https://api.onlogexpress.com'}/quote`, {
      shipper: { cnpj: config.cnpj },
      recipient: { zipcode: cepDestino.replace(/\D/g, '') },
      packages: itens.map(item => ({
        weight: item.peso || 0.5,
        height: item.altura || 10,
        width: item.largura || 20,
        length: item.comprimento || 30,
        quantity: item.quantity || 1,
        value: item.price || 0,
      })),
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.api_key}`,
      },
    });

    return (data.options || data || []).map(option => ({
      carrier: option.carrier || 'Onlog Express',
      service: option.service || option.servico || 'Padrão',
      price: parseFloat(option.price || option.valor || 0),
      deadline: parseInt(option.deadline || option.prazo || 7),
      deadline_unit: 'dias úteis',
    }));
  } catch (error) {
    console.error('Erro Onlog:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Calcula frete usando TODOS os provedores ativos
 */
export async function calcularFrete({ cepDestino, itens }) {
  const providers = await getActiveShippingProviders();
  const allOptions = [];

  for (const provider of providers) {
    try {
      let options = [];
      switch (provider.provider) {
        case 'correios':
          options = await cotarCorreios(provider.config, { cepDestino, itens });
          break;
        case 'melhorenvio':
          options = await cotarMelhorEnvio(provider.config, { cepDestino, itens });
          break;
        case 'onlog':
          options = await cotarOnlog(provider.config, { cepDestino, itens });
          break;
      }
      allOptions.push(...options);
    } catch (error) {
      console.error(`Erro ao cotar ${provider.provider}:`, error.message);
    }
  }

  // Ordenar por preço
  allOptions.sort((a, b) => a.price - b.price);

  return {
    success: true,
    options: allOptions,
  };
}

/**
 * Rastreia uma encomenda (placeholder)
 */
export async function rastrearEncomenda(trackingCode) {
  return {
    success: false,
    error: 'Rastreio ainda não implementado para este provedor',
  };
}
