import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function ProductList() {
  const queryClient = useQueryClient();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 200),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
        <Link to="/admin/products/new" className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors">
          <Plus className="w-4 h-4" /> Adicionar Produto
        </Link>
      </div>

      <div className="bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-nike-lightgray">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Produto</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Categoria</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Preço</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Estoque</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-secondary w-32" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-secondary w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-secondary w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-secondary w-10" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-secondary w-16" /></td>
                    <td className="px-6 py-4" />
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-sm text-muted-foreground py-12">
                    Nenhum produto ainda. <Link to="/admin/products/new" className="underline">Criar um</Link>
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product.id} className="border-b border-border last:border-0 hover:bg-nike-lightgray transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary flex-shrink-0 overflow-hidden">
                          {product.images?.[0] && <img src={product.images[0]} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className="text-sm font-medium truncate max-w-[200px]">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-xs capitalize text-muted-foreground">{product.category}</td>
                    <td className="px-6 py-3 text-xs font-medium">
                      R${product.price?.toFixed(2)}
                      {product.sale_price && <span className="text-nike-orange ml-1">(R${product.sale_price?.toFixed(2)})</span>}
                    </td>
                    <td className="px-6 py-3 text-xs">{product.stock || 0}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 font-medium ${product.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {product.status === 'published' ? 'Publicado' : 'Rascunho'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/admin/products/${product.id}/edit`} className="p-2 hover:bg-secondary transition-colors">
                          <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </Link>
                        <button
                          onClick={() => { if (confirm('Excluir este produto?')) deleteMutation.mutate(product.id); }}
                          className="p-2 hover:bg-secondary transition-colors text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
