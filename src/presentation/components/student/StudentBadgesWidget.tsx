import React, { useMemo } from 'react';
import { Client } from '../../../domain/types';
import { calculatePersonalRecords } from '../../../domain/calculators/loadCalculators';
import { 
  Trophy, Flame, Award, Dumbbell, Target, Zap, ShieldCheck, 
  Sparkles, CheckCircle2, Lock, Star, Crown, Heart, Medal
} from 'lucide-react';
import { motion } from 'motion/react';

interface StudentBadgesWidgetProps {
  client: Client;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  category: 'frequencia' | 'volume' | 'consistencia' | 'conquista';
  icon: any;
  unlocked: boolean;
  progress: number; // 0 to 100
  currentValLabel: string;
  targetValLabel: string;
  badgeTier: 'bronze' | 'prata' | 'ouro' | 'diamante';
  unlockedAt?: string;
}

export const StudentBadgesWidget: React.FC<StudentBadgesWidgetProps> = ({ client }) => {
  const rpeLogs = client.rpeLog || [];
  const bookings = client.classBookings || [];

  // Total completed sessions (Workouts + Realized Class Bookings)
  const totalCompletedSessions = useMemo(() => {
    const workoutDates = new Set(rpeLogs.map(s => s.date));
    let total = rpeLogs.length;
    
    // Add completed bookings if not already in rpeLog
    bookings.forEach(b => {
      if (b.status === 'realizada' && !workoutDates.has(b.date)) {
        total += 1;
      }
    });

    return total;
  }, [rpeLogs, bookings]);

  // Max Tonnage in a single workout session
  const maxSingleSessionTonnage = useMemo(() => {
    if (rpeLogs.length === 0) return 0;
    return Math.max(...rpeLogs.map(s => s.totalTonnage || 0));
  }, [rpeLogs]);

  // Lifetime Cumulative Tonnage
  const lifetimeTonnage = useMemo(() => {
    return rpeLogs.reduce((acc, s) => acc + (s.totalTonnage || 0), 0);
  }, [rpeLogs]);

  // Total PRs broken
  const prsCount = useMemo(() => {
    const prs = calculatePersonalRecords(rpeLogs);
    return prs.length;
  }, [rpeLogs]);

  // Current Month Attendance vs Target Goal
  const monthlyGoalProgress = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const target = client.targetMonthlyClasses || (typeof client.days === 'number' ? client.days * 4 : 12);
    
    let count = 0;
    rpeLogs.forEach(s => {
      if (s.date && s.date.startsWith(currentMonthKey)) count++;
    });
    bookings.forEach(b => {
      if (b.status === 'realizada' && b.date && b.date.startsWith(currentMonthKey)) count++;
    });

    return {
      current: count,
      target,
      completed: count >= target
    };
  }, [rpeLogs, bookings, client.targetMonthlyClasses, client.days]);

  // Calculate Streak of consecutive active weeks
  const currentStreakWeeks = useMemo(() => {
    if (rpeLogs.length === 0 && bookings.length === 0) return 0;

    // Collect all active dates sorted
    const activeDates = new Set<string>();
    rpeLogs.forEach(s => s.date && activeDates.add(s.date));
    bookings.forEach(b => b.status === 'realizada' && b.date && activeDates.add(b.date));

    if (activeDates.size === 0) return 0;

    // Group active dates by year-week number
    const weeksSet = new Set<string>();
    activeDates.forEach(dateStr => {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        // Simple week number approximation
        const firstDayOfYear = new Date(year, 0, 1);
        const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        weeksSet.add(`${year}-W${weekNum}`);
      }
    });

    return weeksSet.size;
  }, [rpeLogs, bookings]);

  // Build Badges List
  const badges = useMemo<BadgeDefinition[]>(() => {
    return [
      {
        id: 'session-5',
        title: 'Primeiros Passos',
        description: 'Complete 5 sessões de treino no estúdio',
        category: 'frequencia',
        icon: Star,
        unlocked: totalCompletedSessions >= 5,
        progress: Math.min(100, Math.round((totalCompletedSessions / 5) * 100)),
        currentValLabel: `${totalCompletedSessions}`,
        targetValLabel: '5 treinos',
        badgeTier: 'bronze'
      },
      {
        id: 'session-15',
        title: 'Ritmo de Ferro',
        description: 'Alcance o marco de 15 treinos registrados',
        category: 'frequencia',
        icon: ShieldCheck,
        unlocked: totalCompletedSessions >= 15,
        progress: Math.min(100, Math.round((totalCompletedSessions / 15) * 100)),
        currentValLabel: `${totalCompletedSessions}`,
        targetValLabel: '15 treinos',
        badgeTier: 'prata'
      },
      {
        id: 'session-30',
        title: 'Mestre do Hábito',
        description: 'Complete 30 sessões e consolide sua rotina',
        category: 'frequencia',
        icon: Award,
        unlocked: totalCompletedSessions >= 30,
        progress: Math.min(100, Math.round((totalCompletedSessions / 30) * 100)),
        currentValLabel: `${totalCompletedSessions}`,
        targetValLabel: '30 treinos',
        badgeTier: 'ouro'
      },
      {
        id: 'session-50',
        title: 'Lenda Kinetix',
        description: 'Alcance a incrível marca de 50 treinos no estúdio',
        category: 'frequencia',
        icon: Crown,
        unlocked: totalCompletedSessions >= 50,
        progress: Math.min(100, Math.round((totalCompletedSessions / 50) * 100)),
        currentValLabel: `${totalCompletedSessions}`,
        targetValLabel: '50 treinos',
        badgeTier: 'diamante'
      },
      {
        id: 'month-goal',
        title: 'Meta do Mês Atingida',
        description: `Cumpra a meta de ${monthlyGoalProgress.target} aulas neste mês`,
        category: 'consistencia',
        icon: Target,
        unlocked: monthlyGoalProgress.completed,
        progress: Math.min(100, Math.round((monthlyGoalProgress.current / monthlyGoalProgress.target) * 100)),
        currentValLabel: `${monthlyGoalProgress.current}`,
        targetValLabel: `${monthlyGoalProgress.target} aulas`,
        badgeTier: 'ouro'
      },
      {
        id: 'tonnage-1k',
        title: 'Clube de 1 Tonelada',
        description: 'Levante mais de 1.000 kg acumulados em um único treino',
        category: 'volume',
        icon: Dumbbell,
        unlocked: maxSingleSessionTonnage >= 1000,
        progress: Math.min(100, Math.round((maxSingleSessionTonnage / 1000) * 100)),
        currentValLabel: `${Math.round(maxSingleSessionTonnage)} kg`,
        targetValLabel: '1.000 kg/treino',
        badgeTier: 'bronze'
      },
      {
        id: 'tonnage-5k',
        title: 'Força Titan',
        description: 'Mova mais de 5.000 kg de volume acumulado em um único treino',
        category: 'volume',
        icon: Zap,
        unlocked: maxSingleSessionTonnage >= 5000,
        progress: Math.min(100, Math.round((maxSingleSessionTonnage / 5000) * 100)),
        currentValLabel: `${Math.round(maxSingleSessionTonnage)} kg`,
        targetValLabel: '5.000 kg/treino',
        badgeTier: 'ouro'
      },
      {
        id: 'pr-breaker',
        title: 'Destruidor de Recordes',
        description: 'Alcance 3 ou mais Recordes Pessoais de carga nos treinos',
        category: 'conquista',
        icon: Trophy,
        unlocked: prsCount >= 3,
        progress: Math.min(100, Math.round((prsCount / 3) * 100)),
        currentValLabel: `${prsCount}`,
        targetValLabel: '3 PRs',
        badgeTier: 'prata'
      },
      {
        id: 'streak-4w',
        title: 'Chama Olímpica',
        description: 'Mantenha consistência de treinos por 4 semanas seguidas',
        category: 'consistencia',
        icon: Flame,
        unlocked: currentStreakWeeks >= 4,
        progress: Math.min(100, Math.round((currentStreakWeeks / 4) * 100)),
        currentValLabel: `${currentStreakWeeks}`,
        targetValLabel: '4 semanas',
        badgeTier: 'ouro'
      }
    ];
  }, [totalCompletedSessions, maxSingleSessionTonnage, prsCount, monthlyGoalProgress, currentStreakWeeks]);

  const totalUnlocked = badges.filter(b => b.unlocked).length;

  // Tier color mapper
  const getTierColors = (tier: BadgeDefinition['badgeTier'], unlocked: boolean) => {
    if (!unlocked) {
      return {
        bg: 'bg-[#080b11]/80 border-[#1e293b]',
        badgeBg: 'bg-[#1e293b]/40 text-[#64748b]',
        text: 'text-[#64748b]',
        iconColor: 'text-[#64748b]'
      };
    }

    switch (tier) {
      case 'bronze':
        return {
          bg: 'bg-gradient-to-br from-[#1e1a17] to-[#0f172a] border-amber-800/40 shadow-amber-900/10',
          badgeBg: 'bg-amber-900/30 text-amber-300 border-amber-700/50',
          text: 'text-amber-200',
          iconColor: 'text-amber-400'
        };
      case 'prata':
        return {
          bg: 'bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-slate-500/40 shadow-slate-500/10',
          badgeBg: 'bg-slate-700/40 text-slate-200 border-slate-500/50',
          text: 'text-slate-100',
          iconColor: 'text-slate-200'
        };
      case 'ouro':
        return {
          bg: 'bg-gradient-to-br from-[#2a220a] to-[#0f172a] border-yellow-500/40 shadow-yellow-500/20',
          badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
          text: 'text-yellow-200',
          iconColor: 'text-yellow-400'
        };
      case 'diamante':
        return {
          bg: 'bg-gradient-to-br from-[#082238] to-[#0f172a] border-[#00f0ff]/40 shadow-[#00f0ff]/20',
          badgeBg: 'bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff]/50',
          text: 'text-[#f1f5f9]',
          iconColor: 'text-[#00f0ff]'
        };
    }
  };

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-5 shadow-xl animate-fade-in">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-600/20 text-yellow-400 border border-yellow-500/30 shadow-md shadow-yellow-500/10">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base text-[#f1f5f9] flex items-center gap-2">
              <span>Conquistas & Medalhas Kinetix</span>
              <span className="bg-[#00f0ff]/10 text-[#00f0ff] text-xs font-mono font-bold px-2 py-0.5 rounded-full border border-[#00f0ff]/30">
                {totalUnlocked} / {badges.length}
              </span>
            </h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Ganhe reconhecimento ao manter a assiduidade e superar marcos de carga
            </p>
          </div>
        </div>

        {/* Global Progress */}
        <div className="flex items-center gap-2">
          <div className="w-28 bg-[#080b11] h-2.5 rounded-full overflow-hidden border border-[#1e293b]">
            <div 
              className="bg-gradient-to-r from-yellow-500 to-[#00f0ff] h-full rounded-full transition-all duration-700" 
              style={{ width: `${Math.round((totalUnlocked / badges.length) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-[#f1f5f9]">
            {Math.round((totalUnlocked / badges.length) * 100)}%
          </span>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {badges.map((badge, idx) => {
          const Icon = badge.icon;
          const styles = getTierColors(badge.badgeTier, badge.unlocked);

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`border rounded-2xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden transition-all shadow-md ${styles.bg}`}
            >
              {/* Unlocked Sparkle Effect */}
              {badge.unlocked && (
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-white/5 rounded-full blur-xl pointer-events-none" />
              )}

              {/* Badge Top Header */}
              <div className="flex items-start justify-between gap-2">
                <div className={`p-2.5 rounded-xl border flex items-center justify-center ${styles.badgeBg}`}>
                  {badge.unlocked ? (
                    <Icon className={`w-5 h-5 ${styles.iconColor}`} />
                  ) : (
                    <Lock className="w-4 h-4 text-[#64748b]" />
                  )}
                </div>

                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${styles.badgeBg}`}>
                  {badge.badgeTier}
                </span>
              </div>

              {/* Badge Details */}
              <div className="space-y-1">
                <h4 className={`font-display font-bold text-sm flex items-center gap-1.5 ${styles.text}`}>
                  <span>{badge.title}</span>
                  {badge.unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </h4>
                <p className="text-[11px] text-[#94a3b8] leading-tight">
                  {badge.description}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1 pt-1 border-t border-[#1e293b]/50">
                <div className="flex justify-between text-[10px] font-mono font-bold text-[#94a3b8]">
                  <span>{badge.unlocked ? 'Conquistado!' : `${badge.currentValLabel} / ${badge.targetValLabel}`}</span>
                  <span>{badge.progress}%</span>
                </div>
                <div className="w-full bg-[#080b11] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      badge.unlocked ? 'bg-emerald-400' : 'bg-[#00f0ff]/60'
                    }`}
                    style={{ width: `${badge.progress}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
