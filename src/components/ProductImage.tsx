import React, { useState } from 'react';
import { Package, Image as ImageIcon, Zap, ZoomIn, X } from 'lucide-react';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  category?: string;
  enablePreview?: boolean;
}

export const PRESET_PRODUCT_IMAGES = [
  {
    name: 'Kabel NYY Supreme (Hitam)',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=80',
    category: 'Kabel Power'
  },
  {
    name: 'Kabel NYM Supreme (Putih)',
    url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=500&auto=format&fit=crop&q=80',
    category: 'Kabel Instalasi'
  },
  {
    name: 'MCB Schneider 1 Phase',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
    category: 'Komponen MCB'
  },
  {
    name: 'MCCB / MCB Industri 3 Phase',
    url: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=500&auto=format&fit=crop&q=80',
    category: 'Pemutus Daya Utama'
  },
  {
    name: 'Box Panel Wall Mounting Proyek',
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80',
    category: 'Box Panel Proyek'
  },
  {
    name: 'Pipa Conduit PVC EGA',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=80',
    category: 'Aksesoris Jalur Kabel'
  },
  {
    name: 'Lampu LED Floodlight Philips',
    url: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=500&auto=format&fit=crop&q=80',
    category: 'Penerangan & LED'
  },
  {
    name: 'Tang Crimping & Skun Kabel',
    url: 'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=500&auto=format&fit=crop&q=80',
    category: 'Perkakas Listrik'
  }
];

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = '',
  size = 'md',
  category,
  enablePreview = true
}) => {
  const [hasError, setHasError] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const sizeClasses = {
    xs: 'w-7 h-7 min-w-[28px] rounded-md',
    sm: 'w-9 h-9 min-w-[36px] rounded-lg',
    md: 'w-12 h-12 min-w-[48px] rounded-xl',
    lg: 'w-16 h-16 min-w-[64px] rounded-xl',
    xl: 'w-24 h-24 min-w-[96px] rounded-2xl',
    custom: ''
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  const handleImageClick = (e: React.MouseEvent) => {
    if (enablePreview && src && !hasError) {
      e.stopPropagation();
      setIsPreviewOpen(true);
    }
  };

  return (
    <>
      <div
        onClick={handleImageClick}
        className={`relative group shrink-0 overflow-hidden bg-slate-100 border border-slate-200/90 flex items-center justify-center ${currentSizeClass} ${className} ${
          enablePreview && src && !hasError ? 'cursor-pointer hover:border-amber-400 hover:shadow-sm' : ''
        }`}
        title={enablePreview && src && !hasError ? `Klik untuk memperbesar foto: ${alt}` : alt}
      >
        {src && !hasError ? (
          <>
            <img
              src={src}
              alt={alt}
              onError={() => setHasError(true)}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
            {enablePreview && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <ZoomIn className="w-3.5 h-3.5 drop-shadow" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-1 text-slate-400 bg-gradient-to-br from-slate-50 to-slate-100">
            {category?.toLowerCase().includes('kabel') ? (
              <Zap className="w-1/2 h-1/2 text-amber-500/70" />
            ) : (
              <Package className="w-1/2 h-1/2 text-slate-400" />
            )}
          </div>
        )}
      </div>

      {/* Lightbox / Enlarged Preview Modal */}
      {isPreviewOpen && src && !hasError && (
        <div
          onClick={() => setIsPreviewOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative bg-white rounded-2xl max-w-xl w-full p-4 shadow-2xl border border-slate-700/30 overflow-hidden"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-900">
                  <ImageIcon className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-black text-slate-900 line-clamp-1">{alt}</h4>
                  {category && <span className="text-[10px] text-slate-500 font-medium">{category}</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[65vh]">
              <img
                src={src}
                alt={alt}
                className="w-full h-full max-h-[60vh] object-contain"
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span>Foto Produk Asli Operasional PT NJN</span>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
