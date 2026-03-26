import React from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { cn } from '../utils/cn';
import imageCompression from 'browser-image-compression';

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
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [showUrlInput, setShowUrlInput] = React.useState(false);
  const [urlInput, setUrlInput] = React.useState('');

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onUpload(urlInput.trim());
      setShowUrlInput(false);
      setUrlInput('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem (JPG, PNG, etc).');
      return;
    }

    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true
      };
      
      const compressedFile = await imageCompression(file, options);
      
      const timestamp = Date.now();
      const fileName = `${timestamp}_${compressedFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, `${folder}/${fileName}`);
      
      const uploadTask = uploadBytesResumable(storageRef, compressedFile);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(p);
        }, 
        (err: any) => {
          console.error('Erro no upload:', err);
          let msg = 'Erro ao enviar imagem.';
          if (err.code === 'storage/unauthorized') {
            msg = 'Sem permissão para enviar. Verifique se o Storage está ativado.';
          } else if (err.code === 'storage/retry-limit-exceeded') {
            msg = 'Tempo de envio esgotado. Tente novamente.';
          } else if (err.message) {
            msg = `Erro: ${err.message}`;
          }
          setError(msg);
          setIsUploading(false);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onUpload(downloadURL);
          setIsUploading(false);
          setProgress(0);
        }
      );
    } catch (err) {
      console.error('Erro na compressão ou início do upload:', err);
      setError('Erro ao processar imagem. Tente novamente.');
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
          <div className="text-center p-6 w-full">
            {isUploading ? (
              <div className="space-y-3">
                <div className="relative w-16 h-16 mx-auto">
                  <Loader2 size={64} className="text-indigo-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-black text-indigo-600">{Math.round(progress)}%</span>
                  </div>
                </div>
                <div className="w-full max-w-[120px] mx-auto h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <ImageIcon size={32} className="mx-auto text-slate-300 mb-2 group-hover:text-indigo-400 transition-colors" />
            )}
            <p className="text-xs font-bold text-slate-500 group-hover:text-indigo-600 mt-2">
              {isUploading ? 'Enviando...' : 'Clique para enviar foto'}
            </p>
            {!isUploading && <p className="text-[10px] text-slate-400 mt-1">JPG, PNG ou WebP</p>}
          </div>
        )}
      </div>

      {showUrlInput ? (
        <form onSubmit={handleUrlSubmit} className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Cole o link da imagem aqui..."
            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="px-3 py-2 bg-slate-100 text-slate-500 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
          >
            <X size={14} />
          </button>
        </form>
      ) : (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Ou cole um link de imagem
          </button>
        </div>
      )}

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
