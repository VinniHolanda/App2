import React, { createContext, useContext, useState, useEffect } from 'react';

export interface StudioBrand {
  studioName: string;
  shortInitials: string;
  tagline: string;
  trainerName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  bgTheme: 'obsidian' | 'midnight' | 'slate' | 'cyber';
  welcomeMessageStudent: string;
  instagramHandle?: string;
  whatsappNumber?: string;
  websiteUrl?: string;
  hidePoweredBy?: boolean;
}

export const DEFAULT_BRAND: StudioBrand = {
  studioName: 'Kinetix Studio',
  shortInitials: 'KS',
  tagline: 'Inteligência em Prescrição & Consultoria Esportiva',
  trainerName: 'Treinador Vinicius Holanda',
  logoUrl: '',
  primaryColor: '#00f0ff',
  secondaryColor: '#3b82f6',
  bgTheme: 'obsidian',
  welcomeMessageStudent: 'Bem-vindo ao seu portal de treino de alta performance. Vamos pra cima!',
  instagramHandle: '@kinetix.studio',
  whatsappNumber: '5511999998888',
  websiteUrl: 'kinetixstudio.com.br',
  hidePoweredBy: false,
};

const BRAND_STORAGE_KEY = 'fitconnect_studio_brand_v2';

interface BrandContextType {
  brand: StudioBrand;
  updateBrand: (newBrand: Partial<StudioBrand>) => void;
  resetBrand: () => void;
  presetColors: { name: string; hex: string; secondary: string }[];
}

export const PRESET_BRAND_COLORS = [
  { name: 'Cyan Cyber (Padrão)', hex: '#00f0ff', secondary: '#3b82f6' },
  { name: 'Verde Esmeralda Neon', hex: '#10b981', secondary: '#059669' },
  { name: 'Ouro Imperial / Âmbar', hex: '#f59e0b', secondary: '#d97706' },
  { name: 'Rosa Neon / Magenta', hex: '#ec4899', secondary: '#db2777' },
  { name: 'Roxo Elétrico / Violeta', hex: '#8b5cf6', secondary: '#7c3aed' },
  { name: 'Azul Cobalto Pro', hex: '#3b82f6', secondary: '#1d4ed8' },
  { name: 'Vermelho Crimson High-Octane', hex: '#ff3e3e', secondary: '#dc2626' },
  { name: 'Verde Limão Bio-Performance', hex: '#a3e635', secondary: '#65a30d' },
];

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brand, setBrandState] = useState<StudioBrand>(() => {
    try {
      const saved = localStorage.getItem(BRAND_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_BRAND, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to parse saved brand settings', e);
    }
    return DEFAULT_BRAND;
  });

  // Apply root CSS variables whenever primary/secondary color changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-brand-primary', brand.primaryColor);
    root.style.setProperty('--color-brand-secondary', brand.secondaryColor);
    
    // Convert hex to rgb for opacity utilities
    const hexToRgb = (hex: string) => {
      let c = hex.replace('#', '');
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      const num = parseInt(c, 16);
      return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
    };

    try {
      root.style.setProperty('--color-brand-primary-rgb', hexToRgb(brand.primaryColor));
    } catch (e) {
      root.style.setProperty('--color-brand-primary-rgb', '0, 240, 255');
    }

    // Update document title dynamically
    document.title = `${brand.studioName} — ${brand.tagline}`;
  }, [brand]);

  const updateBrand = (newBrandProps: Partial<StudioBrand>) => {
    setBrandState(prev => {
      const updated = { ...prev, ...newBrandProps };
      localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const resetBrand = () => {
    setBrandState(DEFAULT_BRAND);
    localStorage.removeItem(BRAND_STORAGE_KEY);
  };

  return (
    <BrandContext.Provider value={{ brand, updateBrand, resetBrand, presetColors: PRESET_BRAND_COLORS }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = (): BrandContextType => {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};
