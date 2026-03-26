import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const categoryLabels = { cursos: 'Cursos', armas: 'Armas', suprimentos: 'Suprimentos', acessorios: 'Acessórios', vestuario: 'Vestuário', protecao: 'Proteção', cutelaria: 'Cutelaria' };

export default function ProductCard({ product }) {
  const [hovered, setHovered] = useState(false);

  const displayImage = product.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80';

  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div
        className="relative aspect-square bg-nike-lightgray overflow-hidden mb-3"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <motion.img
          src={displayImage}
          alt={product.name}
          className="w-full h-full object-cover"
          animate={{ scale: hovered ? 1.03 : 1 }}
          transition={{ duration: 0.4 }}
          loading="lazy"
        />
        <button
          className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white transition-colors"
          onClick={(e) => { e.preventDefault(); }}
          aria-label="Adicionar aos favoritos"
        >
          <Heart className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: hovered ? 0 : '100%' }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-0 left-0 right-0 p-3"
        >
          <button
            className="w-full bg-foreground text-background py-2.5 text-xs font-medium hover:bg-foreground/90 transition-colors"
            onClick={(e) => { e.preventDefault(); }}
          >
            Adicionar Rápido
          </button>
        </motion.div>
      </div>
      <div>
        {product.sale_price && (
          <p className="text-xs font-medium text-nike-orange mb-0.5">Oferta</p>
        )}
        <h3 className="text-sm font-medium text-foreground truncate">{product.name}</h3>
        <p className="text-sm text-muted-foreground capitalize">{categoryLabels[product.category] || product.category}</p>
        {product.colors?.length > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">{product.colors.length} {product.colors.length > 1 ? 'Cores' : 'Cor'}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-medium">R${(product.sale_price || product.price)?.toFixed(2)}</span>
          {product.sale_price && (
            <span className="text-sm text-muted-foreground line-through">R${product.price?.toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
