import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const filterSections = [
  { key: 'category', label: 'Categoria', options: ['cursos', 'armas', 'suprimentos', 'acessorios', 'vestuario', 'protecao', 'cutelaria'], displayLabels: { 'cursos': 'Cursos', 'armas': 'Armas', 'suprimentos': 'Suprimentos', 'acessorios': 'Acessórios', 'vestuario': 'Vestuário', 'protecao': 'Proteção', 'cutelaria': 'Cutelaria' } },
  { key: 'price', label: 'Preço', options: ['Under $50', '$50 - $100', '$100 - $150', 'Over $150'], displayLabels: { 'Under $50': 'Até R$100', '$50 - $100': 'R$100 - R$200', '$100 - $150': 'R$200 - R$300', 'Over $150': 'Acima de R$300' } },
  { key: 'size', label: 'Tamanho', options: ['PP', 'P', 'M', 'G', 'GG', 'XGG'] },
];

export default function ProductFilters({ filters, onFilterChange }) {
  const [openSections, setOpenSections] = React.useState({ gender: true, category: true, price: false, size: false });

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleFilter = (key, value) => {
    const current = filters[key] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, [key]: updated });
  };

  return (
    <aside className="w-full">
      {filterSections.map(section => (
        <div key={section.key} className="border-b border-border py-4">
          <button
            onClick={() => toggleSection(section.key)}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="text-sm font-medium">{section.label}</span>
            {openSections[section.key] ? (
              <ChevronUp className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>
          {openSections[section.key] && (
            <div className="mt-3 space-y-2">
              {section.options.map(opt => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={(filters[section.key] || []).includes(opt.toLowerCase())}
                    onChange={() => toggleFilter(section.key, opt.toLowerCase())}
                    className="w-4 h-4 border-2 border-border accent-foreground"
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {section.displayLabels?.[opt] || opt}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </aside>
  );
}
