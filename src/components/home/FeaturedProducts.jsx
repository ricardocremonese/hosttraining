import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProductCard from '../store/ProductCard';

export default function FeaturedProducts() {
  const { data: products = [] } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => base44.entities.Product.filter({ status: 'published' }, '-created_date', 8),
  });

  return (
    <section className="py-16 px-6 lg:px-12 max-w-[1440px] mx-auto">
      <div className="flex items-end justify-between mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Destaques</h2>
        <Link to="/products" className="text-sm font-medium underline hover:no-underline">
          Ver Todos
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.slice(0, 8).map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
