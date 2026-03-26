import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const defaultEditorials = [
  {
    id: 'default-1',
    tag: 'CORRIDA',
    title: 'Encontre Sua Velocidade',
    description: 'Leve, rápido e feito para longas distâncias. Explore nossa última inovação em corrida.',
    image_url: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=900&q=80',
    button_text: 'Comprar',
    button_link: '/products?category=running',
    reverse_layout: false,
  },
  {
    id: 'default-2',
    tag: 'TREINO',
    title: 'Feito Para Tudo',
    description: 'Da academia para a rua. Roupas versáteis de treino projetadas para se mover com você.',
    image_url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=900&q=80',
    button_text: 'Comprar',
    button_link: '/products?category=training',
    reverse_layout: true,
  },
];

export default function EditorialSection() {
  const { data: editorials = [] } = useQuery({
    queryKey: ['editorials'],
    queryFn: () => base44.entities.Editorial.filter({ active: true }, 'display_order', 20),
  });

  const items = editorials.length > 0 ? editorials : defaultEditorials;

  return (
    <section>
      {items.map((item, idx) => (
        <div
          key={item.id}
          className={`flex flex-col ${item.reverse_layout ? 'md:flex-row-reverse' : 'md:flex-row'} ${idx % 2 === 0 ? 'bg-white' : 'bg-nike-lightgray'}`}
        >
          <div className="w-full md:w-1/2">
            <motion.img
              src={item.image_url}
              alt={item.title}
              className="w-full h-[400px] md:h-[600px] object-cover"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              loading="lazy"
            />
          </div>
          <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-md"
            >
              {item.tag && (
                <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground mb-3">{item.tag}</p>
              )}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-none mb-4">
                {item.title}
              </h2>
              {item.description && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">{item.description}</p>
              )}
              {item.button_text && (
                <Link
                  to={item.button_link || '/products'}
                  className="inline-block bg-foreground text-background px-8 py-4 text-sm font-medium hover:bg-muted-foreground transition-colors"
                >
                  {item.button_text}
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      ))}
    </section>
  );
}
