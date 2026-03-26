import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './NikeLogo';

const footerLinks = {
  'Ajuda': ['Acompanhar Pedido', 'Entregas', 'Devoluções', 'Formas de Pagamento', 'Fale Conosco'],
  'Institucional': ['Sobre Nós', 'Política de Privacidade', 'Termos de Uso'],
  'Comunidade': ['Instagram', 'WhatsApp'],
};

const linkHrefs = {
  'Acompanhar Pedido': '/rastreio',
  'Instagram': 'https://www.hosttraining.com.br',
  'WhatsApp': 'https://wa.me/5511995933974',
};

export default function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <Logo className="h-8 mb-4" variant="white" />
            <div className="space-y-2 text-xs text-neutral-400">
              <p>CNPJ: 63.443.407/0001-03</p>
              <p>
                <a href="mailto:hosttraining89@gmail.com" className="hover:text-white transition-colors">
                  hosttraining89@gmail.com
                </a>
              </p>
              <p>
                <a href="https://wa.me/5511995933974" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  WhatsApp: (11) 99593-3974
                </a>
              </p>
              <p>
                <a href="https://www.hosttraining.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  @hosttraining
                </a>
              </p>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-6">{title}</h4>
              <ul className="space-y-3">
                {links.map(link => {
                  const href = linkHrefs[link];
                  const isExternal = href && href.startsWith('http');
                  if (href && isExternal) {
                    return (
                      <li key={link}>
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs text-neutral-400 hover:text-white transition-colors">
                          {link}
                        </a>
                      </li>
                    );
                  }
                  return (
                    <li key={link}>
                      <Link to={href || '#'} className="text-xs text-neutral-400 hover:text-white transition-colors">
                        {link}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-neutral-700">
          <p className="text-[11px] text-neutral-500 mb-2 md:mb-0">
            © 2026 HOST Training. CNPJ 63.443.407/0001-03. Todos os direitos reservados.
          </p>
          <p className="text-[11px] text-neutral-500">
            hosttraining89@gmail.com | (11) 99593-3974
          </p>
        </div>
      </div>
    </footer>
  );
}
