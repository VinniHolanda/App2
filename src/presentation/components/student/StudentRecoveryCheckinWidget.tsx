import React, { useState } from 'react';
import { Client } from '../../../domain/types';
import { clientRepository } from '../../../data/repositories/ClientRepository';
import { Moon, Brain, Flame, Activity, CheckCircle2, ShieldAlert, Zap, AlertTriangle, Send } from 'lucide-react';

interface StudentRecoveryCheckinWidgetProps {
  client: Client;
  onCheckinSubmitted?: () => void;
}

export const StudentRecoveryCheckinWidget: React.FC<StudentRecoveryCheckinWidgetProps> = ({
  client,
  onCheckinSubmitted
}) => {
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [stressLevel, setStressLevel] = useState<number>(3); // 1-10
  const [jointPainLevel, setJointPainLevel] = useState<number>(2); // 1-10
  const [energyLevel, setEnergyLevel] = useState<number>(8); // 1-10
  const [selectedJoints, setSelectedJoints] = useState<string[]>([]);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedToday, setSubmittedToday] = useState<boolean>(false);

  const JOINT_OPTIONS = ['Joelho', 'Ombro', 'Lombar', 'Punho/Cotovelo', 'Tornozelo/Pé', 'Pescoço/Trapézio'];

  const toggleJoint = (j: string) => {
    setSelectedJoints(prev =>
      prev.includes(j) ? prev.filter(x => x !== j) : [...prev, j]
    );
  };

  // Calculate readiness score
  const readinessScore = Math.max(10, Math.min(100, Math.round(
    100 -
    (sleepHours < 7 ? (7 - sleepHours) * 12 : 0) -
    (stressLevel > 4 ? (stressLevel - 4) * 8 : 0) -
    (jointPainLevel > 3 ? (jointPainLevel - 3) * 10 : 0) +
    (energyLevel > 5 ? (energyLevel - 5) * 4 : 0)
  )));

  const isHighOvertrainingRisk = readinessScore < 55 || jointPainLevel >= 7 || sleepHours < 5.0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const updatedClient: Client = JSON.parse(JSON.stringify(client));

      // Append to wellness log
      updatedClient.wellnessData = {
        sleep: sleepHours,
        soreness: jointPainLevel,
        stress: stressLevel,
        energy: energyLevel,
        score: readinessScore
      };

      // If overtraining risk, append an alert for trainer
      if (!updatedClient.alerts) updatedClient.alerts = [];
      if (isHighOvertrainingRisk) {
        updatedClient.alerts.unshift({
          id: Date.now().toString(),
          type: 'overtraining_risk',
          date: new Date().toISOString(),
          week: 1,
          level: 'danger',
          title: `⚠️ Alerta de Risco de Overtraining: ${client.name}`,
          msg: `O aluno realizou o Check-in de Recuperação com Readiness de apenas ${readinessScore}%. Sono: ${sleepHours}h, Dor Articular: ${jointPainLevel}/10 (${selectedJoints.join(', ')}), Estresse: ${stressLevel}/10.`,
          message: `O aluno realizou o Check-in de Recuperação com Readiness de apenas ${readinessScore}%. Sono: ${sleepHours}h, Dor Articular: ${jointPainLevel}/10 (${selectedJoints.join(', ')}), Estresse: ${stressLevel}/10.`,
          severity: 'high'
        });
      }

      await clientRepository.saveClient(updatedClient);
      setSubmittedToday(true);
      if (onCheckinSubmitted) onCheckinSubmitted();
    } catch (err) {
      console.error('Error submitting recovery checkin:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl text-[#f1f5f9]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-[#00f0ff] flex items-center gap-1">
              <span>CHECK-IN DIÁRIO</span>
              <span>•</span>
              <span className="text-[#94a3b8]">Recuperação & Biometria</span>
            </div>
            <h3 className="text-base font-black font-display text-white">
              Check-in de Recuperação
            </h3>
          </div>
        </div>

        {/* Readiness Badge */}
        <div className="text-right">
          <span className="text-[10px] text-[#94a3b8] uppercase font-bold block">Índice Estimado</span>
          <span className={`font-mono text-lg font-black ${
            readinessScore >= 80 ? 'text-emerald-400' :
            readinessScore >= 60 ? 'text-[#00f0ff]' :
            readinessScore >= 45 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {readinessScore}% Readiness
          </span>
        </div>
      </div>

      {submittedToday ? (
        <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-4 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h4 className="font-bold text-emerald-300 text-sm">Check-in Registrado com Sucesso!</h4>
          <p className="text-xs text-emerald-200/80">
            Seus dados de sono, estresse e dores articulares foram sincronizados com seu treinador.
          </p>
          {isHighOvertrainingRisk && (
            <div className="mt-2 bg-amber-500/20 border border-amber-500/40 p-2.5 rounded-lg text-xs text-amber-300 font-medium">
              ⚠️ Um alerta de fadiga elevada foi enviado ao seu treinador para adequar seu treino.
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* 1. Sono */}
            <div className="bg-[#080b11] border border-[#1e293b] p-3 rounded-xl space-y-1.5">
              <div className="flex justify-between font-bold text-[#94a3b8]">
                <span className="flex items-center gap-1 text-indigo-400">
                  <Moon className="w-3.5 h-3.5" /> Horas de Sono
                </span>
                <span className="font-mono text-white">{sleepHours}h</span>
              </div>
              <input
                type="range"
                min="3"
                max="11"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(Number(e.target.value))}
                className="w-full accent-indigo-400 cursor-pointer"
              />
            </div>

            {/* 2. Estresse */}
            <div className="bg-[#080b11] border border-[#1e293b] p-3 rounded-xl space-y-1.5">
              <div className="flex justify-between font-bold text-[#94a3b8]">
                <span className="flex items-center gap-1 text-purple-400">
                  <Brain className="w-3.5 h-3.5" /> Estresse / Cansaço
                </span>
                <span className="font-mono text-white">{stressLevel}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={stressLevel}
                onChange={(e) => setStressLevel(Number(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>

            {/* 3. Dores Articulares */}
            <div className="bg-[#080b11] border border-[#1e293b] p-3 rounded-xl space-y-1.5">
              <div className="flex justify-between font-bold text-[#94a3b8]">
                <span className="flex items-center gap-1 text-amber-400">
                  <Flame className="w-3.5 h-3.5" /> Dor Articular / Incômodo
                </span>
                <span className="font-mono text-white">{jointPainLevel}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={jointPainLevel}
                onChange={(e) => setJointPainLevel(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* 4. Energia / Disposição */}
            <div className="bg-[#080b11] border border-[#1e293b] p-3 rounded-xl space-y-1.5">
              <div className="flex justify-between font-bold text-[#94a3b8]">
                <span className="flex items-center gap-1 text-[#00f0ff]">
                  <Zap className="w-3.5 h-3.5" /> Energia Percebida
                </span>
                <span className="font-mono text-white">{energyLevel}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(Number(e.target.value))}
                className="w-full accent-[#00f0ff] cursor-pointer"
              />
            </div>
          </div>

          {/* Joint Selection Chips if pain level > 2 */}
          {jointPainLevel > 2 && (
            <div className="bg-[#080b11] border border-[#1e293b] p-3 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-[#94a3b8] uppercase block">
                Selecione as Articulações ou Zonas com Incômodo:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {JOINT_OPTIONS.map(j => {
                  const isSel = selectedJoints.includes(j);
                  return (
                    <button
                      key={j}
                      type="button"
                      onClick={() => toggleJoint(j)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSel
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-[#1e293b] text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      {j}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Overtraining Risk Alert Preview */}
          {isHighOvertrainingRisk && (
            <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-3 text-xs text-red-300 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Atenção (Zona de Risco de Overtraining):</span> Seus parâmetros atuais apontam fadiga elevada. Ao enviar, um alerta automático será gerado para seu treinador adequar as cargas.
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#00f0ff] hover:bg-[#38bdf8] text-[#080b11] font-black py-3 rounded-xl text-sm shadow-xl shadow-[#00f0ff]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Registrando Check-in...' : 'Enviar Check-in de Recuperação'}</span>
          </button>
        </form>
      )}
    </div>
  );
};
