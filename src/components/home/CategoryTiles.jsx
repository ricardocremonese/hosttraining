import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const defaultCategories = [
  { id: 'd1', label: "Armas", image_url: "https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=600&q=80", link: "/products?category=armas" },
  { id: 'd2', label: "Suprimentos", image_url: "https://images.unsplash.com/photo-1584281722666-404ef5f3a978?w=600&q=80", link: "/products?category=suprimentos" },
  { id: 'd3', label: "Vestuário", image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80", link: "/products?category=vestuario" },
  { id: 'd4', label: "Promoções", image_url: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80", link: "/products?sale=true" },
];

export default function CategoryTiles() {
  const { data: categories = [] } = useQuery({
    queryKey: ['featured-categories'],
    queryFn: () => base44.entities.FeaturedCategory.filter({ active: true }, 'display_order', 20),
  });

  const items = categories.length > 0 ? categories : defaultCategories;

  return (
    <section className="py-16 px-6 lg:px-12 max-w-[1440px] mx-auto">
      <h2 className="text-2xl font-bold tracking-tight mb-8">Os Essenciais</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((cat) => (
          <Link key={cat.id} to={cat.link} className="group relative overflow-hidden">
            <motion.div
              className="aspect-[3/4] relative"
              whileHover="hovered"
            >
              <img
                src={cat.image_url}
                alt={cat.label}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <motion.div
                className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"
              />
              <div className="absolute bottom-6 left-6">
                <span className="bg-white text-foreground px-5 py-2 text-sm font-medium">
                  {cat.label}
                </span>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
}
