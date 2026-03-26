import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/CartContext';
import ProductCard from '../components/store/ProductCard';

const defaultSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function ProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.split('/');
  const productId = pathParts[pathParts.length - 1];

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [openAccordion, setOpenAccordion] = useState(null);
  const { addItem } = useCart();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const products = await base44.entities.Product.filter({ id: productId });
      return products[0];
    },
    enabled: !!productId,
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['related-products', product?.category],
    queryFn: () => base44.entities.Product.filter({ category: product.category, status: 'published' }, '-created_date', 6),
    enabled: !!product?.category,
  });

  if (isLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="animate-pulse aspect-square bg-secondary" />
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-secondary w-3/4" />
            <div className="h-4 bg-secondary w-1/2" />
            <div className="h-8 bg-secondary w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Produto não encontrado</p>
      </div>
    );
  }

  const images = product.images?.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'];

  const sizes = product.sizes?.length > 0 ? product.sizes : defaultSizes;
  const colors = product.colors?.length > 0 ? product.colors : [{ name: 'Padrão', hex: '#111111' }];

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addItem(product, selectedSize, selectedColor || colors[0]?.name);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-8">
      {/* Breadcrumb */}
      <div className="text-xs text-muted-foreground mb-6">
        <span>Início</span> <span className="mx-1">/</span>
        <span>Produtos</span> <span className="mx-1">/</span>
        <span className="text-foreground font-medium">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
        {/* Images */}
        <div>
          <div className="aspect-square bg-nike-lightgray overflow-hidden mb-3">
            <motion.img
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {images.slice(0, 5).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`aspect-square bg-nike-lightgray overflow-hidden border-2 transition-colors ${selectedImage === idx ? 'border-foreground' : 'border-transparent'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-1">{product.name}</h1>
          <p className="text-base text-muted-foreground capitalize mb-4">
            {product.category}
          </p>
          <div className="flex items-center gap-3 mb-8">
            <span className="text-xl font-bold">R${(product.sale_price || product.price)?.toFixed(2)}</span>
            {product.sale_price && (
              <span className="text-base text-muted-foreground line-through">R${product.price?.toFixed(2)}</span>
            )}
          </div>

          {/* Color Selector */}
          <div className="mb-6">
            <p className="text-sm font-medium mb-3">
              Cor: {selectedColor || colors[0]?.name}
            </p>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.name)}
                  className={`w-8 h-8 border-2 transition-colors ${
                    (selectedColor || colors[0]?.name) === color.name ? 'border-foreground' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Selecione o Tamanho</p>
              <button className="text-xs text-muted-foreground underline">Guia de Tamanhos</button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-3 text-sm font-medium border transition-colors ${
                    selectedSize === size
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border hover:border-foreground'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {!selectedSize && (
              <p className="text-xs text-destructive mt-2">Por favor, selecione um tamanho</p>
            )}
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={!selectedSize}
            className="w-full bg-foreground text-background py-4 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
          >
            Adicionar à Sacola
          </button>
          <button className="w-full border border-border py-4 text-sm font-medium flex items-center justify-center gap-2 hover:border-foreground transition-colors">
            Favoritar <Heart className="w-4 h-4" strokeWidth={1.5} />
          </button>

          {/* Description Accordions */}
          <div className="mt-8 border-t border-border">
            {[
              { key: 'description', title: 'Descrição', content: product.description || 'Sem descrição disponível.' },
              { key: 'details', title: 'Detalhes do Produto', content: `Categoria: ${product.category}\nGênero: ${product.gender}\nEsporte: ${product.sport || 'Multi-esporte'}` },
              { key: 'shipping', title: 'Entrega e Devoluções Grátis', content: 'Frete grátis padrão em todos os pedidos acima de R$300. Devoluções gratuitas em até 60 dias após a compra.' },
            ].map(section => (
              <div key={section.key} className="border-b border-border">
                <button
                  onClick={() => setOpenAccordion(openAccordion === section.key ? null : section.key)}
                  className="flex items-center justify-between w-full py-5 text-left"
                >
                  <span className="text-sm font-medium">{section.title}</span>
                  {openAccordion === section.key ? (
                    <Minus className="w-4 h-4" strokeWidth={1.5} />
                  ) : (
                    <Plus className="w-4 h-4" strokeWidth={1.5} />
                  )}
                </button>
                <AnimatePresence>
                  {openAccordion === section.key && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm text-muted-foreground pb-5 whitespace-pre-line leading-relaxed">
                        {section.content}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.filter(p => p.id !== product.id).length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold tracking-tight mb-6">Você Também Pode Gostar</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 snap-x">
            {relatedProducts.filter(p => p.id !== product.id).slice(0, 6).map(p => (
              <div key={p.id} className="w-64 flex-shrink-0 snap-start">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
