import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '../components/store/ProductCard';
import ProductFilters from '../components/store/ProductFilters';

export default function Products() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [filters, setFilters] = useState(() => {
    const initial = {};
    if (params.get('category')) initial.category = [params.get('category')];
    return initial;
  });

  // Reagir a mudanças na URL (clique no menu)
  useEffect(() => {
    const newParams = new URLSearchParams(location.search);
    const newFilters = {};
    if (newParams.get('category')) newFilters.category = [newParams.get('category')];
    setFilters(newFilters);
  }, [location.search]);
  const [sort, setSort] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ status: 'published' }, '-created_date', 100),
  });

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (filters.category?.length > 0) {
      result = result.filter(p => filters.category.includes(p.category));
    }
    if (new URLSearchParams(location.search).get('sale') === 'true') {
      result = result.filter(p => p.sale_price && p.sale_price < p.price);
    }

    if (sort === 'price-asc') result.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
    if (sort === 'price-desc') result.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
    if (sort === 'newest') result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    return result;
  }, [products, filters, sort]);

  const activeFilterCount = Object.values(filters).reduce((acc, arr) => acc + (arr?.length || 0), 0);
  const categoryLabels = { cursos: 'Cursos', armas: 'Armas', suprimentos: 'Suprimentos', acessorios: 'Acessórios', vestuario: 'Vestuário', protecao: 'Proteção', cutelaria: 'Cutelaria' };
  const activeCategory = params.get('category');
  const isSale = new URLSearchParams(location.search).get('sale') === 'true';
  const pageTitle = isSale ? 'Promoções' : activeCategory ? (categoryLabels[activeCategory] || activeCategory) : 'Todos os Produtos';

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-8">
      {/* Breadcrumb */}
      <div className="text-xs text-muted-foreground mb-6">
        <span>Início</span> <span className="mx-1">/</span> <span className="text-foreground font-medium">{pageTitle}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          {pageTitle}
          <span className="text-sm font-normal text-muted-foreground ml-2">({filteredProducts.length})</span>
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium hover:text-muted-foreground transition-colors md:hidden"
          >
            <SlidersHorizontal className="w-4 h-4" strokeWidth={1.5} />
            Filtros {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-sm font-medium bg-transparent border-none outline-none cursor-pointer"
          >
            <option value="featured">Ordenar: Destaques</option>
            <option value="price-asc">Preço: Menor-Maior</option>
            <option value="price-desc">Preço: Maior-Menor</option>
            <option value="newest">Mais Recentes</option>
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className={`${showFilters ? 'fixed inset-0 z-40 bg-white p-6 overflow-y-auto' : 'hidden'} md:block md:relative md:w-56 md:flex-shrink-0`}>
          <div className="flex items-center justify-between mb-4 md:hidden">
            <h2 className="text-lg font-bold">Filtros</h2>
            <button onClick={() => setShowFilters(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <ProductFilters filters={filters} onFilterChange={setFilters} />
        </div>

        {/* Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-secondary mb-3" />
                  <div className="h-4 bg-secondary w-3/4 mb-2" />
                  <div className="h-3 bg-secondary w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
