import React, { useRef, useState } from 'react';
import { Camera, Upload, Check, User, RotateCcw, Brain } from 'lucide-react';
import { processarImagemOCR, formatarGrade } from '../services/ocrService';

interface Props {
  onSalvar: (numeros: (number | null)[][], nome: string) => void;
}

export function EntradaOCR({ onSalvar }: Props) {
  const [capturando, setCapturando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [gradePreview, setGradePreview] = useState<(number | null)[][]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const processedUrl = processarImagemNoCanvas(img);
          if (processedUrl) {
            setPreview(processedUrl);
            processarLeitura(processedUrl);
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const processarImagemNoCanvas = (source: HTMLVideoElement | HTMLImageElement) => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        let width = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
        let height = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
        
        const MAX = 1200;
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        context.drawImage(source, 0, 0, width, height);
        return canvas.toDataURL('image/png');
      }
    }
    return null;
  };

  const iniciarCamera = async () => {
    setCapturando(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Erro ao acessar câmera: ' + err);
      setCapturando(false);
    }
  };

  const tirarFoto = () => {
    if (videoRef.current) {
      const processedUrl = processarImagemNoCanvas(videoRef.current);
      if (processedUrl) {
        setPreview(processedUrl);
        pararCamera();
        processarLeitura(processedUrl);
      }
    }
  };

  const pararCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setCapturando(false);
  };

  const processarLeitura = async (url: string) => {
    setProcessando(true);
    try {
      const nums = await processarImagemOCR(url);
      setGradePreview(formatarGrade(nums));
    } catch (err) {
      console.error(err);
      setGradePreview(formatarGrade([]));
    } finally {
      setProcessando(false);
    }
  };

  const updateCell = (r: number, c: number, val: string) => {
    const next = [...gradePreview];
    const n = parseInt(val);
    next[r][c] = isNaN(n) ? null : n;
    setGradePreview(next);
  };

  return (
    <div className="space-y-6 overflow-hidden">
      {!capturando && !preview && (
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={iniciarCamera}
            className="aspect-square bg-slate-950 rounded-xl flex flex-col items-center justify-center gap-3 text-slate-500 border-2 border-dashed border-slate-700 hover:border-amber-500 hover:bg-slate-900 group transition-all"
          >
            <Camera size={32} className="group-hover:text-amber-500 transition-colors" />
            <span className="font-bold text-[10px] tracking-widest uppercase text-center px-2">USAR CÂMERA</span>
          </button>
          
          <div className="relative aspect-square">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full bg-slate-950 rounded-xl flex flex-col items-center justify-center gap-3 text-slate-500 border-2 border-dashed border-slate-700 hover:border-amber-500 hover:bg-slate-900 group transition-all"
            >
              <Upload size={32} className="group-hover:text-amber-500 transition-colors" />
              <span className="font-bold text-[10px] tracking-widest uppercase text-center px-2">ARQUIVO/FOTO</span>
            </button>
          </div>
        </div>
      )}

      {capturando && (
        <div className="relative rounded-xl overflow-hidden aspect-video bg-black border border-slate-700">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <button 
            onClick={tirarFoto}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white/20 backdrop-blur-md rounded-full border-4 border-white/50 flex items-center justify-center p-1"
          >
            <div className="w-full h-full bg-white rounded-full" />
          </button>
        </div>
      )}

      {preview && (
        <div className="space-y-6">
          <div className="relative rounded-xl overflow-hidden aspect-video border border-slate-700 bg-slate-950">
            <img src={preview} className={`w-full h-full object-cover ${processando ? 'opacity-30 blur-sm' : ''}`} alt="Preview" />
            {processando && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <RotateCcw className="animate-spin mb-2 text-amber-500" size={32} />
                <span className="font-bold text-[10px] tracking-widest uppercase text-amber-500">Lendo Cartela...</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="ID OU NOME DA CARTELA"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-12 pr-4 font-bold text-sm focus:outline-none focus:border-amber-500 transition-all uppercase"
              />
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-700">
              <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-4 tracking-widest flex items-center justify-between">
                <span>NÚMEROS RECONHECIDOS</span>
                <Brain size={12} className={processando ? "animate-pulse text-amber-500" : "text-slate-600"} />
              </h4>
              
              <div className="grid grid-cols-5 gap-1.5 max-w-[280px] mx-auto">
                {gradePreview.map((row, rIdx) => 
                  row.map((cell, cIdx) => (
                    <div key={`${rIdx}-${cIdx}`} className="aspect-square relative">
                      {rIdx === 2 && cIdx === 2 ? (
                        <div className="w-full h-full bg-slate-800/50 rounded flex items-center justify-center text-[8px] font-black text-slate-600">FREE</div>
                      ) : (
                        <input 
                          type="number"
                          value={cell === null ? '' : cell}
                          onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                          className="w-full h-full bg-slate-900 border border-slate-700 rounded text-center font-bold text-xs text-amber-500 focus:outline-none focus:border-amber-500 focus:bg-slate-800 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => { setPreview(null); setGradePreview([]); }}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-[10px] tracking-widest uppercase transition-all"
              >
                NOVA FOTO
              </button>
              <button 
                disabled={processando}
                onClick={() => onSalvar(gradePreview, nome || 'CARTELA-' + Math.floor(Math.random() * 9999))}
                className="flex-[2] py-3 bg-amber-600 text-slate-900 rounded-lg font-black text-[10px] tracking-widest uppercase active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
              >
                <Check size={16} /> SALVAR CARTELA
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
