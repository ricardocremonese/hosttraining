import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './NikeLogo';
import AnnouncementBar from './AnnouncementBar';
import { useCart } from '@/lib/CartContext';

const navLinks = [
  { label: 'Cursos', href: '/products?category=cursos' },
  { label: 'Armas', href: '/products?category=armas' },
  { label: 'Suprimentos', href: '/products?category=suprimentos' },
  { label: 'Acessórios', href: '/products?category=acessorios' },
  { label: 'Vestuário', href: '/products?category=vestuario' },
  { label: 'Proteção', href: '/products?category=protecao' },
  { label: 'Cutelaria', href: '/products?category=cutelaria' },
  { label: 'Promoções', href: '/products?sale=true', highlight: true },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { setIsOpen, itemCount } = useCart();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <AnimatePresence>
        {!scrolled && (
          <motion.div
            initial={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AnnouncementBar />
          </motion.div>
        )}
      </AnimatePresence>

      <nav className={`bg-white border-b border-border transition-all duration-300 ${scrolled ? 'py-3' : 'py-4'}`}>
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <Logo className="h-8" variant="dark" />
          </Link>

          {/* Center Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.label}
                to={link.href}
                className={`text-sm font-medium transition-colors relative group ${
                  link.highlight
                    ? 'text-[#F5921B] hover:text-[#d47a0f]'
                    : 'text-foreground hover:text-muted-foreground'
                }`}
              >
                {link.label}
                <span className={`absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300 ${
                  link.highlight ? 'bg-[#F5921B]' : 'bg-foreground'
                }`} />
              </Link>
            ))}
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 hover:bg-secondary transition-colors"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <Link to="/products" className="p-2 hover:bg-secondary transition-colors" aria-label="Favoritos">
              <Heart className="w-5 h-5" strokeWidth={1.5} />
            </Link>
            <button
              onClick={() => setIsOpen(true)}
              className="p-2 hover:bg-secondary transition-colors relative"
              aria-label="Sacola"
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
            <Link to="/admin" className="p-2 hover:bg-secondary transition-colors" aria-label="Conta">
              <User className="w-5 h-5" strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border"
            >
              <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-4">
                <div className="flex items-center gap-3 bg-secondary px-4 py-3">
                  <Search className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                  <input
                    type="text"
                    placeholder="Buscar"
                    className="bg-transparent w-full outline-none text-sm font-medium placeholder:text-muted-foreground"
                    autoFocus
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
