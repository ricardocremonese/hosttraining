import React from 'react';

export default function AnnouncementBar() {
  return (
    <div className="bg-secondary text-foreground text-center py-2 px-4 text-xs font-medium tracking-wide">
      <p>Frete Grátis em Pedidos Acima de R$300 — <span className="underline cursor-pointer">Compre Agora</span></p>
    </div>
  );
}
