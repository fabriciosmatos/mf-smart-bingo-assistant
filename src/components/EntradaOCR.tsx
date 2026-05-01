import React, { useRef, useState } from 'react';
import { Camera, Upload, Check, User, RotateCcw, X, Brain, Loader2, CameraOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { processarImagemOCR, formatarGrade } from '../services/ocrService';

interface Props {
  onSalvar: (numeros: (number | null)[][], nome: string) => void;
}

export function EntradaOCR({ onSalvar }: Props) {
  const [capturando, setCapturando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [numeros, setNumeros] = useState<number[]>([]);
  const [nome, setNome] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('EntradaOCR: Arquivo selecionado:', file.name, file.type);
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        console.log('EntradaOCR: FileReader carregado. Tamanho do DataURL:', dataUrl.length);
        const img = new Image();
        img.onload = () => {
          console.log('EntradaOCR: Imagem carregada no objeto Image. Dimensões:', img.width, 'x', img.height);
          const processedUrl = processarImagemNoCanvas(img);
          if (processedUrl) {
            setPreview(processedUrl);
            processarOCR(processedUrl);
          }
        };
        img.onerror = (err) => console.error('EntradaOCR: Erro ao carregar imagem via FileReader:', err);
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const processarImagemNoCanvas = (source: HTMLVideoElement | HTMLImageElement) => {
    console.log('EntradaOCR: Processando imagem no Canvas...');
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        const width = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
        const height = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
        
        console.log('EntradaOCR: Dimensões do Canvas:', width, 'x', height);
        canvas.width = width;
        canvas.height = height;
        
        // Tenta aplicar filtros para melhorar OCR, mas garante fallback
        try {
          context.filter = 'grayscale(100%) contrast(200%) brightness(110%)';
        } catch (e) {
          console.warn('EntradaOCR: Filtros de canvas não suportados neste navegador.');
        }

        context.drawImage(source, 0, 0, width, height);
        
        const pngUrl = canvas.toDataURL('image/png');
        console.log('EntradaOCR: Canvas convertido para PNG. Tamanho:', pngUrl.length);
        return pngUrl;
      }
    }
    console.error('EntradaOCR: Falha ao obter contexto do canvas.');
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
        processarOCR(processedUrl);
      }
    }
  };

  const pararCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setCapturando(false);
  };

  const processarOCR = async (url: string) => {
    setProcessando(true);
    console.log('EntradaOCR: Iniciando chamada do serviço de OCR...');
    try {
      const nums = await processarImagemOCR(url);
      console.log('EntradaOCR: Números recebidos do serviço:', nums);
      setNumeros(nums);
      if (nums.length === 0) {
        console.warn('EntradaOCR: O serviço retornou uma lista vazia de números.');
      }
    } catch (err) {
      console.error('EntradaOCR: Erro no processamento OCR:', err);
      alert('Falha ao ler números. Tente aproximar a câmera ou usar uma foto mais nítida.');
    } finally {
      setProcessando(false);
    }
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
            <span className="font-bold text-[10px] tracking-widest uppercase text-center px-2">CÂMERA</span>
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
              <span className="font-bold text-[10px] tracking-widest uppercase text-center px-2">GALERIA</span>
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
          <div className="relative rounded-xl overflow-hidden aspect-video border border-slate-700">
            <img src={preview} className="w-full h-full object-cover grayscale contrast-125 brightness-75" />
            {processando && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                <RotateCcw className="animate-spin mb-2 text-amber-500" size={32} />
                <span className="font-bold text-[10px] tracking-widest uppercase text-amber-500">Decodificando Matriz...</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="ID DA CARTELA"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-12 pr-4 font-bold text-sm focus:outline-none focus:border-amber-500 transition-all uppercase"
              />
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-700">
              <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-widest">Números Identificados ({numeros.length})</h4>
              <div className="flex flex-wrap gap-1">
                {numeros.map((n, i) => (
                  <span key={i} className="bg-slate-800 text-amber-500 px-2 py-1 rounded border border-slate-700 font-mono text-[10px] font-bold">
                    {n}
                  </span>
                ))}
                {numeros.length === 0 && !processando && (
                  <p className="text-[10px] text-red-400 uppercase font-bold italic">Nenhum número detectado. Tente aproximar ou melhorar a iluminação.</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => { setPreview(null); setNumeros([]); }}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-[10px] tracking-widest uppercase transition-all"
              >
                RESCANEAR
              </button>
              <button 
                disabled={numeros.length === 0}
                onClick={() => onSalvar(formatarGrade(numeros), nome || 'OCR-' + Math.floor(Math.random() * 9999))}
                className="flex-[2] py-3 bg-amber-600 text-slate-900 rounded-lg font-black text-[10px] tracking-widest uppercase active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
              >
                <Check size={16} /> CONFIRMAR DADOS
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
