import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Upload, X, Pencil, ChevronUp, ChevronDown, LayoutGrid } from 'lucide-react';

const emptyForm = {
  label: '',
  image_url: '',
  link: '/products',
  display_order: 0,
  active: true,
};

const categoryPresets = [
  { label: 'Cursos', link: '/products?category=cursos' },
  { label: 'Armas', link: '/products?category=armas' },
  { label: 'Suprimentos', link: '/products?category=suprimentos' },
  { label: 'Acessórios', link: '/products?category=acessorios' },
  { label: 'Vestuário', link: '/products?category=vestuario' },
  { label: 'Proteção', link: '/products?category=protecao' },
  { label: 'Cutelaria', link: '/products?category=cutelaria' },
  { label: 'Promoções', link: '/products?sale=true' },
];

export default function FeaturedCategoryManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: items = [] } = useQuery({
    queryKey: ['admin-featured-categories'],
    queryFn: () => base44.entities.FeaturedCategory.list('display_order', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FeaturedCategory.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-featured-categories'] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FeaturedCategory.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-featured-categories'] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FeaturedCategory.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-featured-categories'] }),
  });

  const resetForm = () => {
    setForm({ ...emptyForm, display_order: items.length });
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (item) => {
    setForm({
      label: item.label || '',
      image_url: item.image_url || '',
      link: item.link || '/products',
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
      createMutation.mutate({ ...form, display_order: items.length });
    }
  };

  const applyPreset = (preset) => {
    setForm(prev => ({ ...prev, label: preset.label, link: preset.link }));
  };

  const moveOrder = async (item, direction) => {
    const currentIdx = items.findIndex(i => i.id === item.id);
    const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const target = items[targetIdx];
    await base44.entities.FeaturedCategory.update(item.id, { display_order: target.display_order });
    await base44.entities.FeaturedCategory.update(target.id, { display_order: item.display_order });
    queryClient.invalidateQueries({ queryKey: ['admin-featured-categories'] });
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
          <h1 className="text-2xl font-bold tracking-tight">Os Essenciais</h1>
          <p className="text-sm text-muted-foreground mt-1">Tiles de categorias exibidos na página inicial</p>
        </div>
        <button
          onClick={() => { if (showForm) resetForm(); else { setEditingId(null); setForm({ ...emptyForm, display_order: items.length }); setShowForm(true); } }}
          className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Novo Tile'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-border p-6 mb-8 space-y-4">
          <h2 className="text-sm font-bold mb-2">{isEditing ? 'Editar Tile' : 'Adicionar Tile'}</h2>

          {/* Presets */}
          <div>
            <label className="block text-xs font-medium mb-2">Atalho — selecionar categoria:</label>
            <div className="flex flex-wrap gap-2">
              {categoryPresets.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                    form.label === p.label ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Nome exibido</label>
              <input
                value={form.label}
                onChange={(e) => setForm(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Ex: Armas, Vestuário..."
                className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Link</label>
              <input
                value={form.link}
                onChange={(e) => setForm(prev => ({ ...prev, link: e.target.value }))}
                placeholder="/products?category=armas"
                className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground"
              />
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="block text-xs font-medium mb-1.5">Imagem de Capa</label>
            {form.image_url ? (
              <div className="relative w-48 aspect-[3/4] bg-secondary overflow-hidden rounded">
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
              <label className="flex flex-col items-center justify-center w-48 aspect-[3/4] border-2 border-dashed border-border rounded cursor-pointer hover:border-foreground transition-colors">
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-foreground border-t-transparent animate-spin rounded-full" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground mb-2" strokeWidth={1.5} />
                    <span className="text-xs text-muted-foreground">Enviar imagem</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
            <input
              value={form.image_url}
              onChange={(e) => setForm(prev => ({ ...prev, image_url: e.target.value }))}
              placeholder="Ou cole uma URL de imagem..."
              className="w-full max-w-md border border-border px-3 py-2 text-xs outline-none focus:border-foreground mt-2"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!form.label || !form.image_url || isSaving}
              className="bg-foreground text-background px-6 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Adicionar Tile'}
            </button>
            <button type="button" onClick={resetForm} className="px-6 py-2.5 text-sm font-medium border border-border hover:border-foreground transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.length === 0 ? (
          <div className="col-span-full bg-white border border-border text-center py-16">
            <LayoutGrid className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">Nenhum tile cadastrado</p>
            <p className="text-xs text-muted-foreground mt-1">Adicione categorias para exibir na seção "Os Essenciais"</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div key={item.id} className={`bg-white border transition-colors ${editingId === item.id ? 'border-foreground' : 'border-border'} overflow-hidden ${!item.active ? 'opacity-50' : ''}`}>
              {/* Preview */}
              <div className="aspect-[3/4] bg-secondary relative overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.label} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <LayoutGrid className="w-8 h-8 text-muted-foreground" strokeWidth={1} />
                  </div>
                )}
                <div className="absolute bottom-3 left-3">
                  <span className="bg-white text-foreground px-3 py-1 text-xs font-medium">{item.label}</span>
                </div>
                {!item.active && (
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] px-1.5 py-0.5 font-medium bg-gray-100 text-gray-500 rounded">Inativo</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between p-2 border-t border-border">
                <p className="text-xs text-muted-foreground truncate pl-1">{item.link}</p>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => startEdit(item)} className="p-1.5 hover:bg-secondary transition-colors" title="Editar">
                    <Pencil className="w-3 h-3" strokeWidth={1.5} />
                  </button>
                  <button onClick={() => moveOrder(item, 'up')} disabled={idx === 0} className="p-1.5 hover:bg-secondary transition-colors disabled:opacity-30" title="Mover">
                    <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                  <button onClick={() => moveOrder(item, 'down')} disabled={idx === items.length - 1} className="p-1.5 hover:bg-secondary transition-colors disabled:opacity-30" title="Mover">
                    <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => toggleActive(item)}
                    className={`p-1.5 text-[10px] font-medium border transition-colors ${item.active ? 'border-green-200 text-green-700' : 'border-border text-muted-foreground'}`}
                  >
                    {item.active ? 'On' : 'Off'}
                  </button>
                  <button onClick={() => { if (confirm('Excluir?')) deleteMutation.mutate(item.id); }} className="p-1.5 hover:bg-secondary transition-colors text-destructive" title="Excluir">
                    <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
