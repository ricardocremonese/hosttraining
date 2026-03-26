import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../config/supabase.js';

/**
 * Busca configs de IA no banco
 */
async function getAIConfig() {
  if (!supabase) return { provider: null };

  // Tentar Anthropic primeiro, depois OpenAI
  const { data: configs } = await supabase
    .from('integrations_config')
    .select('provider, config, enabled')
    .in('provider', ['anthropic', 'openai'])
    .eq('enabled', true);

  if (!configs?.length) return { provider: null };

  // Prioridade: Anthropic > OpenAI
  const anthropicConfig = configs.find(c => c.provider === 'anthropic');
  if (anthropicConfig?.config?.api_key) {
    return { provider: 'anthropic', config: anthropicConfig.config };
  }

  const openaiConfig = configs.find(c => c.provider === 'openai');
  if (openaiConfig?.config?.api_key) {
    return { provider: 'openai', config: openaiConfig.config };
  }

  return { provider: null };
}

/**
 * Gera conteúdo usando IA (Anthropic ou OpenAI)
 */
export async function gerarConteudo({ prompt, product, contentType, tone }) {
  const { provider, config } = await getAIConfig();

  const productInfo = product
    ? `Produto: ${product.name}, Preço: R$${Number(product.price || 0).toFixed(2)}${product.sale_price ? `, Promoção: R$${Number(product.sale_price).toFixed(2)}` : ''}, Categoria: ${product.category}, Descrição: ${product.description || 'Sem descrição'}`
    : 'Loja HOST Training - Equipamentos táticos, armas, vestuário, proteção e acessórios.';

  const contentTypeLabel = { instagram: 'post para Instagram', email: 'e-mail marketing', whatsapp: 'mensagem para WhatsApp' }[contentType] || 'texto de marketing';

  const systemPrompt = `Você é um especialista em copywriting para e-commerce. A loja se chama HOST Training e vende equipamentos táticos, armas, suprimentos, vestuário, proteção, cutelaria e acessórios. O público-alvo são praticantes de airsoft, tiro esportivo e atividades táticas. O WhatsApp da loja é (11) 99593-3974 e o site é hosttraining.com.br.`;

  const userPrompt = prompt || `Crie um ${contentTypeLabel} com tom ${(tone || 'profissional').toLowerCase()} para:\n${productInfo}\n\nO texto deve ser pronto para copiar e usar, sem explicações extras. Se for Instagram, inclua hashtags relevantes. Se for e-mail, inclua assunto e corpo. Se for WhatsApp, use formatação com *negrito* e emojis.`;

  // Anthropic (Claude)
  if (provider === 'anthropic') {
    const client = new Anthropic({ apiKey: config.api_key });
    const model = config.model || 'claude-sonnet-4-20250514';

    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    return { content: response.content[0]?.text || '', provider: 'anthropic', model };
  }

  // OpenAI (GPT)
  if (provider === 'openai') {
    const client = new OpenAI({ apiKey: config.api_key });
    const model = config.model || 'gpt-4o-mini';

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1024,
    });

    return { content: response.choices[0]?.message?.content || '', provider: 'openai', model };
  }

  // Fallback local — gerador baseado em templates variáveis
  return { content: gerarFallback(product, contentType, tone, prompt), provider: 'local', model: 'fallback' };
}

function gerarFallback(product, contentType, tone, customPrompt) {
  const name = product?.name || 'nossos produtos';
  const price = product?.sale_price || product?.price;
  const desc = product?.description || '';
  const category = product?.category || '';
  const isShort = customPrompt && /menor|curto|pequen|resum|compact/i.test(customPrompt);
  const wantNew = customPrompt && /novo|outr|diferent|alter/i.test(customPrompt);

  // Variações de abertura
  const openings = {
    Profissional: ['Apresentamos', 'Conheça', 'Descubra', 'Equipamento de elite:'],
    Casual: ['Olha só!', 'Bora?', 'Chegou!', 'Confere aí!'],
    Urgente: ['ÚLTIMAS UNIDADES!', 'CORRE!', 'NÃO PERCA!', 'OFERTA RELÂMPAGO!'],
    Inspirador: ['Supere seus limites.', 'O próximo nível te espera.', 'Prepare-se para a missão.', 'Sua performance começa aqui.'],
    Divertido: ['Bora equipar! 🔥', 'Tá preparado? 😎', 'Isso aqui é outro nível! 💪', 'Se não comprar, vai se arrepender! 😄'],
  };

  const opening = openings[tone]?.[Math.floor(Math.random() * 4)] || openings.Profissional[0];
  const priceText = price ? `R$${Number(price).toFixed(2)}` : '';
  const seed = Date.now() % 3; // variação a cada chamada

  if (contentType === 'instagram') {
    if (isShort) {
      const shorts = [
        `${opening} ${name}${priceText ? ` por ${priceText}` : ''} 🎯\n\n🛒 Link na bio!\n\n#HostTraining #Tático`,
        `${name} ✅${priceText ? ` ${priceText}` : ''}\n${opening}\n\n👉 Link na bio\n#HostTraining #Airsoft`,
        `🔥 ${name}${priceText ? ` | ${priceText}` : ''}\n${opening}\n\n#HostTraining #Equipamento`,
      ];
      return shorts[seed];
    }
    const posts = [
      `${opening}\n\n🎯 ${name}\n\n${desc ? desc.slice(0, 150) + '...' : 'Performance e qualidade que você precisa.'}\n\n${priceText ? `💰 ${priceText}` : ''}\n\n🛒 Link na bio!\n\n#HostTraining #Tático #Airsoft #Equipamento #MilSim`,
      `${name}\n\n${opening}\n${desc ? desc.slice(0, 120) : 'O melhor para sua missão.'}\n\n${priceText ? `Apenas ${priceText} 🏷️` : ''}Garanta o seu!\n\n👉 Link na bio\n\n#HostTraining #${category || 'Tático'} #Airsoft #GearUp`,
      `✅ ${name}\n\n${opening}\n\n${desc ? desc.slice(0, 100) : 'Qualidade HOST Training.'}\n\n${priceText ? `💰 ${priceText}\n` : ''}📦 Enviamos para todo o Brasil\n\n#HostTraining #Equipamento #Airsoft`,
    ];
    return posts[seed];
  }

  if (contentType === 'email') {
    if (isShort) {
      return `Assunto: ${name}${priceText ? ` — ${priceText}` : ''}\n\nOlá!\n\n${opening} ${name}.${priceText ? ` Por ${priceText}.` : ''}\n\n👉 hosttraining.com.br\n\nEquipe HOST Training`;
    }
    const emails = [
      `Assunto: ${opening} ${name}\n\nOlá!\n\n${desc || `${name} é o equipamento ideal para quem busca performance.`}\n\n${priceText ? `Preço especial: ${priceText}` : 'Confira no site!'}\n\n👉 hosttraining.com.br\n\nQualquer dúvida, estamos no WhatsApp (11) 99593-3974.\n\nAbraços,\nEquipe HOST Training`,
      `Assunto: ${name} — Oferta HOST Training\n\nOlá!\n\n${opening}\n\n🎯 ${name}\n${desc ? desc.slice(0, 200) : ''}\n\n${priceText ? `💰 ${priceText}` : ''}\n\nAcesse: hosttraining.com.br\n\nAbraços,\nHOST Training`,
    ];
    return emails[seed % 2];
  }

  // WhatsApp
  if (isShort) {
    return `${opening} *${name}*${priceText ? ` por ${priceText}` : ''} 🎯\n\nhosttraining.com.br`;
  }
  const msgs = [
    `${opening}\n\nConfira o *${name}* na HOST Training!\n\n${desc ? desc.slice(0, 100) : ''}\n\n${priceText ? `💰 ${priceText}` : ''}\n\n🛒 hosttraining.com.br\n\nDúvidas? Responde aqui! 🎯`,
    `Olá! 👋\n\n${opening}\n\n*${name}*\n${desc ? desc.slice(0, 80) : 'Equipamento tático de qualidade.'}\n\n${priceText ? `Apenas ${priceText}!` : ''}\n\nhosttraining.com.br`,
  ];
  return msgs[seed % 2];
}
