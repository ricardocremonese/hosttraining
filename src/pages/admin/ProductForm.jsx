import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Plus } from 'lucide-react';

const categories = ['cursos', 'armas', 'suprimentos', 'acessorios', 'vestuario', 'protecao', 'cutelaria'];
const allSizes = ['PP', 'P', 'M', 'G', 'GG', 'XGG', 'Único'];

export default function ProductForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const pathParts = window.location.pathname.split('/');
  const isEdit = pathParts.includes('edit');
  const productId = isEdit ? pathParts[pathParts.length - 2] : null;

  const [form, setForm] = useState({
    name: '', slug: '', description: '', category: 'armas',
    cost_price: '', price: '', sale_price: '', stock: '', status: 'draft', featured: false,
    colors: [{ name: 'Preto', hex: '#111111' }],
    sizes: [],
    images: [],
    sport: '',
  });
  const [uploading, setUploading] = useState(false);

  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const products = await base44.entities.Product.filter({ id: productId });
      return products[0];
    },
    enabled: isEdit && !!productId,
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        category: product.category || 'armas',
        cost_price: product.cost_price?.toString() || '',
        price: product.price?.toString() || '',
        sale_price: product.sale_price?.toString() || '',
        stock: product.stock?.toString() || '',
        status: product.status || 'draft',
        featured: product.featured || false,
        colors: product.colors?.length > 0 ? product.colors : [{ name: 'Preto', hex: '#111111' }],
        sizes: product.sizes || [],
        images: product.images || [],
        sport: product.sport || '',
      });
    }
  }, [product]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (isEdit) return base44.entities.Product.update(productId, data);
      return base44.entities.Product.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      navigate('/admin/products');
    },
  });

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, images: [...prev.images, file_url] }));
    setUploading(false);
  };

  const removeImage = (idx) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const toggleSize = (size) => {
    setForm(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size) ? prev.sizes.filter(s => s !== size) : [...prev.sizes, size],
    }));
  };

  const addColor = () => {
    setForm(prev => ({ ...prev, colors: [...prev.colors, { name: '', hex: '#000000' }] }));
  };

  const updateColor = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      colors: prev.colors.map((c, i) => i === idx ? { ...c, [field]: value } : c),
    }));
  };

  const removeColor = (idx) => {
    setForm(prev => ({ ...prev, colors: prev.colors.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      ...form,
      cost_price: parseFloat(form.cost_price) || 0,
      price: parseFloat(form.price) || 0,
      sale_price: form.sale_price ? parseFloat(form.sale_price) : undefined,
      stock: parseInt(form.stock) || 0,
    });
  };

  const categoryLabels = { cursos: 'Cursos', armas: 'Armas', suprimentos: 'Suprimentos', acessorios: 'Acessórios', vestuario: 'Vestuário', protecao: 'Proteção', cutelaria: 'Cutelaria' };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-8">{isEdit ? 'Editar Produto' : 'Novo Produto'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Basic Info */}
        <div className="bg-white border border-border p-6 space-y-4">
          <h2 className="text-sm font-bold mb-2">Informações Básicas</h2>
          <div>
            <label className="block text-xs font-medium mb-1.5">Nome do Produto</label>
            <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground transition-colors" required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Descrição</label>
            <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={4} className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Categoria</label>
            <select value={form.category} onChange={(e) => handleChange('category', e.target.value)} className="w-full border border-border px-3 py-2.5 text-sm outline-none">
              {categories.map(c => <option key={c} value={c}>{categoryLabels[c] || c}</option>)}
            </select>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white border border-border p-6 space-y-4">
          <h2 className="text-sm font-bold mb-2">Preço e Estoque</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Preço de Custo (R$)</label>
              <input type="number" step="0.01" value={form.cost_price} onChange={(e) => handleChange('cost_price', e.target.value)} placeholder="0.00" className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Preço de Venda (R$)</label>
              <input type="number" step="0.01" value={form.price} onChange={(e) => handleChange('price', e.target.value)} className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Preço Promocional (R$)</label>
              <input type="number" step="0.01" value={form.sale_price} onChange={(e) => handleChange('sale_price', e.target.value)} className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Estoque</label>
              <input type="number" value={form.stock} onChange={(e) => handleChange('stock', e.target.value)} className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground" />
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="bg-white border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold">Cores</h2>
            <button type="button" onClick={addColor} className="text-xs font-medium flex items-center gap-1 hover:text-muted-foreground">
              <Plus className="w-3 h-3" /> Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {form.colors.map((color, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input type="color" value={color.hex} onChange={(e) => updateColor(idx, 'hex', e.target.value)} className="w-8 h-8 border border-border cursor-pointer" />
                <input value={color.name} onChange={(e) => updateColor(idx, 'name', e.target.value)} placeholder="Nome da cor" className="flex-1 border border-border px-3 py-2 text-sm outline-none focus:border-foreground" />
                {form.colors.length > 1 && (
                  <button type="button" onClick={() => removeColor(idx)}>
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sizes */}
        <div className="bg-white border border-border p-6">
          <h2 className="text-sm font-bold mb-4">Tamanhos</h2>
          <div className="flex flex-wrap gap-2">
            {allSizes.map(size => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={`px-4 py-2 text-xs font-medium border transition-colors ${
                  form.sizes.includes(size)
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border hover:border-foreground'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="bg-white border border-border p-6">
          <h2 className="text-sm font-bold mb-4">Imagens</h2>
          <div className="grid grid-cols-5 gap-3">
            {form.images.map((img, idx) => (
              <div key={idx} className="relative aspect-square bg-secondary overflow-hidden group">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 w-5 h-5 bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {form.images.length < 5 && (
              <label className="aspect-square border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-foreground transition-colors">
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-foreground border-t-transparent animate-spin" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-muted-foreground mb-1" strokeWidth={1.5} />
                    <span className="text-[10px] text-muted-foreground">Enviar</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="bg-white border border-border p-6">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="status" value="draft" checked={form.status === 'draft'} onChange={() => handleChange('status', 'draft')} className="accent-foreground" />
              <span className="text-sm">Rascunho</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="status" value="published" checked={form.status === 'published'} onChange={() => handleChange('status', 'published')} className="accent-foreground" />
              <span className="text-sm">Publicado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer ml-auto">
              <input type="checkbox" checked={form.featured} onChange={(e) => handleChange('featured', e.target.checked)} className="accent-foreground" />
              <span className="text-sm">Destaque</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saveMutation.isPending} className="bg-foreground text-background px-8 py-3 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50">
            {saveMutation.isPending ? 'Salvando...' : isEdit ? 'Atualizar Produto' : 'Criar Produto'}
          </button>
          <button type="button" onClick={() => navigate('/admin/products')} className="px-8 py-3 text-sm font-medium border border-border hover:border-foreground transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
