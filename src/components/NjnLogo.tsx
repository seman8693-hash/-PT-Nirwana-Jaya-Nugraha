import React from 'react';

interface NjnLogoProps {
  variant?: 'full' | 'horizontal' | 'icon' | 'badge' | 'print';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
}

export const NjnLogo: React.FC<NjnLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  glow = true
}) => {
  // SVG Vector of the Gold NJN Medallion
  const renderMedallion = (iconSize: number) => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <defs>
        {/* Metallic Gold Gradients */}
        <linearGradient id="goldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFEAA7" />
          <stop offset="25%" stopColor="#DFB76C" />
          <stop offset="50%" stopColor="#F5D061" />
          <stop offset="75%" stopColor="#C8963E" />
          <stop offset="100%" stopColor="#8C6221" />
        </linearGradient>

        <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C8963E" />
          <stop offset="30%" stopColor="#FFE898" />
          <stop offset="70%" stopColor="#D4A747" />
          <stop offset="100%" stopColor="#8C6221" />
        </linearGradient>

        <linearGradient id="goldLetter" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF2B2" />
          <stop offset="35%" stopColor="#E5BE64" />
          <stop offset="70%" stopColor="#B88628" />
          <stop offset="100%" stopColor="#7A5212" />
        </linearGradient>

        {/* Glow filter */}
        <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Diamond Rhombus Frame (subtle thin lines) */}
      <polygon
        points="100,10 190,100 100,190 10,100"
        stroke="url(#goldRing)"
        strokeWidth="1.2"
        strokeDasharray="4 3"
        fill="none"
        opacity="0.6"
      />

      {/* Outer Circle Ring */}
      <circle
        cx="100"
        cy="100"
        r="84"
        stroke="url(#goldRing)"
        strokeWidth="4"
        fill="#0b0e14"
      />

      {/* Inner Decorative Beaded/Thin Ring */}
      <circle
        cx="100"
        cy="100"
        r="78"
        stroke="url(#goldRing)"
        strokeWidth="1.5"
        strokeDasharray="2 2"
        fill="none"
        opacity="0.8"
      />
      <circle
        cx="100"
        cy="100"
        r="74"
        stroke="url(#goldRing)"
        strokeWidth="1"
        fill="none"
        opacity="0.4"
      />

      {/* Top Diamond Star Ornament */}
      <path
        d="M100,20 L104,26 L110,26 L105,30 L107,36 L100,32 L93,36 L95,30 L90,26 L96,26 Z"
        fill="url(#goldMetallic)"
        filter={glow ? 'url(#goldGlow)' : undefined}
      />

      {/* Bottom Small Diamond Ornament */}
      <polygon
        points="100,174 104,180 100,186 96,180"
        fill="url(#goldMetallic)"
      />

      {/* Center Monogram: NJN */}
      {/* Left 'N' */}
      <path
        d="M48,56 L62,56 L62,118 L48,118 Z"
        fill="url(#goldLetter)"
      />
      <path
        d="M62,56 L78,118 L64,118 L48,56 Z"
        fill="url(#goldMetallic)"
        opacity="0.9"
      />

      {/* Middle 'J' */}
      <path
        d="M93,50 L107,50 L107,112 C107,126 95,134 81,130 L84,117 C92,120 97,116 97,110 L97,50 Z"
        fill="url(#goldLetter)"
        filter={glow ? 'url(#goldGlow)' : undefined}
      />

      {/* Right 'N' */}
      <path
        d="M120,56 L134,56 L134,118 L120,118 Z"
        fill="url(#goldLetter)"
      />
      <path
        d="M120,56 L136,118 L122,118 L106,56 Z"
        fill="url(#goldMetallic)"
        opacity="0.9"
      />

      {/* Curved Golden Smile/Accent Bar beneath NJN */}
      <path
        d="M65,138 Q100,154 135,138 Q100,146 65,138 Z"
        fill="url(#goldRing)"
      />

      {/* Center 4-Point Star Diamond atop J */}
      <path
        d="M100,32 L103,40 L111,43 L103,46 L100,54 L97,46 L89,43 L97,40 Z"
        fill="url(#goldMetallic)"
        filter={glow ? 'url(#goldGlow)' : undefined}
      />
    </svg>
  );

  // Sizing definitions
  const iconDimensions = {
    sm: 28,
    md: 40,
    lg: 56,
    xl: 84
  }[size];

  if (variant === 'icon') {
    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        {renderMedallion(iconDimensions)}
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-amber-500/30 shadow-md ${className}`}>
        {renderMedallion(iconDimensions)}
        <div>
          <div className="text-xs font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 font-serif">
            NJN GOLD
          </div>
          <div className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest leading-none">
            PT NIRWANA JAYA NUGRAHA
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'print') {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        {renderMedallion(52)}
        <div>
          <div className="text-xl font-black tracking-wide text-slate-900 font-serif">
            PT. NIRWANA JAYA NUGRAHA
          </div>
          <div className="text-xs font-bold text-amber-700 tracking-wider uppercase">
            NJN GOLD • ELECTRICAL & PANEL DISTRIBUSI
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
            Jl. Soekarno Hatta No. 488, Batununggal, Bandung | Telp: (022) 731-8921 | Email: operasional@nirwanajaya.co.id
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 rounded-3xl border border-amber-500/30 text-center shadow-2xl relative overflow-hidden flex flex-col items-center ${className}`}>
        {/* Gold Corner Accents */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-400/80" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-400/80" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-400/80" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-amber-400/80" />

        {/* Center Medallion */}
        <div className="my-2">{renderMedallion(110)}</div>

        {/* NJN GOLD Title with luminous glow */}
        <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 font-serif drop-shadow-[0_2px_8px_rgba(245,208,97,0.4)] mt-2">
          NJN GOLD
        </h1>

        {/* Premium Enterprise Pill */}
        <div className="mt-2 px-3 py-0.5 rounded-full border border-amber-400/50 bg-amber-500/10 text-[9px] font-bold tracking-widest text-amber-300 uppercase">
          PREMIUM ENTERPRISE
        </div>

        {/* PT Nirwana Jaya Nugraha */}
        <h2 className="text-xs font-bold text-slate-200 tracking-widest uppercase mt-3">
          PT NIRWANA JAYA NUGRAHA
        </h2>

        {/* Categories Bar */}
        <div className="text-[8px] font-medium tracking-widest text-slate-400 uppercase mt-1">
          DISTRIBUTOR • ELECTRICAL • PANEL DISTRIBUSI • B2B/B2G
        </div>
      </div>
    );
  }

  // Default: Horizontal
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {renderMedallion(iconDimensions)}
      <div className="min-w-0">
        <div className="text-sm font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 font-serif truncate leading-tight">
          NJN GOLD
        </div>
        <div className="text-[11px] font-bold text-white tracking-wide truncate leading-tight mt-0.5">
          PT. NIRWANA JAYA NUGRAHA
        </div>
        <div className="text-[9px] font-semibold text-amber-400/90 tracking-widest uppercase truncate leading-none mt-0.5">
          ELECTRICAL & PANEL DISTRIBUTOR
        </div>
      </div>
    </div>
  );
};
