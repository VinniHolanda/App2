import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  Share, 
  PlusSquare, 
  X, 
  Sparkles,
  Layers,
  Zap
} from 'lucide-react';
import { Button, Modal } from '../ui/Primitives';
import { promptPwaInstall, isPwaInstalled, isPwaInstallable } from '../../../pwaRegister';

export const PwaInstallBanner: React.FC = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showHowToModal, setShowHowToModal] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    setInstalled(isPwaInstalled());

    const handleInstallAvailable = () => {
      setCanInstall(true);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setCanInstall(false);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('pwaInstallAvailable', handleInstallAvailable);
    window.addEventListener('pwaInstalled', handleInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('pwaInstallAvailable', handleInstallAvailable);
      window.removeEventListener('pwaInstalled', handleInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (canInstall) {
      const success = await promptPwaInstall();
      if (success) {
        setInstalled(true);
      }
    } else {
      setShowHowToModal(true);
    }
  };

  return (
    <>
      {/* Offline Alert Strip if network drops */}
      {!isOnline && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-300 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Você está em Modo Offline. Seus treinos salvos continuam disponíveis pelo Service Worker do PWA!</span>
        </div>
      )}

      {/* Top Bar PWA Install Widget / Badge */}
      <div className="flex items-center gap-2">
        {installed ? (
          <div className="bg-[#0f172a] border border-[#00f0ff]/30 text-[#00f0ff] px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="hidden sm:inline">App Instalado</span>
            <span className="sm:hidden">PWA</span>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleInstallClick}
            className="bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#080b11] hover:brightness-110 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-[#00f0ff]/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar App</span>
          </motion.button>
        )}
      </div>

      {/* How to Install PWA Guidance Modal */}
      <Modal
        isOpen={showHowToModal}
        onClose={() => setShowHowToModal(false)}
        title="Instalar FitConnect no seu Celular ou Computador"
      >
        <div className="space-y-5 text-xs text-[#f1f5f9]">
          <div className="flex items-center gap-3 bg-[#080b11] p-3 rounded-2xl border border-[#1e293b]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00f0ff] to-[#3b82f6] text-[#080b11] flex items-center justify-center font-black text-sm">
              FC
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#f1f5f9]">FitConnect — Progressive Web App</h4>
              <p className="text-[11px] text-[#94a3b8]">Instale como um aplicativo nativo no iOS, Android, Windows ou macOS sem precisar de App Store.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-[#0f172a] border border-[#1e293b] p-3.5 rounded-xl space-y-1.5">
              <h5 className="font-bold text-[#00f0ff] flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" /> No iPhone / iPad (Safari iOS)
              </h5>
              <ol className="list-decimal pl-4 space-y-1 text-[#94a3b8]">
                <li>Toque no botão <strong>Compartilhar</strong> <Share className="w-3 h-3 inline text-[#00f0ff]" /> no menu do Safari.</li>
                <li>Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong> <PlusSquare className="w-3 h-3 inline text-[#00f0ff]" />.</li>
                <li>Confirme em <strong>"Adicionar"</strong> no canto superior direito.</li>
              </ol>
            </div>

            <div className="bg-[#0f172a] border border-[#1e293b] p-3.5 rounded-xl space-y-1.5">
              <h5 className="font-bold text-[#00f0ff] flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> No Android (Chrome / Edge / Brave)
              </h5>
              <ol className="list-decimal pl-4 space-y-1 text-[#94a3b8]">
                <li>Toque no menu de 3 pontos <strong className="text-white">⋮</strong> no canto superior do navegador.</li>
                <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                <li>O ícone do FitConnect aparecerá na sua tela de aplicativos.</li>
              </ol>
            </div>
          </div>

          <div className="bg-[#00f0ff]/10 border border-[#00f0ff]/30 p-3 rounded-xl flex items-center justify-between text-[#00f0ff]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Acesso rápido, ícone personalizado e suporte offline!</span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowHowToModal(false)}
              className="font-bold text-xs py-1 px-3"
            >
              Entendido
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
