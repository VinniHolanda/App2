import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, AlertTriangle, ShieldAlert, AlertOctagon, CheckCircle2, 
  MessageSquare, RefreshCw, Sparkles, ChevronRight, X, Zap, ShieldCheck, Filter
} from 'lucide-react';
import { Client } from '../../../domain/types';
import { OvertrainingMonitoringService, InjuryRiskNotification } from '../../../domain/services/OvertrainingMonitoringService';
import { Button, Modal } from '../ui/Primitives';

export interface TrainerAlertsNotificationCenterProps {
  clients: Client[];
  onSelectClient?: (clientId: string, tab?: string) => void;
  onApplyAutoDeload?: (clientId: string) => void;
}

export const TrainerAlertsNotificationCenter: React.FC<TrainerAlertsNotificationCenterProps> = ({
  clients,
  onSelectClient,
  onApplyAutoDeload
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning'>('all');
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);

  // Evaluate all notifications from live client data
  const rawNotifications = useMemo(() => {
    return OvertrainingMonitoringService.evaluateAllClients(clients);
  }, [clients]);

  // Active non-dismissed notifications
  const activeNotifications = useMemo(() => {
    return rawNotifications.filter(n => !dismissedIds.includes(n.id));
  }, [rawNotifications, dismissedIds]);

  const filteredNotifications = useMemo(() => {
    if (filterSeverity === 'all') return activeNotifications;
    return activeNotifications.filter(n => n.severity === filterSeverity);
  }, [activeNotifications, filterSeverity]);

  const criticalCount = activeNotifications.filter(n => n.severity === 'critical').length;
  const warningCount = activeNotifications.filter(n => n.severity === 'warning').length;

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => [...prev, id]);
  };

  return (
    <div className="space-y-4">
      {/* TOP NOTIFICATION BANNER / BADGE ROW */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            criticalCount > 0 
              ? 'bg-red-500/10 border border-red-500/30 text-red-400 animate-pulse' 
              : (warningCount > 0 ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' : 'bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff]')
          }`}>
            <Bell className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-[#f1f5f9]">
                Serviço de Monitoramento & Prevenção de Lesões
              </h3>
              {activeNotifications.length > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  criticalCount > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {activeNotifications.length} {activeNotifications.length === 1 ? 'alerta ativo' : 'alertas ativos'}
                </span>
              )}
            </div>
            <p className="text-xs text-[#94a3b8]">
              {activeNotifications.length > 0 
                ? `${criticalCount} crítico(s) e ${warningCount} aviso(s) de risco por excesso de carga ou monotonia.`
                : 'Todos os atletas estão operando dentro das zonas de carga seguras (ACWR < 1.35 e Monotonia < 1.8).'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeNotifications.length > 0 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsOpenModal(true)}
              className="font-bold text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-md shadow-[#00f0ff]/20"
            >
              <ShieldAlert className="w-4 h-4 text-[#080b11]" />
              <span>Ver Central de Notificações</span>
            </Button>
          ) : (
            <div className="bg-[#080b11] text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Monitoramento Ativo</span>
            </div>
          )}
        </div>
      </div>

      {/* QUICK INLINE HIGH PRIORITY CARDS (If critical notifications exist) */}
      {criticalCount > 0 && (
        <div className="space-y-2">
          {activeNotifications.filter(n => n.severity === 'critical').slice(0, 2).map(notif => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-red-200 shadow-md"
            >
              <div className="flex items-start gap-3">
                <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-bounce" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-red-300">{notif.title}</span>
                    <span className="bg-red-500/20 text-red-300 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase">
                      {notif.metricValue}
                    </span>
                  </div>
                  <p className="text-red-200/80 leading-relaxed max-w-2xl">{notif.message}</p>
                  <p className="text-[11px] font-bold text-red-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 inline text-red-400" /> Recomendações: {notif.recommendedAction}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onSelectClient && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectClient(notif.clientId, 'msgs')}
                    className="border-red-500/40 text-red-300 hover:bg-red-500/20 text-xs py-1.5 px-3 flex items-center gap-1 font-bold"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Falar com Aluno
                  </Button>
                )}
                {onApplyAutoDeload && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onApplyAutoDeload(notif.clientId)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-1.5 px-3 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Deload -30%
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* FULL NOTIFICATIONS MODAL */}
      <Modal
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        title="Central de Notificações de Risco & Overtraining"
      >
        <div className="space-y-5 text-xs text-[#f1f5f9]">
          {/* FILTER CONTROLS */}
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[#64748b] font-bold">Filtrar:</span>
              <button
                onClick={() => setFilterSeverity('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterSeverity === 'all'
                    ? 'bg-[#00f0ff] text-[#080b11]'
                    : 'bg-[#0f172a] text-[#94a3b8] border border-[#1e293b]'
                }`}
              >
                Todos ({activeNotifications.length})
              </button>
              <button
                onClick={() => setFilterSeverity('critical')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterSeverity === 'critical'
                    ? 'bg-red-500 text-white'
                    : 'bg-[#0f172a] text-red-400 border border-red-500/30'
                }`}
              >
                Críticos ({criticalCount})
              </button>
              <button
                onClick={() => setFilterSeverity('warning')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterSeverity === 'warning'
                    ? 'bg-amber-500 text-[#080b11]'
                    : 'bg-[#0f172a] text-amber-400 border border-amber-500/30'
                }`}
              >
                Alertas ({warningCount})
              </button>
            </div>

            {dismissedIds.length > 0 && (
              <button
                onClick={() => setDismissedIds([])}
                className="text-[10px] text-[#00f0ff] hover:underline"
              >
                Restaurar ocultos ({dismissedIds.length})
              </button>
            )}
          </div>

          {/* LIST OF NOTIFICATIONS */}
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map(n => {
                const isCrit = n.severity === 'critical';

                return (
                  <div
                    key={n.id}
                    className={`border rounded-2xl p-4 space-y-3 transition-all ${
                      isCrit 
                        ? 'bg-red-500/10 border-red-500/40 text-red-100' 
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                            isCrit ? 'bg-red-500/30 border-red-500/50 text-red-300' : 'bg-amber-500/30 border-amber-500/50 text-amber-300'
                          }`}>
                            {isCrit ? 'Risco Crítico' : 'Alerta'}
                          </span>
                          <span className="font-bold text-sm text-[#f1f5f9]">{n.clientName}</span>
                          <span className="text-[10px] font-mono text-[#64748b]">
                            {new Date(n.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-[#f1f5f9]">{n.title}</h4>
                      </div>

                      <button
                        onClick={() => handleDismiss(n.id)}
                        className="text-[#64748b] hover:text-[#f1f5f9] p-1 rounded-lg hover:bg-[#1e293b]"
                        title="Dispensar alerta"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-[#d1d5db] leading-relaxed">{n.message}</p>

                    <div className="bg-[#080b11]/80 border border-[#1e293b] p-3 rounded-xl space-y-1 text-xs">
                      <div className="text-[10px] font-bold text-[#00f0ff] uppercase flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Ação Preventiva Recomendada
                      </div>
                      <p className="text-xs text-[#94a3b8]">{n.recommendedAction}</p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
                      {onSelectClient && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsOpenModal(false);
                            onSelectClient(n.clientId, 'msgs');
                          }}
                          className="border-[#1e293b] text-[#f1f5f9] text-xs py-1 px-3 flex items-center gap-1 font-bold"
                        >
                          <MessageSquare className="w-3 h-3 text-[#00f0ff]" /> Abrir Chat
                        </Button>
                      )}
                      {onApplyAutoDeload && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            onApplyAutoDeload(n.clientId);
                            handleDismiss(n.id);
                          }}
                          className="bg-[#00f0ff] text-[#080b11] font-bold text-xs py-1 px-3 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Aplicar Deload
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-[#f1f5f9]">Nenhum alerta pendente nesta categoria.</p>
                <p className="text-[11px] text-[#64748b]">Todos os parâmetros de sobrecarga estão saudáveis.</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
