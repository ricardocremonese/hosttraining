import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, X, TrendingDown, ArrowRight, Eye, ShoppingCart } from 'lucide-react';

const emptyForm = {
  name: '', trigger_product_id: '', trigger_category: '', trigger_min_price: '',
  offer_product_id: '', offer_title: '', offer_description: '', discount_percent: '', active: true,
};

export default function Downsell() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: downsells = [] } = useQuery({
    queryKey: ['admin-downsells'],
    queryFn: () => base44.entities.Downsell.list('-created_date', 100),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Downsell.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-downsells'] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Downsell.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-downsells'] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Downsell.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-downsells'] }),
  });

  const resetForm = () => { setForm({ ...emptyForm }); setShowForm(false); setEditingId(null); };

  const startEdit = (d) => {
    setForm({
      name: d.name || '', trigger_product_id: d.trigger_product_id || '', trigger_category: d.trigger_category || '',
      trigger_min_price: d.trigger_min_price?.toString() || '', offer_product_id: d.offer_product_id || '',
      offer_title: d.offer_title || '', offer_description: d.offer_description || '',
      discount_percent: d.discount_percent?.toString() || '', active: d.active !== false,
    });
    setEditingId(d.id); setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, trigger_min_price: parseFloat(form.trigger_min_price) || 0, discount_percent: parseFloat(form.discount_percent) || 0 };
    if (editingId) updateMutation.mutate({ id: editingId, data });
    else createMutation.mutate(data);
  };

  const getProduct = (id) => products.find(p => p.id === id);
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const totalDisplays = downsells.reduce((sum, d) => sum + (d.display_count || 0), 0);
  const totalConversions = downsells.reduce((sum, d) => sum + (d.conversion_count || 0), 0);
  const conversionRate = totalDisplays > 0 ? ((totalConversions / totalDisplays) * 100).toFixed(1) : '0';

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-orange-500" /> Downsell
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Ofereça alternativas mais acessíveis para aumentar conversão</p>
        </div>
        <button onClick={() => { if (showForm) resetForm(); else { resetForm(); setShowForm(true); } }}
          className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Nova Regra'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-border p-5">
          <Eye className="w-5 h-5 text-blue-500 mb-3" strokeWidth={1.5} />
          <p className="text-xl font-bold">{totalDisplays}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Ofertas Exibidas</p>
        </div>
        <div className="bg-white border border-border p-5">
          <ShoppingCart className="w-5 h-5 text-green-500 mb-3" strokeWidth={1.5} />
          <p className="text-xl font-bold text-green-700">{totalConversions}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Conversões</p>
        </div>
        <div className="bg-white border border-border p-5">
          <TrendingDown className="w-5 h-5 text-orange-500 mb-3" strokeWidth={1.5} />
          <p className="text-xl font-bold">{conversionRate}%</p>
          <p className="text-[10px] text-muted-foreground mt-1">Taxa de Conversão</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 p-5 mb-8">
        <h3 className="text-sm font-bold text-blue-800 mb-2">Como funciona o Downsell?</h3>
        <p className="text-xs text-blue-700 leading-relaxed">
          Quando o cliente visita um produto caro e não compra, o sistema sugere automaticamente uma alternativa mais acessível com desconto.
          Configure regras por produto específico, categoria ou faixa de preço.
        </p>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-border p-6 mb-8 space-y-4">
          <h2 className="text-sm font-bold">{editingId ? 'Editar Regra' : 'Criar Regra de Downsell'}</h2>

          <div>
            <label className="block text-xs font-medium mb-1.5">Nome da Regra</label>
            <input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: Colete Premium → Colete Básico" className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground" required />
          </div>

          <div className="border border-border p-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gatilho — Quando o cliente visualizar:</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5">Produto Específico</label>
                <select value={form.trigger_product_id} onChange={(e) => setForm(prev => ({ ...prev, trigger_product_id: e.target.value }))} className="w-full border border-border px-3 py-2.5 text-sm outline-none">
                  <option value="">Qualquer</option>
                  {products.filter(p => p.status === 'published').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">Ou Categoria</label>
                <select value={form.trigger_category} onChange={(e) => setForm(prev => ({ ...prev, trigger_category: e.target.value }))} className="w-full border border-border px-3 py-2.5 text-sm outline-none">
                  <option value="">Qualquer</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">Preço Mínimo (R$)</label>
                <input type="number" step="0.01" value={form.trigger_min_price} onChange={(e) => setForm(prev => ({ ...prev, trigger_min_price: e.target.value }))} placeholder="200" className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center py-2">
            <ArrowRight className="w-5 h-5 text-orange-500" />
          </div>

          <div className="border border-orange-200 bg-orange-50 p-4 space-y-3">
            <p className="text-xs font-bold text-orange-800 uppercase tracking-wider">Oferta — Sugerir este produto:</p>
            <div>
              <label className="block text-xs font-medium mb-1.5">Produto da Oferta *</label>
              <select value={form.offer_product_id} onChange={(e) => setForm(prev => ({ ...prev, offer_product_id: e.target.value }))} className="w-full border border-border px-3 py-2.5 text-sm outline-none" required>
                <option value="">Selecionar produto...</option>
                {products.filter(p => p.status === 'published').map(p => <option key={p.id} value={p.id}>{p.name} — R${p.price?.toFixed(2)}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5">Título da Oferta</label>
                <input value={form.offer_title} onChange={(e) => setForm(prev => ({ ...prev, offer_title: e.target.value }))} placeholder="Que tal esta opção?" className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">Descrição</label>
                <input value={form.offer_description} onChange={(e) => setForm(prev => ({ ...prev, offer_description: e.target.value }))} placeholder="Mesma qualidade, preço menor" className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">Desconto Extra (%)</label>
                <input type="number" step="0.1" value={form.discount_percent} onChange={(e) => setForm(prev => ({ ...prev, discount_percent: e.target.value }))} placeholder="10" className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" className="bg-foreground text-background px-6 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors">{editingId ? 'Salvar' : 'Criar Regra'}</button>
            <button type="button" onClick={resetForm} className="px-6 py-2.5 text-sm font-medium border border-border hover:border-foreground transition-colors">Cancelar</button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="space-y-3">
        {downsells.length === 0 ? (
          <div className="bg-white border border-border text-center py-16">
            <TrendingDown className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">Nenhuma regra de downsell criada</p>
          </div>
        ) : downsells.map(d => {
          const triggerProduct = getProduct(d.trigger_product_id);
          const offerProduct = getProduct(d.offer_product_id);
          const rate = d.display_count > 0 ? ((d.conversion_count / d.display_count) * 100).toFixed(1) : '0';
          return (
            <div key={d.id} className={`bg-white border border-border p-4 ${!d.active ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{d.name}</span>
                  {!d.active && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 font-medium rounded">Inativo</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(d)} className="p-2 hover:bg-secondary"><Pencil className="w-3.5 h-3.5" strokeWidth={1.5} /></button>
                  <button onClick={() => updateMutation.mutate({ id: d.id, data: { active: !d.active } })} className={`p-2 text-xs font-medium border ${d.active ? 'border-green-200 text-green-700' : 'border-border text-muted-foreground'}`}>{d.active ? 'Ativo' : 'Off'}</button>
                  <button onClick={() => { if (confirm('Excluir?')) deleteMutation.mutate(d.id); }} className="p-2 hover:bg-secondary text-destructive"><Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} /></button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Trigger */}
                <div className="flex-1 bg-secondary/50 p-3 rounded">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Gatilho</p>
                  {triggerProduct ? (
                    <div className="flex items-center gap-2">
                      {triggerProduct.images?.[0] && <img src={triggerProduct.images[0]} alt="" className="w-8 h-8 object-cover" />}
                      <div>
                        <p className="text-xs font-medium truncate">{triggerProduct.name}</p>
                        <p className="text-[10px] text-muted-foreground">R${triggerProduct.price?.toFixed(2)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {d.trigger_category ? `Categoria: ${d.trigger_category}` : ''}
                      {d.trigger_min_price > 0 ? ` · Acima de R$${d.trigger_min_price.toFixed(2)}` : ''}
                      {!d.trigger_category && !d.trigger_min_price ? 'Qualquer produto' : ''}
                    </p>
                  )}
                </div>

                <ArrowRight className="w-4 h-4 text-orange-500 flex-shrink-0" />

                {/* Offer */}
                <div className="flex-1 bg-orange-50 border border-orange-200 p-3 rounded">
                  <p className="text-[10px] font-bold text-orange-700 uppercase mb-1">Oferta{d.discount_percent > 0 ? ` (${d.discount_percent}% OFF)` : ''}</p>
                  {offerProduct ? (
                    <div className="flex items-center gap-2">
                      {offerProduct.images?.[0] && <img src={offerProduct.images[0]} alt="" className="w-8 h-8 object-cover" />}
                      <div>
                        <p className="text-xs font-medium truncate">{offerProduct.name}</p>
                        <p className="text-[10px] text-muted-foreground">R${offerProduct.price?.toFixed(2)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Produto removido</p>
                  )}
                </div>

                {/* Stats */}
                <div className="text-right flex-shrink-0 w-20">
                  <p className="text-xs font-bold">{d.display_count || 0} / {d.conversion_count || 0}</p>
                  <p className="text-[10px] text-muted-foreground">exibido/convertido</p>
                  <p className="text-xs font-bold text-orange-600">{rate}%</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
