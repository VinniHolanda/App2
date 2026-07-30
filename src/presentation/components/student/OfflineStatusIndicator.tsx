import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, HardDrive, CheckCircle2 } from 'lucide-react';
import { clientRepository } from '../../../data/repositories/ClientRepository';
import { getPendingOfflineActions } from '../../../lib/indexedDbStorage';

export const OfflineStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);

  const checkPending = async () => {
    try {
      const pending = await getPendingOfflineActions();
      setPendingCount(pending.length);
    } catch (e) {
      setPendingCount(0);
    }
  };

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      await triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      checkPending();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkPending();
    const interval = setInterval(checkPending, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      await clientRepository.syncOfflineQueue?.();
      await checkPending();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err) {
      console.error('Erro na sincronização manual:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0 && !syncSuccess) {
    return null; // Silent when online and synced
  }

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-3 px-4 shadow-xl flex items-center justify-between gap-3 text-xs animate-fade-in my-2">
      <div className="flex items-center gap-2.5">
        {!isOnline ? (
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <WifiOff className="w-4 h-4 animate-pulse" />
          </div>
        ) : pendingCount > 0 ? (
          <div className="p-1.5 rounded-lg bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 shrink-0">
            <HardDrive className="w-4 h-4 animate-pulse" />
          </div>
        ) : (
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}

        <div>
          <div className="font-bold flex items-center gap-1.5 text-[#f1f5f9]">
            {!isOnline ? (
              <span className="text-amber-300">Modo Offline Ativo (IndexedDB)</span>
            ) : pendingCount > 0 ? (
              <span className="text-[#00f0ff]">Conectado — {pendingCount} treino(s) salvo(s) localmente</span>
            ) : (
              <span className="text-emerald-400">Todos os treinos sincronizados na nuvem</span>
            )}
          </div>
          <p className="text-[11px] text-[#94a3b8] mt-0.5">
            {!isOnline 
              ? 'Seus treinos são registrados no banco local e serão enviados ao voltar a internet.'
              : pendingCount > 0
              ? 'Clique para enviar seus registros pendentes para a nuvem.'
              : 'IndexedDB ativo para garantir performance sem internet.'}
          </p>
        </div>
      </div>

      {isOnline && pendingCount > 0 && (
        <button
          onClick={triggerSync}
          disabled={isSyncing}
          className="bg-[#00f0ff] hover:bg-[#00d0df] text-[#080b11] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-[#00f0ff]/20"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
        </button>
      )}
    </div>
  );
};
