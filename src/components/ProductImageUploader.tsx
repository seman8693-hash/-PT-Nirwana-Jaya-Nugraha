import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Sparkles, Link as LinkIcon, Check } from 'lucide-react';
import { PRESET_PRODUCT_IMAGES } from './ProductImage';

interface ProductImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  category?: string;
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  value,
  onChange,
  category
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [isUrlInputOpen, setIsUrlInputOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Resize and compress image to base64 so localStorage remains performant
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (JPG, PNG, WEBP)');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 640;
        const MAX_HEIGHT = 640;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onChange(compressedDataUrl);
        } else {
          onChange(e.target?.result as string);
        }
        setIsProcessing(false);
      };
      img.onerror = () => {
        onChange(e.target?.result as string);
        setIsProcessing(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleApplyCustomUrl = () => {
    if (customUrl.trim()) {
      onChange(customUrl.trim());
      setCustomUrl('');
      setIsUrlInputOpen(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
          <span>Foto / Gambar Produk</span>
        </label>
        <div className="flex items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="text-amber-700 hover:text-amber-900 font-bold hover:underline flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>{showPresets ? 'Tutup Pilihan Foto' : 'Pilih Foto Contoh'}</span>
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => setIsUrlInputOpen(!isUrlInputOpen)}
            className="text-blue-700 hover:text-blue-900 font-bold hover:underline flex items-center gap-1"
          >
            <LinkIcon className="w-3 h-3" />
            <span>Tempel URL</span>
          </button>
        </div>
      </div>

      {/* Preset Selector */}
      {showPresets && (
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
          <div className="text-[11px] font-bold text-amber-950 flex items-center justify-between">
            <span>Pilih Cepat Foto Komponen Listrik Resmi:</span>
            <span className="text-[10px] text-amber-800">1 Klik Pasang</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESET_PRODUCT_IMAGES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onChange(preset.url);
                  setShowPresets(false);
                }}
                className={`p-1.5 rounded-lg border text-left flex items-center gap-2 transition hover:bg-white ${
                  value === preset.url
                    ? 'border-amber-500 bg-white ring-2 ring-amber-500/20'
                    : 'border-amber-200 bg-white/60'
                }`}
              >
                <img
                  src={preset.url}
                  alt={preset.name}
                  className="w-8 h-8 rounded-md object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold text-slate-800 truncate">{preset.name}</div>
                  <div className="text-[9px] text-slate-500 truncate">{preset.category}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom URL Input Box */}
      {isUrlInputOpen && (
        <div className="flex gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
          <input
            type="url"
            value={customUrl}
            onChange={e => setCustomUrl(e.target.value)}
            placeholder="https://contoh.com/gambar-produk.jpg"
            className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
          <button
            type="button"
            onClick={handleApplyCustomUrl}
            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
          >
            Terapkan
          </button>
        </div>
      )}

      {/* Main Upload / Preview Area */}
      <div className="flex items-start gap-4">
        {value ? (
          <div className="relative group w-28 h-28 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-slate-100 shrink-0 shadow-sm">
            <img
              src={value}
              alt="Preview Produk"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 bg-white/90 hover:bg-white text-slate-900 rounded-lg text-[10px] font-bold shadow"
                title="Ganti Foto"
              >
                Ganti
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow"
                title="Hapus Foto"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`w-28 h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-2 text-center cursor-pointer transition shrink-0 ${
              isDragging
                ? 'border-amber-500 bg-amber-50/50'
                : 'border-slate-300 hover:border-amber-400 hover:bg-slate-50'
            }`}
          >
            <Upload className="w-6 h-6 text-slate-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-600 leading-tight">Upload Foto</span>
            <span className="text-[9px] text-slate-400">Klik / Tarik file</span>
          </div>
        )}

        <div className="flex-1 space-y-2 text-xs">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>{isProcessing ? 'Memproses...' : value ? 'Unggah Foto Lain' : 'Pilih Foto dari Komputer'}</span>
            </button>

            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 transition"
              >
                Hapus Foto
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Format yang didukung: JPG, PNG, WEBP. Gambar otomatis dikompresi agar sistem berjalan kencang dan tersimpan aman di katalog NJN. Foto ini akan otomatis muncul di Kasir POS, Gudang Stok, Penawaran SPH, Faktur Invoice, dan Surat Jalan (DO).
          </p>
        </div>
      </div>
    </div>
  );
};
