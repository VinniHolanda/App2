import React, { useState } from 'react';
import { Client, Program, ProgramDay, ProgramExercise, TrainingGoal, ClientLevel, EquipmentProfile } from '../../../domain/types';
import { Badge, Button, Card, Modal } from '../ui/Primitives';
import { calculateWeeklyVolume } from '../../../domain/calculators/volumeCalculators';
import { MOVEMENT_PATTERN_LABELS, EXERCISE_CATALOG } from '../../../data/exerciseCatalog';
import { OvertrainingMonitoringService } from '../../../domain/services/OvertrainingMonitoringService';
import { AlertOctagon, AlertTriangle, ShieldAlert, Trash2 } from 'lucide-react';

export interface ClientCardProps {
  client: Client;
  onClick: () => void;
  onDeleteClient?: (id: string) => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, onClick, onDeleteClient }) => {
  const isParqWarn = client.parq && Object.values(client.parq).some(v => v === 'sim');
  const monotonyStatus = OvertrainingMonitoringService.getClientMonotonyStatus(client);
  const initials = client.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  let lastActivityStr = '';
  let latestTime = 0;

  if (client.rpeLog && client.rpeLog.length > 0) {
    client.rpeLog.forEach(s => {
      if (s.date) {
        const t = new Date(s.date).getTime();
        if (!isNaN(t) && t > latestTime) latestTime = t;
      }
    });
  }
  if (client.programHistory && client.programHistory.length > 0) {
    client.programHistory.forEach(h => {
      if (h.savedAt) {
        const t = new Date(h.savedAt).getTime();
        if (!isNaN(t) && t > latestTime) latestTime = t;
      }
    });
  }

  if (latestTime > 0) {
    const d = new Date(latestTime);
    lastActivityStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  const levelColor = 
    client.level === 'Avançado' ? 'border-[#00f0ff] text-[#00f0ff]' :
    client.level === 'Intermediário' ? 'border-sky-400 text-sky-400' :
    'border-emerald-400 text-emerald-400';

  return (
    <Card 
      onClick={onClick} 
      className={`group relative overflow-hidden transition-all duration-300 hover:scale-[1.015] hover:border-[#00f0ff]/50 hover:shadow-xl hover:shadow-[#00f0ff]/5 bg-[#0f172a]/90 backdrop-blur-md ${
        monotonyStatus.inRiskZone ? 'border-red-500/50 shadow-lg shadow-red-500/10' : ''
      }`}
    >
      {/* Visual Indicator Banner for Monotony Risk */}
      {monotonyStatus.inRiskZone && (
        <div className="flex items-center justify-between px-3 py-1 bg-red-500/15 border-b border-red-500/30 text-red-300 text-[10px] font-black uppercase tracking-wider mb-3 -mx-4 -mt-4">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <AlertOctagon className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>Alerta de Monotonia: {monotonyStatus.monotony}</span>
          </div>
          <span className="text-[9px] bg-red-500/30 text-red-200 px-1.5 py-0.5 rounded font-mono font-bold">
            {monotonyStatus.severity === 'critical' ? 'CRÍTICO (≥2.0)' : 'ALERTA (≥1.8)'}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3.5 mb-3.5">
        <div className="relative">
          <div className={`w-12 h-12 rounded-2xl bg-[#202026] flex items-center justify-center font-display font-extrabold text-sm border transition-colors shadow-inner ${
            monotonyStatus.inRiskZone 
              ? 'text-red-400 border-red-500/60 group-hover:border-red-400' 
              : 'text-[#00f0ff] border-[#2d2d38] group-hover:border-[#00f0ff]'
          }`}>
            {initials}
          </div>
          {monotonyStatus.inRiskZone ? (
            <div 
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-[#0f172a] flex items-center justify-center text-white shadow-lg animate-pulse z-10"
              title={`Alerta de Monotonia de Carga: ${monotonyStatus.monotony} (Risco de Lesão)`}
            >
              <AlertOctagon className="w-3 h-3 text-white" />
            </div>
          ) : client.program ? (
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#00f0ff] ring-2 ring-[#0f172a]" title="Treino Prescrito Ativo" />
          ) : null}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h3 className="font-bold text-base text-[#f1f5f9] truncate group-hover:text-[#00f0ff] transition-colors">
              {client.name}
            </h3>
            {onDeleteClient && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClient(client.id);
                }}
                className="text-[#64748b] hover:text-red-400 p-1 rounded-lg transition-colors"
                title="Excluir Aluno"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-xs text-[#80808c] font-medium flex items-center gap-2 mt-0.5">
            <span className={`px-1.5 py-0.2 rounded border text-[10px] font-bold ${levelColor}`}>
              {client.level}
            </span>
            <span>•</span>
            <span className="truncate">{client.tipo || 'Presencial'}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
        <Badge variant="accent">{client.goal.split('(')[0].trim()}</Badge>
        <Badge variant="neutral">{client.days}x/sem</Badge>
        {monotonyStatus.inRiskZone && (
          <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span>Monotonia {monotonyStatus.monotony}</span>
          </span>
        )}
        {isParqWarn && <Badge variant="warn">⚠ PAR-Q</Badge>}
      </div>

      <div className="text-xs text-[#80808c] flex items-center justify-between pt-2.5 border-t border-[#1e293b]">
        <span className={monotonyStatus.inRiskZone ? "text-red-400 font-bold flex items-center gap-1.5" : client.program ? "text-[#00f0ff] font-semibold flex items-center gap-1.5" : "text-[#64748b]"}>
          {monotonyStatus.inRiskZone ? (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Risco de Overtraining
            </>
          ) : client.program ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
              Treino Ativo
            </>
          ) : (
            'Sem prescrição'
          )}
        </span>

        {latestTime > 0 ? (
          <span className="text-[11px] text-[#80808c] font-medium">
            Atividade {lastActivityStr}
          </span>
        ) : (
          <span className="text-[11px] text-[#52525b]">Sem registros</span>
        )}
      </div>
    </Card>
  );
};

export const VolumeBarChart: React.FC<{ program: Program | null | undefined; targets?: Record<string, number> }> = ({ program, targets }) => {
  if (!program) return null;
  const volumes = calculateWeeklyVolume(program);

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 my-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-display font-bold text-sm text-[#f1f5f9] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00f0ff]" />
          Volume Semanal por Grupo Muscular
        </h4>
        <span className="text-xs text-[#64748b]">Séries diretas / semana</span>
      </div>

      <div className="space-y-2.5">
        {volumes.map(item => {
          const target = targets?.[item.muscle] || 12;
          const maxScale = Math.max(22, target + 4, item.direct);
          const widthPct = Math.min(100, (item.direct / maxScale) * 100);
          const tickPct = Math.min(100, (target / maxScale) * 100);

          const isOk = item.direct >= target * 0.8 && item.direct <= target * 1.3;
          const barColor = isOk ? "bg-[#00f0ff]" : "bg-amber-400";

          return (
            <div key={item.muscle} className="flex items-center gap-3 text-xs">
              <span className="w-32 truncate font-medium text-[#94a3b8] text-right">{item.muscle}</span>
              <div className="flex-1 h-2.5 bg-[#0f172a] rounded-full relative overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${widthPct}%` }} />
                <div className="absolute top-0 bottom-0 w-0.5 bg-[#f1f5f9]/60" style={{ left: `${tickPct}%` }} title={`Alvo: ${target}`} />
              </div>
              <span className="w-8 text-right font-bold text-[#f1f5f9] font-mono">{item.direct}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-[11px] text-[#64748b] mt-4 pt-3 border-t border-[#1e293b]">
        <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded bg-[#00f0ff]" /> No alvo</span>
        <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded bg-amber-400" /> Abaixo/Acima</span>
        <span className="flex items-center gap-1.5"><i className="w-0.5 h-3 bg-[#f1f5f9]" /> Alvo ideal</span>
      </div>
    </div>
  );
};

export interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Partial<Client>) => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onSave }) => {
  const [studentPassword, setStudentPassword] = useState<string>('123456');
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    email: '',
    whats: '',
    birth: '',
    gender: 'Feminino',
    tipo: 'Presencial',
    height: '',
    weight: '',
    goal: 'Ganho de massa (hipertrofia)' as TrainingGoal,
    level: 'Intermediário' as ClientLevel,
    days: '4',
    dur: '60 min',
    eq: 'Academia completa' as EquipmentProfile,
    notes: '',
    diseases: [],
    parq: { 0: 'nao', 1: 'nao', 2: 'nao', 3: 'nao', 4: 'nao', 5: 'nao', 6: 'nao' }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const emailToUse = formData.email?.trim() || `${formData.name.toLowerCase().trim().replace(/\s+/g, '.')}@fitconnect.com`;

    onSave({
      ...formData,
      email: emailToUse,
      portal: {
        email: emailToUse,
        enabled: true,
        pass: studentPassword.trim() || '123456'
      }
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cadastrar Novo Aluno">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#00f0ff] mb-3">Dados Pessoais</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#94a3b8] mb-1">Nome Completo *</label>
              <input
                required
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex.: Mariana Fernandes"
                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94a3b8] mb-1">E-mail de Acesso</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="aluno@fitconnect.com"
                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94a3b8] mb-1">Senha de Acesso do Aluno</label>
              <input
                type="text"
                value={studentPassword}
                onChange={e => setStudentPassword(e.target.value)}
                placeholder="Ex: 123456"
                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-[#00f0ff] font-mono font-bold focus:outline-none focus:border-[#00f0ff]"
              />
              <span className="text-[10px] text-[#64748b]">O aluno usará esse e-mail e senha no Portal Aluno.</span>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94a3b8] mb-1">WhatsApp</label>
              <input
                value={formData.whats || ''}
                onChange={e => setFormData({ ...formData, whats: e.target.value })}
                placeholder="(11) 98888-7777"
                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94a3b8] mb-1">Tipo de Atendimento *</label>
              <select
                value={formData.tipo || 'Presencial'}
                onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-[#00f0ff] font-bold focus:outline-none focus:border-[#00f0ff]"
              >
                <option value="Presencial">🏋️ Presencial (Personal / Studio)</option>
                <option value="Consultoria Online">📱 Consultoria Online (Acompanhamento à Distância)</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#00f0ff] mb-3">Perfil de Treino</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#94a3b8] mb-1">Objetivo</label>
              <select
                value={formData.goal}
                onChange={e => setFormData({ ...formData, goal: e.target.value as any })}
                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
              >
                <option>Ganho de massa (hipertrofia)</option>
                <option>Perda de gordura</option>
                <option>Força</option>
                <option>Condicionamento / saúde</option>
                <option>Performance esportiva</option>
                <option>Reabilitação / volta ao treino</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94a3b8] mb-1">Nível</label>
              <select
                value={formData.level}
                onChange={e => setFormData({ ...formData, level: e.target.value as any })}
                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
              >
                <option>Iniciante</option>
                <option>Intermediário</option>
                <option>Avançado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94a3b8] mb-1">Frequência Semanal</label>
              <select
                value={formData.days}
                onChange={e => setFormData({ ...formData, days: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
              >
                <option value="2">2 dias/semana</option>
                <option value="3">3 dias/semana</option>
                <option value="4">4 dias/semana</option>
                <option value="5">5 dias/semana</option>
                <option value="6">6 dias/semana</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#94a3b8] mb-1">Equipamentos</label>
              <select
                value={formData.eq}
                onChange={e => setFormData({ ...formData, eq: e.target.value as any })}
                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
              >
                <option>Academia completa</option>
                <option>Halteres + banco</option>
                <option>Peso corporal</option>
                <option>Funcional / crossfit</option>
                <option>Casa com equipamento mínimo</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#1e293b]">
          <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit">Salvar e Prescrever</Button>
        </div>
      </form>
    </Modal>
  );
};
