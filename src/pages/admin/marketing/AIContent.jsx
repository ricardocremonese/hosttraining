import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, Copy, Check, Instagram, Mail, MessageCircle, AlertTriangle, Link as LinkIcon, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const contentTypes = [
  { value: 'instagram', label: 'Post Instagram', icon: Instagram },
  { value: 'email', label: 'E-mail Marketing', icon: Mail },
  { value: 'whatsapp', label: 'Mensagem WhatsApp', icon: MessageCircle },
];

const toneOptions = ['Profissional', 'Casual', 'Urgente', 'Inspirador', 'Divertido'];

function ProductSearchSelect({ products, value, onChange }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = products.find(p => p.id === value);

  const filtered = search.trim()
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase()))
    : products;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium mb-1.5">Produto (opcional)</label>
      {selected ? (
        <div className="flex items-center gap-2 border border-border px-3 py-2.5">
          {selected.images?.[0] && <img src={selected.images[0]} alt="" className="w-8 h-8 object-cover flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selected.name}</p>
            <p className="text-[10px] text-muted-foreground">R${selected.price?.toFixed(2)}</p>
          </div>
          <button onClick={() => { onChange(''); setSearch(''); }} className="p-1 hover:bg-secondary"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar produto por nome..."
            className="w-full border border-border pl-9 pr-3 py-2.5 text-sm outline-none focus:border-foreground"
          />
        </div>
      )}
      {open && !selected && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-border shadow-lg max-h-64 overflow-y-auto">
          <button onClick={() => { onChange(''); setOpen(false); setSearch(''); }} className="w-full text-left px-3 py-2.5 text-sm hover:bg-secondary transition-colors text-muted-foreground">
            Geral — Loja HOST Training
          </button>
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted-foreground text-center">Nenhum produto encontrado</p>
          ) : filtered.map(p => (
            <button key={p.id} onClick={() => { onChange(p.id); setOpen(false); setSearch(''); }} className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-secondary transition-colors">
              {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-8 h-8 object-cover flex-shrink-0" /> : <div className="w-8 h-8 bg-secondary flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">R${p.price?.toFixed(2)} · {p.category}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AIContent() {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [contentType, setContentType] = useState('instagram');
  const [tone, setTone] = useState('Profissional');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [aiProvider, setAiProvider] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeAI, setActiveAI] = useState(null);
  const [checkingAI, setCheckingAI] = useState(true);

  // Verificar provedor de IA ativo
  useEffect(() => {
    setCheckingAI(true);
    base44.entities.Integration.list('provider', 100)
      .then(integrations => {
        const ai = integrations.find(i => ['openai', 'anthropic'].includes(i.provider) && i.enabled && i.config?.api_key);
        setActiveAI(ai ? { provider: ai.provider, model: ai.config.model } : null);
      })
      .catch(() => setActiveAI(null))
      .finally(() => setCheckingAI(false));
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 100),
  });

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedContent('');

    const product = products.find(p => p.id === selectedProduct);
    const typeLabel = contentTypes.find(t => t.value === contentType)?.label;

    const prompt = customPrompt || buildPrompt(product, contentType, tone);

    try {
      const res = await fetch('/api/marketing/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, product, contentType, tone }),
      });
      const data = await res.json();
      setGeneratedContent(data.content || data.error || 'Erro ao gerar conteúdo');
      setAiProvider(data.provider || '');
      setAiModel(data.model || '');
    } catch {
      setGeneratedContent(buildFallbackContent(product, contentType, tone));
      setAiProvider('local');
      setAiModel('fallback');
    }
    setLoading(false);
  };

  const buildPrompt = (product, type, tone) => {
    const productInfo = product ? `Produto: ${product.name}, Preço: R$${product.price?.toFixed(2)}${product.sale_price ? `, Promoção: R$${product.sale_price?.toFixed(2)}` : ''}, Categoria: ${product.category}` : 'Loja HOST Training - equipamentos táticos e esportivos';
    return `Crie um ${contentTypes.find(t => t.value === type)?.label} com tom ${tone.toLowerCase()} para:\n${productInfo}\nLoja: HOST Training - Equipamentos táticos, armas, vestuário e acessórios.\n\nGere o texto pronto para usar.`;
  };

  const buildFallbackContent = (product, type, tone) => {
    const name = product?.name || 'nossos produtos';
    const price = product?.sale_price || product?.price;

    if (type === 'instagram') {
      return `🔥 ${name}\n\n${product?.description || 'Qualidade e performance que você merece.'}\n\n💰 ${price ? `Por apenas R$${price.toFixed(2)}` : 'Confira os preços'}\n\n🛒 Link na bio!\n\n#HostTraining #Tático #Airsoft #Equipamento`;
    }
    if (type === 'email') {
      return `Assunto: ${name} - Oferta Especial HOST Training\n\nOlá!\n\nTemos uma oferta imperdível para você:\n\n${name}\n${product?.description || ''}\n${price ? `De R$${product?.price?.toFixed(2)} por R$${price.toFixed(2)}` : ''}\n\nAproveite antes que acabe!\n\nAbraços,\nEquipe HOST Training`;
    }
    return `Olá! 👋\n\nConfira o *${name}* na HOST Training!\n${price ? `💰 R$${price.toFixed(2)}` : ''}\n\nAcesse: hosttraining.com.br\n\nQualquer dúvida estamos à disposição! 🎯`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-500" /> IA — Gerador de Conteúdo
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Gere textos para redes sociais, e-mail marketing e WhatsApp</p>
      </div>

      {/* AI Status Banner */}
      {!checkingAI && (
        <div className={`mb-6 p-4 border flex items-center justify-between ${
          activeAI ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
        }`}>
          {activeAI ? (
            <div className="flex items-center gap-2">
              <span className="text-lg">{activeAI.provider === 'anthropic' ? '🧠' : '🤖'}</span>
              <div>
                <p className="text-sm font-medium text-green-800">
                  {activeAI.provider === 'anthropic' ? 'Claude (Anthropic)' : 'OpenAI'} ativo
                </p>
                <p className="text-xs text-green-600">Modelo: {activeAI.model} — Os conteúdos serão gerados por IA</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-amber-800">Nenhum provedor de IA configurado</p>
                <p className="text-xs text-amber-600">Configure OpenAI ou Anthropic nas Integrações para gerar conteúdo com IA real</p>
              </div>
            </div>
          )}
          <Link to="/admin/integrations" className="text-xs font-medium text-foreground underline hover:no-underline flex items-center gap-1">
            <LinkIcon className="w-3 h-3" /> Integrações
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Config */}
        <div className="space-y-4">
          <div className="bg-white border border-border p-6 space-y-4">
            <ProductSearchSelect
              products={products.filter(p => p.status === 'published')}
              value={selectedProduct}
              onChange={setSelectedProduct}
            />

            <div>
              <label className="block text-xs font-medium mb-2">Tipo de Conteúdo</label>
              <div className="flex gap-2">
                {contentTypes.map(t => (
                  <button key={t.value} onClick={() => setContentType(t.value)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border transition-colors ${contentType === t.value ? 'bg-foreground text-background' : 'border-border hover:border-foreground'}`}>
                    <t.icon className="w-3.5 h-3.5" strokeWidth={1.5} /> {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-2">Tom</label>
              <div className="flex flex-wrap gap-2">
                {toneOptions.map(t => (
                  <button key={t} onClick={() => setTone(t)}
                    className={`px-3 py-1.5 text-xs font-medium border transition-colors ${tone === t ? 'bg-foreground text-background' : 'border-border hover:border-foreground'}`}>{t}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5">Instruções Extras (opcional)</label>
              <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={3} placeholder="Ex: Mencionar frete grátis, usar emoji de fogo, incluir hashtags..." className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground resize-none" />
            </div>

            <button onClick={handleGenerate} disabled={loading}
              className="w-full bg-foreground text-background py-3 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              {loading ? 'Gerando...' : 'Gerar Conteúdo'}
            </button>
          </div>
        </div>

        {/* Output */}
        <div>
          <div className="bg-white border border-border p-6 min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold">Resultado</h2>
              {generatedContent && (
                <button onClick={handleCopy} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {copied ? <><Check className="w-3 h-3 text-green-600" /> Copiado!</> : <><Copy className="w-3 h-3" /> Copiar</>}
                </button>
              )}
            </div>
            {generatedContent ? (
              <div>
                <pre className="text-sm whitespace-pre-wrap leading-relaxed font-sans">{generatedContent}</pre>
                {aiProvider && (
                  <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 font-medium rounded ${
                      aiProvider === 'anthropic' ? 'bg-purple-50 text-purple-700' :
                      aiProvider === 'openai' ? 'bg-green-50 text-green-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {aiProvider === 'anthropic' ? '🧠 Claude' : aiProvider === 'openai' ? '🤖 OpenAI' : '📝 Local'}
                    </span>
                    {aiModel && <span className="text-[10px] text-muted-foreground">{aiModel}</span>}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Sparkles className="w-8 h-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Selecione um produto e clique em "Gerar Conteúdo"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
