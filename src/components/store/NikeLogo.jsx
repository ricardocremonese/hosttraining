import React from 'react';

export default function Logo({ className = "h-8", variant = "dark" }) {
  const src = variant === "white" ? "/logo-white.png" : "/logo-dark.png";
  return (
    <img src={src} alt="HOST Training" className={className} />
  );
}
