import React from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { cn } from '../utils/cn';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentImageUrl?: string;
  folder?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onUpload, 
  currentImageUrl, 
  folder = 'general',
  className 
}) => {
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem (JPG, PNG, etc).');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, `${folder}/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      onUpload(downloadURL);
    } catch (err) {
      console.error('Erro no upload:', err);
      setError('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "relative group cursor-pointer border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center overflow-hidden bg-slate-50",
          currentImageUrl ? "border-indigo-200 aspect-video" : "border-slate-200 h-40 hover:border-indigo-400 hover:bg-indigo-50",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        {currentImageUrl ? (
          <>
            <img 
              src={currentImageUrl} 
              alt="Preview" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white text-xs font-bold flex items-center gap-2">
                <Upload size={14} /> Alterar Imagem
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeImage();
              }}
              className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-rose-500 rounded-full shadow-sm transition-colors"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="text-center p-6">
            {isUploading ? (
              <Loader2 size={32} className="mx-auto text-indigo-500 animate-spin mb-2" />
            ) : (
              <ImageIcon size={32} className="mx-auto text-slate-300 mb-2 group-hover:text-indigo-400 transition-colors" />
            )}
            <p className="text-xs font-bold text-slate-500 group-hover:text-indigo-600">
              {isUploading ? 'Enviando...' : 'Clique para enviar foto'}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">JPG, PNG ou WebP (Máx. 5MB)</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">
          {error}
        </p>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};
