import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CreditCard, Truck, Check, X, Eye, EyeOff, ExternalLink, Zap, Sparkles, Mail } from 'lucide-react';

const providerInfo = {
  mercadopago: {
    name: 'Mercado Pago',
    description: 'Checkout Transparente — cliente paga sem sair do site. Cartão, Pix e boleto.',
    icon: '💚',
    category: 'payment',
    docsUrl: 'https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/overview',
    fields: [
      { key: 'public_key', label: 'Public Key', placeholder: 'APP_USR-...' },
      { key: 'access_token', label: 'Access Token', placeholder: 'APP_USR-...-...', secret: true },
    ],
  },
  stripe: {
    name: 'Stripe',
    description: 'Pagamento integrado no site com Stripe Elements. Cartão de crédito/débito.',
    icon: '💳',
    category: 'payment',
    docsUrl: 'https://stripe.com/docs/payments/payment-intents',
    fields: [
      { key: 'public_key', label: 'Publishable Key', placeholder: 'pk_live_...' },
      { key: 'secret_key', label: 'Secret Key', placeholder: 'sk_live_...', secret: true },
    ],
  },
  correios: {
    name: 'Correios',
    description: 'Cálculo de frete via Correios com contrato ou sem contrato.',
    icon: '📦',
    category: 'shipping',
    docsUrl: 'https://www.correios.com.br/atendimento/developers',
    fields: [
      { key: 'cep_origem', label: 'CEP de Origem', placeholder: '01001-000' },
      { key: 'contrato', label: 'Nº do Contrato (opcional)', placeholder: '' },
      { key: 'senha', label: 'Senha (opcional)', placeholder: '', secret: true },
    ],
  },
  melhorenvio: {
    name: 'Melhor Envio',
    description: 'Cotação e geração de etiquetas com múltiplas transportadoras em um só lugar.',
    icon: '🚚',
    category: 'shipping',
    docsUrl: 'https://docs.melhorenvio.com.br',
    fields: [
      { key: 'token', label: 'Token de Acesso', placeholder: 'eyJ...', secret: true },
      { key: 'cep_origem', label: 'CEP de Origem', placeholder: '01001-000' },
    ],
  },
  onlog: {
    name: 'Onlog Express',
    description: 'Cotação de frete e rastreio com a Onlog Express.',
    icon: '📮',
    category: 'shipping',
    docsUrl: '',
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: '', secret: true },
      { key: 'cnpj', label: 'CNPJ', placeholder: '63443407000103' },
    ],
  },
  resend: {
    name: 'Resend',
    description: 'Envio de e-mails transacionais e marketing com a API do Resend.',
    icon: '✉️',
    category: 'email',
    docsUrl: 'https://resend.com/docs',
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 're_...', secret: true },
      { key: 'from_email', label: 'E-mail Remetente', placeholder: 'noreply@seudominio.com' },
      { key: 'from_name', label: 'Nome Remetente', placeholder: 'HOST Training' },
    ],
  },
  openai: {
    name: 'OpenAI',
    description: 'Gere conteúdos com GPT-4 para e-mails, posts e mensagens.',
    icon: '🤖',
    category: 'ai',
    docsUrl: 'https://platform.openai.com/api-keys',
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'sk-...', secret: true },
      { key: 'model', label: 'Modelo', placeholder: 'gpt-4o-mini' },
    ],
  },
  anthropic: {
    name: 'Anthropic (Claude)',
    description: 'Gere conteúdos com Claude para e-mails, posts e mensagens.',
    icon: '🧠',
    category: 'ai',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'sk-ant-...', secret: true },
      { key: 'model', label: 'Modelo', placeholder: 'claude-sonnet-4-20250514' },
    ],
  },
};

function ProviderCard({ integration, onSave, onToggle }) {
  const info = providerInfo[integration.provider];
  if (!info) return null;

  const [editing, setEditing] = useState(false);
  const [config, setConfig] = useState(integration.config || {});
  const [showSecrets, setShowSecrets] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setConfig(integration.config || {});
  }, [integration]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(integration.id, config);
    setSaving(false);
    setEditing(false);
  };

  const toggleSecret = (key) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const hasConfig = info.fields.some(f => config[f.key]?.trim());

  return (
    <div className={`border transition-all ${integration.enabled ? 'border-green-300 bg-green-50/30' : 'border-border bg-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{info.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold">{info.name}</h3>
              {integration.enabled && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                  <Zap className="w-2.5 h-2.5" /> Ativo
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{info.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {info.docsUrl && (
            <a href={info.docsUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-secondary transition-colors" title="Documentação">
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
            </a>
          )}
          <button
            onClick={() => setEditing(!editing)}
            className="px-3 py-1.5 text-xs font-medium border border-border hover:border-foreground transition-colors"
          >
            {editing ? 'Fechar' : 'Configurar'}
          </button>
          <button
            onClick={() => onToggle(integration.id, !integration.enabled)}
            disabled={!hasConfig && !integration.enabled}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              integration.enabled ? 'bg-green-500' : 'bg-gray-300'
            } ${!hasConfig && !integration.enabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              integration.enabled ? 'left-[22px]' : 'left-0.5'
            }`} />
          </button>
        </div>
      </div>

      {/* Config Form */}
      {editing && (
        <div className="border-t border-border p-5 space-y-3">
          {info.fields.map(field => (
            <div key={field.key}>
              <label className="block text-xs font-medium mb-1">{field.label}</label>
              <div className="relative">
                <input
                  type={field.secret && !showSecrets[field.key] ? 'password' : 'text'}
                  value={config[field.key] || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground transition-colors pr-10 font-mono"
                />
                {field.secret && (
                  <button
                    type="button"
                    onClick={() => toggleSecret(field.key)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showSecrets[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-foreground text-background px-5 py-2 text-xs font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </button>
            <button onClick={() => { setEditing(false); setConfig(integration.config || {}); }} className="px-5 py-2 text-xs font-medium border border-border hover:border-foreground transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Integrations() {
  const queryClient = useQueryClient();

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['admin-integrations'],
    queryFn: () => base44.entities.Integration.list('category', 100),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Integration.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-integrations'] }),
  });

  const handleSave = async (id, config) => {
    await updateMutation.mutateAsync({ id, data: { config } });
  };

  const handleToggle = async (id, enabled) => {
    await updateMutation.mutateAsync({ id, data: { enabled } });
  };

  // Seed defaults if empty
  const seedMutation = useMutation({
    mutationFn: async () => {
      const providers = ['mercadopago', 'stripe', 'correios', 'melhorenvio', 'onlog', 'resend', 'openai', 'anthropic'];
      for (const provider of providers) {
        const info = providerInfo[provider];
        const defaultConfig = {};
        info.fields.forEach(f => { defaultConfig[f.key] = ''; });
        await base44.entities.Integration.create({
          provider,
          category: info.category,
          enabled: false,
          config: defaultConfig,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-integrations'] }),
  });

  useEffect(() => {
    if (!isLoading && integrations.length === 0) {
      seedMutation.mutate();
    }
  }, [isLoading, integrations.length]);

  const paymentIntegrations = integrations.filter(i => providerInfo[i.provider]?.category === 'payment');
  const shippingIntegrations = integrations.filter(i => providerInfo[i.provider]?.category === 'shipping');
  const emailIntegrations = integrations.filter(i => providerInfo[i.provider]?.category === 'email');
  const aiIntegrations = integrations.filter(i => providerInfo[i.provider]?.category === 'ai');

  const sections = [
    { title: 'Pagamento', icon: CreditCard, items: paymentIntegrations },
    { title: 'Frete', icon: Truck, items: shippingIntegrations },
    { title: 'E-mail', icon: Mail, items: emailIntegrations },
    { title: 'Inteligência Artificial', icon: Sparkles, items: aiIntegrations },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Integrações</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure os provedores de pagamento, frete, e-mail e IA da sua loja</p>
      </div>

      {sections.map(section => (
        <div key={section.title} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <section.icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{section.title}</h2>
          </div>
          <div className="space-y-3">
            {section.items.map(integration => (
              <ProviderCard key={integration.id} integration={integration} onSave={handleSave} onToggle={handleToggle} />
            ))}
            {section.items.length === 0 && !isLoading && (
              <p className="text-sm text-muted-foreground py-4 text-center bg-white border border-border">Carregando...</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
