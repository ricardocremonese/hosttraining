import React from 'react';

export default function WhatsAppButton() {
  const phone = '5511995933974';
  const message = encodeURIComponent('Olá! Gostaria de mais informações.');
  const url = `https://wa.me/${phone}?text=${message}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco pelo WhatsApp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-200"
    >
      <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.907 15.907 0 0016.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.31 22.602c-.388 1.094-1.938 2.002-3.168 2.266-.844.178-1.946.32-5.658-1.216-4.748-1.964-7.806-6.78-8.04-7.094-.226-.314-1.9-2.53-1.9-4.826s1.2-3.424 1.628-3.892c.388-.424.85-.532 1.134-.532.284 0 .568.002.816.014.262.014.614-.1.962.732.388.926 1.318 3.222 1.434 3.456.116.234.194.508.038.82-.154.314-.232.508-.46.784-.228.274-.48.614-.686.824-.228.234-.466.488-.2.958.266.468 1.184 1.952 2.542 3.164 1.746 1.558 3.218 2.04 3.674 2.266.456.228.724.192.99-.116.266-.308 1.144-1.334 1.45-1.792.304-.46.61-.38 1.028-.228.42.154 2.662 1.256 3.118 1.484.456.228.762.342.876.532.116.192.116 1.106-.272 2.2z" />
      </svg>
    </a>
  );
}
