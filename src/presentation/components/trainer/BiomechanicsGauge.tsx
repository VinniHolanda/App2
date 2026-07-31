import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Activity, ShieldAlert, CheckCircle2, Zap, AlertTriangle, TrendingUp, Dumbbell, Sparkles, HeartPulse, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { Client } from '../../../domain/types';
import { calculatePersonalRecords, calculateWeekStats } from '../../../domain/calculators/loadCalculators';

export interface BiomechanicsGaugeProps {
  client: Client;
  className?: string;
}

export function calculateBiomechanicsProficiency(client: Client) {
  const rpeLogs = client.rpeLog || [];
  const sessionCount = rpeLogs.length;
  const prs = calculatePersonalRecords(rpeLogs);
  const prCount = Object.keys(prs).length;
  const weekStats = calculateWeekStats(rpeLogs);

  // 1. Injury & Recovery Score (Max 35)
  const injText = (client.inj || '').toLowerCase().trim();
  let injuryRecoveryScore = 35;
  let injuryStatus: 'Excelente' | 'Em Adaptação' | 'Atenção Requerida' = 'Excelente';

  if (!injText || injText === 'nenhuma' || injText === 'sem lesões' || injText === 'nenhum') {
    injuryRecoveryScore = 35;
    injuryStatus = 'Excelente';
  } else if (injText.includes('cirurgia') || injText.includes('hérnia') || injText.includes('aguda') || injText.includes('rotura')) {
    injuryRecoveryScore = 20;
    injuryStatus = 'Atenção Requerida';
  } else {
    // Minor or past injury (e.g., joelho, ombro, leve)
    injuryRecoveryScore = 27;
    injuryStatus = 'Em Adaptação';
  }

  // Adjust injury score if sessions are consistently logged with safe sRPE (<8.5)
  if (sessionCount > 3 && weekStats && weekStats.meanSRPE > 0 && weekStats.meanSRPE <= 8) {
    injuryRecoveryScore = Math.min(35, injuryRecoveryScore + 4);
  }

  // 2. Movement Quality & Consistency Score (Max 35)
  const programDays = client.program?.days || [];
  const totalExercises = programDays.flatMap(d => d.exercises || []).length;
  const baseConsistency = Math.min(20, sessionCount * 4);
  const exerciseDiversityBonus = Math.min(15, totalExercises * 2);
  const movementQualityScore = Math.min(35, baseConsistency + exerciseDiversityBonus);

  // 3. Load Control & Neuromuscular Efficiency (Max 30)
  let loadControlScore = 15; // default base
  if (prCount > 0) {
    loadControlScore += Math.min(10, prCount * 2.5);
  }
  
  if (weekStats?.monotony && weekStats.monotony < 2.0) {
    loadControlScore += 5; // Healthy variance in load
  } else if (weekStats?.monotony && weekStats.monotony >= 2.5) {
    loadControlScore -= 3; // Risk of overuse
  }

  loadControlScore = Math.min(30, Math.max(5, loadControlScore));

  // Total Score (0 - 100)
  const totalScore = Math.round(movementQualityScore + injuryRecoveryScore + loadControlScore);

  // Level classification
  let levelLabel = 'Proficiência Elevada';
  let levelColor = '#00f0ff'; // FitConnect Lime
  let badgeText = 'Nível Atleta Pro';

  if (totalScore >= 85) {
    levelLabel = 'Biomecânica de Elite';
    levelColor = '#00f0ff';
    badgeText = 'Sincronia Perfeita';
  } else if (totalScore >= 70) {
    levelLabel = 'Consistente & Estável';
    levelColor = '#38bdf8'; // Sky blue
    badgeText = 'Boa Técnica';
  } else if (totalScore >= 50) {
    levelLabel = 'Em Desenvolvimento';
    levelColor = '#fbbf24'; // Amber
    badgeText = 'Adaptação Requerida';
  } else {
    levelLabel = 'Atenção Prioritária';
    levelColor = '#f87171'; // Red
    badgeText = 'Risco Técnico';
  }

  // Generate actionable insights
  const insights: string[] = [];
  if (injuryStatus !== 'Excelente') {
    insights.push(`Anamnese indica: "${client.inj}". Manter controle rigoroso de RPE nos exercícios com sobrecarga axial.`);
  } else {
    insights.push('Sem limitações articulares ativas detectadas na anamnese.');
  }

  if (prCount > 0) {
    insights.push(`${prCount} recordes pessoais registrados indicam boa progressão de recrutamento motor.`);
  } else {
    insights.push('Registre mais séries com carga para calibrar as métricas de 1RM e eficácia de força.');
  }

  if (weekStats?.monotony && weekStats.monotony >= 2.0) {
    insights.push('⚠️ Índice de Monotonia alto (> 2.0). Alterne intensidades para reduzir o estresse articular.');
  }

  return {
    totalScore,
    levelLabel,
    levelColor,
    badgeText,
    movementQualityScore,
    injuryRecoveryScore,
    loadControlScore,
    injuryStatus,
    insights,
    sessionCount,
    prCount
  };
}

export const BiomechanicsGauge: React.FC<BiomechanicsGaugeProps> = ({ client, className = '' }) => {
  const [showDetails, setShowDetails] = useState(false);
  const data = calculateBiomechanicsProficiency(client);

  // Gauge SVG Math (Semi-circle or 220 degree arc)
  const radius = 60;
  const strokeWidth = 10;
  const circumference = Math.PI * radius; // for semi-circle
  const strokeDashoffset = circumference - (data.totalScore / 100) * circumference;

  return (
    <div className={`bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-xl relative overflow-hidden ${className}`}>
      {/* Background Accent glow */}
      <div 
        className="absolute top-0 right-0 w-48 h-48 rounded-full filter blur-3xl opacity-10 pointer-events-none transition-colors duration-500"
        style={{ backgroundColor: data.levelColor }}
      />

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        {/* Gauge Arc Visual */}
        <div className="flex flex-col items-center justify-center relative shrink-0">
          <div className="relative w-36 h-24 flex items-center justify-center overflow-hidden">
            <svg className="w-36 h-36 transform -rotate-180 -translate-y-6 overflow-visible">
              {/* Background Track Arc */}
              <path
                d="M 18,72 A 54,54 0 0,1 126,72"
                fill="none"
                stroke="#1e293b"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
              {/* Animated Score Arc */}
              <motion.path
                d="M 18,72 A 54,54 0 0,1 126,72"
                fill="none"
                stroke={data.levelColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>

            {/* Score Display Center */}
            <div className="absolute bottom-1 text-center flex flex-col items-center">
              <motion.span 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="font-display font-black text-3xl text-[#f1f5f9] tracking-tight leading-none"
              >
                {data.totalScore}
              </motion.span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mt-0.5">
                / 100 PTS
              </span>
            </div>
          </div>

          <div 
            className="mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm flex items-center gap-1"
            style={{ 
              backgroundColor: `${data.levelColor}15`, 
              color: data.levelColor,
              borderColor: `${data.levelColor}30`
            }}
          >
            <Sparkles className="w-3 h-3" />
            {data.badgeText}
          </div>
        </div>

        {/* Info & Breakdown Bars */}
        <div className="flex-1 space-y-3 w-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-[#00f0ff]" />
                Índice de Proficiência Biomecânica
              </span>
              <span 
                className="text-xs font-extrabold"
                style={{ color: data.levelColor }}
              >
                {data.levelLabel}
              </span>
            </div>
            <p className="text-xs text-[#64748b] mt-1">
              Pontuação dinâmica calculada a partir de padrão motor, reabilitação de lesões e regulação de carga.
            </p>
          </div>

          {/* Mini Sub-metrics */}
          <div className="space-y-2 pt-1">
            {/* 1. Quality & Consistency */}
            <div>
              <div className="flex justify-between text-[11px] font-bold mb-1">
                <span className="text-[#f1f5f9] flex items-center gap-1">
                  <Dumbbell className="w-3 h-3 text-[#00f0ff]" /> Qualidade do Movimento & Padrão
                </span>
                <span className="font-mono text-[#00f0ff]">{data.movementQualityScore} / 35</span>
              </div>
              <div className="w-full bg-[#0f172a] h-1.5 rounded-full overflow-hidden border border-[#1e293b]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(data.movementQualityScore / 35) * 100}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full bg-[#00f0ff] rounded-full"
                />
              </div>
            </div>

            {/* 2. Injury & Joint Health */}
            <div>
              <div className="flex justify-between text-[11px] font-bold mb-1">
                <span className="text-[#f1f5f9] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#38bdf8]" /> Saúde Articular & Reabilitação
                </span>
                <span className="font-mono text-[#38bdf8]">{data.injuryRecoveryScore} / 35</span>
              </div>
              <div className="w-full bg-[#0f172a] h-1.5 rounded-full overflow-hidden border border-[#1e293b]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(data.injuryRecoveryScore / 35) * 100}%` }}
                  transition={{ duration: 1, delay: 0.4 }}
                  className="h-full bg-[#38bdf8] rounded-full"
                />
              </div>
            </div>

            {/* 3. Load & Neuromuscular Control */}
            <div>
              <div className="flex justify-between text-[11px] font-bold mb-1">
                <span className="text-[#f1f5f9] flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#fbbf24]" /> Controle de Carga & Eficiência
                </span>
                <span className="font-mono text-[#fbbf24]">{data.loadControlScore} / 30</span>
              </div>
              <div className="w-full bg-[#0f172a] h-1.5 rounded-full overflow-hidden border border-[#1e293b]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(data.loadControlScore / 30) * 100}%` }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className="h-full bg-[#fbbf24] rounded-full"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] font-bold text-[#00f0ff] hover:underline flex items-center gap-1 pt-1"
          >
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showDetails ? 'Ocultar Diagnóstico Detalhado' : 'Ver Diagnóstico Biomecânico & Recomendações'}
          </button>
        </div>
      </div>

      {/* Expanded Diagnostic Section */}
      {showDetails && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-[#1e293b] space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#0f172a] p-3 rounded-xl border border-[#1e293b]">
              <span className="text-[10px] font-bold uppercase text-[#64748b] block mb-1">Status de Lesões & Anamnese</span>
              <div className="text-xs font-bold text-[#f1f5f9] flex items-center gap-1.5">
                {data.injuryStatus === 'Excelente' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00f0ff]" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                )}
                {data.injuryStatus}
              </div>
              <p className="text-[11px] text-[#94a3b8] mt-1">
                {client.inj ? `Registro: "${client.inj}"` : 'Sem registros de limitações ativas.'}
              </p>
            </div>

            <div className="bg-[#0f172a] p-3 rounded-xl border border-[#1e293b]">
              <span className="text-[10px] font-bold uppercase text-[#64748b] block mb-1">Histórico de Treinos & Recordes</span>
              <div className="text-xs font-bold text-[#f1f5f9] flex items-center gap-2">
                <span>{data.sessionCount} sessões efetuadas</span>
                <span>•</span>
                <span className="text-[#00f0ff]">{data.prCount} PRs registrados</span>
              </div>
              <p className="text-[11px] text-[#94a3b8] mt-1">
                Base sólida para ajustes de volume por grupo muscular (MEV/MAV).
              </p>
            </div>
          </div>

          <div className="bg-[#0f172a] p-3.5 rounded-xl border border-[#1e293b] space-y-2">
            <span className="text-[10px] font-bold uppercase text-[#00f0ff] tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Recomendações FitConnect Engine
            </span>
            <ul className="space-y-1.5">
              {data.insights.map((insight, idx) => (
                <li key={idx} className="text-xs text-[#f1f5f9] flex items-start gap-2">
                  <span className="text-[#00f0ff] font-bold">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  );
}
