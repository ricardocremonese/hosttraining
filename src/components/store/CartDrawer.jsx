import React from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCart } from '@/lib/CartContext';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, subtotal } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold tracking-tight">Sacola</h2>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-secondary transition-colors">
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground mb-4" strokeWidth={1} />
                  <p className="text-sm text-muted-foreground">Sua sacola está vazia</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-24 h-24 bg-secondary flex-shrink-0">
                        {item.image && (
                          <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium truncate">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.color && `${item.color} / `}{item.size}
                            </p>
                          </div>
                          <p className="text-sm font-medium">R${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.size, item.color, item.quantity - 1)}
                            className="w-7 h-7 border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product_id, item.size, item.color, item.quantity + 1)}
                            className="w-7 h-7 border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeItem(item.product_id, item.size, item.color)}
                            className="ml-auto"
                          >
                            <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Subtotal</span>
                  <span className="text-sm font-bold">R${subtotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Frete e impostos calculados no checkout
                </p>
                <Link
                  to="/checkout"
                  onClick={() => setIsOpen(false)}
                  className="block w-full bg-foreground text-background text-center py-4 text-sm font-medium hover:bg-foreground/90 transition-colors"
                >
                  Finalizar Compra
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
