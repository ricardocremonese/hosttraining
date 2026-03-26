import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Upload, X, Pencil, ChevronUp, ChevronDown, Image as ImageIcon } from 'lucide-react';

const emptyForm = {
  tag: '',
  title: '',
  description: '',
  button_text: 'Comprar',
  button_link: '/products',
  image_url: '',
  reverse_layout: false,
  display_order: 0,
  active: true,
};

export default function EditorialManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: editorials = [] } = useQuery({
    queryKey: ['admin-editorials'],
    queryFn: () => base44.entities.Editorial.list('display_order', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Editorial.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-editorials'] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Editorial.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-editorials'] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Editorial.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-editorials'] }),
  });

  const resetForm = () => {
    setForm({ ...emptyForm, display_order: editorials.length });
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (item) => {
    setForm({
      tag: item.tag || '',
      title: item.title || '',
      description: item.description || '',
      button_text: item.button_text || 'Comprar',
      button_link: item.button_link || '/products',
      image_url: item.image_url || '',
      reverse_layout: item.reverse_layout || false,
      display_order: item.display_order || 0,
      active: item.active !== false,
    });
    setEditingId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, image_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate({ ...form, display_order: editorials.length });
    }
  };

  const moveOrder = async (item, direction) => {
    const currentIdx = editorials.findIndex(e => e.id === item.id);
    const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= editorials.length) return;
    const target = editorials[targetIdx];
    await base44.entities.Editorial.update(item.id, { display_order: target.display_order });
    await base44.entities.Editorial.update(target.id, { display_order: item.display_order });
    queryClient.invalidateQueries({ queryKey: ['admin-editorials'] });
  };

  const toggleActive = (item) => {
    updateMutation.mutate({ id: item.id, data: { active: !item.active } });
  };

  const isEditing = !!editingId;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Destaques</h1>
          <p className="text-sm text-muted-foreground mt-1">Seções com imagem + texto exibidas na página inicial</p>
        </div>
        <button
          onClick={() => { if (showForm) resetForm(); else { setEditingId(null); setForm({ ...emptyForm, display_order: editorials.length }); setShowForm(true); } }}
          className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Novo Destaque'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-border p-6 mb-8 space-y-4">
          <h2 className="text-sm font-bold mb-2">{isEditing ? 'Editar Destaque' : 'Adicionar Destaque'}</h2>

          {/* Image */}
          <div>
            <label className="block text-xs font-medium mb-1.5">Imagem</label>
            {form.image_url ? (
              <div className="relative w-full max-w-sm aspect-[4/5] bg-secondary overflow-hidden rounded">
                <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                  className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full max-w-sm aspect-[4/5] border-2 border-dashed border-border rounded cursor-pointer hover:border-foreground transition-colors">
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-foreground border-t-transparent animate-spin rounded-full" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground mb-2" strokeWidth={1.5} />
                    <span className="text-xs text-muted-foreground">Clique para enviar imagem</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
            <div className="flex gap-2 mt-2">
              <input
                value={form.image_url}
                onChange={(e) => setForm(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="Ou cole uma URL de imagem..."
                className="flex-1 border border-border px-3 py-2 text-xs outline-none focus:border-foreground"
              />
            </div>
          </div>

          {/* Texts */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Tag (texto pequeno acima do título)</label>
              <input
                value={form.tag}
                onChange={(e) => setForm(prev => ({ ...prev, tag: e.target.value }))}
                placeholder="Ex: CORRIDA, TREINO, NOVA COLEÇÃO"
                className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Título</label>
              <input
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Encontre Sua Velocidade"
                className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Texto descritivo que aparece abaixo do título"
              rows={3}
              className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Texto do Botão</label>
              <input
                value={form.button_text}
                onChange={(e) => setForm(prev => ({ ...prev, button_text: e.target.value }))}
                className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Link do Botão</label>
              <input
                value={form.button_link}
                onChange={(e) => setForm(prev => ({ ...prev, button_link: e.target.value }))}
                placeholder="/products?category=running"
                className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Layout</label>
              <select
                value={form.reverse_layout ? 'reverse' : 'normal'}
                onChange={(e) => setForm(prev => ({ ...prev, reverse_layout: e.target.value === 'reverse' }))}
                className="w-full border border-border px-3 py-2.5 text-sm outline-none"
              >
                <option value="normal">Imagem à Esquerda</option>
                <option value="reverse">Imagem à Direita</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!form.image_url || !form.title || isSaving}
              className="bg-foreground text-background px-6 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Adicionar Destaque'}
            </button>
            <button type="button" onClick={resetForm} className="px-6 py-2.5 text-sm font-medium border border-border hover:border-foreground transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="space-y-3">
        {editorials.length === 0 ? (
          <div className="bg-white border border-border text-center py-16">
            <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">Nenhum destaque cadastrado</p>
            <p className="text-xs text-muted-foreground mt-1">Adicione seções de destaque para a página inicial</p>
          </div>
        ) : (
          editorials.map((item, idx) => (
            <div key={item.id} className={`bg-white border transition-colors ${editingId === item.id ? 'border-foreground' : 'border-border'} flex items-center gap-4 p-4 ${!item.active ? 'opacity-50' : ''}`}>
              {/* Thumbnail */}
              <div className="w-24 h-28 bg-secondary flex-shrink-0 overflow-hidden rounded">
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" strokeWidth={1} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {item.tag && (
                    <span className="text-[10px] px-1.5 py-0.5 font-bold tracking-wider bg-secondary text-muted-foreground rounded uppercase">{item.tag}</span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 font-medium rounded bg-purple-50 text-purple-700">
                    {item.reverse_layout ? 'Imagem à Direita' : 'Imagem à Esquerda'}
                  </span>
                  {!item.active && (
                    <span className="text-[10px] px-1.5 py-0.5 font-medium bg-gray-100 text-gray-500 rounded">Inativo</span>
                  )}
                </div>
                <p className="text-sm font-bold truncate">{item.title || '(Sem título)'}</p>
                {item.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>}
                {item.button_text && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Botão: "{item.button_text}" → {item.button_link}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => startEdit(item)} className="p-2 hover:bg-secondary transition-colors" title="Editar">
                  <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                <button onClick={() => moveOrder(item, 'up')} disabled={idx === 0} className="p-2 hover:bg-secondary transition-colors disabled:opacity-30" title="Mover para cima">
                  <ChevronUp className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button onClick={() => moveOrder(item, 'down')} disabled={idx === editorials.length - 1} className="p-2 hover:bg-secondary transition-colors disabled:opacity-30" title="Mover para baixo">
                  <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => toggleActive(item)}
                  className={`p-2 text-xs font-medium border transition-colors ${item.active ? 'border-green-200 text-green-700 hover:bg-green-50' : 'border-border text-muted-foreground hover:bg-secondary'}`}
                >
                  {item.active ? 'Ativo' : 'Inativo'}
                </button>
                <button onClick={() => { if (confirm('Excluir este destaque?')) deleteMutation.mutate(item.id); }} className="p-2 hover:bg-secondary transition-colors text-destructive" title="Excluir">
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
