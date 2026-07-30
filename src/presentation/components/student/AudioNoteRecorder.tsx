import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Square, 
  Sparkles, 
  Trash2, 
  Check, 
  Volume2, 
  AlertCircle,
  Radio,
  MessageSquare
} from 'lucide-react';
import { Button } from '../ui/Primitives';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface AudioNoteRecorderProps {
  value: string;
  onChange: (text: string, isFromAudio?: boolean) => void;
  placeholder?: string;
  label?: string;
  compact?: boolean;
}

export const AudioNoteRecorder: React.FC<AudioNoteRecorderProps> = ({
  value,
  onChange,
  placeholder = "Ex: Senti o ombro cansado no supino, mas o agachamento foi bem fluido...",
  label = "Nota Pós-Treino por Áudio (Voz para Texto)",
  compact = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasAudioInput, setHasAudioInput] = useState(false);
  const [pulseScale, setPulseScale] = useState(1);

  const recognitionRef = useRef<any>(null);
  const pulseIntervalRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      if (pulseIntervalRef.current) {
        clearInterval(pulseIntervalRef.current);
      }
    };
  }, []);

  const startListening = () => {
    setErrorMessage(null);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage("Navegador não possui suporte à Web Speech API. Você pode digitar sua nota manualmente.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onstart = () => {
        setIsListening(true);
        // Start simulated sound wave animation pulse
        pulseIntervalRef.current = setInterval(() => {
          setPulseScale(1 + Math.random() * 0.35);
        }, 300);
      };

      recognition.onresult = (event: any) => {
        let finalText = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results?.[i];
          if (res && res[0]) {
            const transcriptPiece = res[0].transcript || '';
            if (res.isFinal) {
              finalText += transcriptPiece;
            } else {
              interimText += transcriptPiece;
            }
          }
        }

        if (finalText) {
          const updatedValue = value ? `${value.trim()} ${finalText.trim()}` : finalText.trim();
          onChange(updatedValue, true);
          setHasAudioInput(true);
        }
        setInterimTranscript(interimText);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage('Acesso ao microfone negado. Verifique as permissões do navegador.');
        } else if (event.error === 'no-speech') {
          // Silent no speech warning
        } else {
          setErrorMessage(`Erro no áudio (${event.error}). Digite manualmente se necessário.`);
        }
        stopListening();
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
        if (pulseIntervalRef.current) {
          clearInterval(pulseIntervalRef.current);
        }
        setPulseScale(1);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start SpeechRecognition", err);
      setErrorMessage("Erro ao iniciar gravação de áudio. Tente novamente.");
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
    setInterimTranscript('');
    if (pulseIntervalRef.current) {
      clearInterval(pulseIntervalRef.current);
    }
    setPulseScale(1);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleQuickAddPhrase = (phrase: string) => {
    const updated = value ? `${value.trim()} ${phrase}` : phrase;
    onChange(updated, true);
    setHasAudioInput(true);
  };

  return (
    <div className="bg-[#080b11] border border-[#1e293b] rounded-2xl p-4 space-y-3.5 shadow-lg relative overflow-hidden">
      {/* Background Glow when Recording */}
      {isListening && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 pointer-events-none"
        />
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-xl ${isListening ? 'bg-[#00f0ff] text-[#080b11]' : 'bg-[#00f0ff]/10 text-[#00f0ff]'}`}>
            {isListening ? <Radio className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
          </div>
          <div>
            <label className="text-xs font-bold text-[#f1f5f9] flex items-center gap-1.5">
              {label}
              {hasAudioInput && (
                <span className="bg-[#00f0ff]/20 text-[#00f0ff] text-[10px] px-2 py-0.5 rounded-full border border-[#00f0ff]/30 font-extrabold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Transcrito por Voz
                </span>
              )}
            </label>
            <p className="text-[11px] text-[#64748b]">
              Fale naturalmente seu feedback pós-treino (esforço, articulações, fôlego)
            </p>
          </div>
        </div>

        {/* Mic Toggle Button */}
        <motion.button
          type="button"
          onClick={toggleListening}
          animate={{ scale: isListening ? pulseScale : 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' 
              : 'bg-gradient-to-r from-[#00f0ff] to-[#38bdf8] text-[#080b11] hover:brightness-110 shadow-[#00f0ff]/20'
          }`}
        >
          {isListening ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current animate-pulse" />
              <span>Parar de Gravar</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" />
              <span>Gravar Nota por Áudio</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Recording Status & Waveform Animation */}
      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#0f172a] border border-[#00f0ff]/30 rounded-xl p-3 space-y-2"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#00f0ff] font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                Ouvindo sua voz... Fale agora!
              </span>
              <span className="text-[10px] text-[#94a3b8] font-mono">PT-BR (Web Speech API)</span>
            </div>

            {/* Soundwave Simulation Bars */}
            <div className="flex items-center justify-center gap-1.5 h-6">
              {[0.4, 0.8, 1.2, 0.6, 1.0, 1.4, 0.7, 0.3, 0.9, 1.1, 0.5].map((factor, idx) => (
                <motion.div
                  key={idx}
                  animate={{ height: [6, 20 * factor, 8] }}
                  transition={{ repeat: Infinity, duration: 0.5 + idx * 0.08, ease: 'easeInOut' }}
                  className="w-1 bg-[#00f0ff] rounded-full"
                />
              ))}
            </div>

            {/* Interim live text stream */}
            {interimTranscript && (
              <p className="text-xs italic text-[#94a3b8] bg-[#080b11] p-2 rounded-lg border border-[#1e293b]">
                "{interimTranscript}..."
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message Warning */}
      {errorMessage && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-start gap-2 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Textarea for previewing and manual editing */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value, false)}
          placeholder={placeholder}
          rows={compact ? 2 : 3}
          className="w-full bg-[#0f172a] border border-[#1e293b] focus:border-[#00f0ff] rounded-xl p-3 text-xs text-[#f1f5f9] outline-none resize-none transition-all placeholder:text-[#64748b]"
        />

        {value.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onChange('', false);
              setHasAudioInput(false);
            }}
            className="absolute top-2.5 right-2.5 p-1 rounded-lg text-[#64748b] hover:text-red-400 bg-[#080b11] border border-[#1e293b] transition-colors"
            title="Limpar texto"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Quick Expressive Feedback Chips */}
      <div className="space-y-1.5">
        <span className="text-[10px] uppercase tracking-wider text-[#64748b] font-bold flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#00f0ff]" /> Atalhos Rápidos de Percepção de Esforço:
        </span>
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {[
            '💪 Treino intenso, ótimo estímulo!',
            '🦵 Fadiga alta nas pernas',
            '⚡ Cargas pareceram leves, posso subir',
            '🧘 articulações 100% confortáveis',
            '😮‍💨 Fôlego exigido ao máximo no cardio'
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickAddPhrase(chip)}
              className="bg-[#0f172a] hover:bg-[#1e293b] text-[#94a3b8] hover:text-[#00f0ff] border border-[#1e293b] hover:border-[#00f0ff]/40 px-2.5 py-1 rounded-lg transition-all"
            >
              + {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
