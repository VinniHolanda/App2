import React, { useState, useEffect } from 'react';
import { Client } from '../../../domain/types';
import { Sparkles, Brain, AlertTriangle, CheckCircle2, RefreshCw, Lightbulb, TrendingUp, ShieldAlert, Zap } from 'lucide-react';

interface TrendAnalysisWidgetProps {
  client: Client;
  monthlySummary: {
    completed: number;
    absences: number;
    avgMonthly: string;
    trend: 'alta' | 'estavel' | 'queda' | 'critico';
  };
}

export const TrendAnalysisWidget: React.FC<TrendAnalysisWidgetProps> = ({ client, monthlySummary }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [statusTag, setStatusTag] = useState<{ label: string; color: string; icon: any }>({
    label: 'Analisando...',
    color: 'text-[#00f0ff] bg-[#00f0ff]/10 border-[#00f0ff]/30',
    icon: Brain,
  });

  // Calculate local adherence heuristics for quick initial feedback
  const totalClasses = monthlySummary.completed + monthlySummary.absences;
  const adherenceRate = totalClasses > 0 ? Math.round((monthlySummary.completed / totalClasses) * 100) : 100;

  useEffect(() => {
    // Determine status badge
    if (adherenceRate >= 85) {
      setStatusTag({
        label: 'Aderência Excelente (≥85%)',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        icon: CheckCircle2,
      });
    } else if (adherenceRate >= 65) {
      setStatusTag({
        label: 'Aderência Moderada / Atenção',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        icon: AlertTriangle,
      });
    } else {
      setStatusTag({
        label: 'Risco de Desistência / Dropout',
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        icon: ShieldAlert,
      });
    }

    // Auto-generate AI insights on load
    fetchAiAnalysis();
  }, [client.id, monthlySummary.completed, monthlySummary.absences]);

  const fetchAiAnalysis = async () => {
    setLoading(true);
    try {
      const promptData = {
        aluno: client.name,
        objetivo: client.goal || 'Condicionamento Geral',
        frequenciaPrescrita: `${client.days || 3}x por semana`,
        tipoAtendimento: client.tipo || 'Presencial',
        aulasRealizadas: monthlySummary.completed,
        faltasRegistradas: monthlySummary.absences,
        taxaAderencia: `${adherenceRate}%`,
        mediaMensal: monthlySummary.avgMonthly,
        historicoRecente: client.rpeLog?.slice(-5).map(s => ({ data: s.date, treino: s.dayName, srpe: s.srpe })) || []
      };

      const systemInstruction = `Você é o Kinetix AI, especialista sênior em Psicologia do Esporte, Retenção de Clientes em Personal Training e Ciência da Aderência ao Exercício.
Análise os dados de frequência do aluno e responda de forma sucinta, objetiva e estruturada em Português (Brasil).

Estrutura da resposta desejada (máximo 150 palavras, direto ao ponto):
1. **Diagnóstico de Tendência**: Avaliação da assiduidade e consistência nos últimos meses.
2. **Alertas de Risco**: Fatores de risco de perda de hábitos ou cancelamento (se houver).
3. **Recomendações Práticas ao Personal**: 2 a 3 ações proativas imediatas (ex: reajuste de horários, mensagem motivacional específica, meta intermediária ou reposição guiada).`;

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-3.6-flash',
          systemInstruction,
          messages: [
            {
              role: 'user',
              content: `Gere uma Análise de Tendências de Aderência e Recomendações Proativas para o personal trainer do aluno com base nos dados:\n${JSON.stringify(promptData, null, 2)}`
            }
          ]
        })
      });

      if (!response.ok) throw new Error('Falha na requisição AI');

      const data = await response.json();
      setAnalysisText(data.reply);
    } catch (err) {
      console.error('Erro ao gerar análise AI:', err);
      // Fallback response if API call fails
      setAnalysisText(
        `**Diagnóstico de Tendência**: O aluno ${client.name} possui uma taxa de aderência estimada em ${adherenceRate}% com ${monthlySummary.completed} aulas realizadas e ${monthlySummary.absences} faltas.\n\n` +
        `**Alertas de Risco**: ${adherenceRate < 70 ? 'Atenção redobrada para quebras na rotina e acúmulo de faltas.' : 'Manutenção do hábito positiva, sem alertas críticos imediatos.'}\n\n` +
        `**Recomendações Práticas ao Personal**:\n` +
        `• Acompanhar a distribuição dos treinos durante a semana para evitar espaçamentos superiores a 72h.\n` +
        `• Realizar check-in motivacional antes das sessoes de maior índice de absenteísmo.\n` +
        `• Validar se a carga perceptual (sRPE) atual está alinhada ao nível de recuperação do aluno.`
      );
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = statusTag.icon;

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between animate-fade-in">
      {/* Widget Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-[#1e293b] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-display font-extrabold text-sm text-[#f1f5f9]">Análise de Tendências IA</h4>
              <p className="text-[11px] text-[#94a3b8]">Interpretação preditiva de aderência & retenção</p>
            </div>
          </div>

          <button
            onClick={fetchAiAnalysis}
            disabled={loading}
            className="p-1.5 rounded-lg bg-[#080b11] border border-[#1e293b] text-[#94a3b8] hover:text-[#00f0ff] hover:border-[#00f0ff]/40 transition-all disabled:opacity-50"
            title="Atualizar análise IA"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#00f0ff]' : ''}`} />
          </button>
        </div>

        {/* Status Badge */}
        <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-xl text-xs font-bold ${statusTag.color}`}>
          <StatusIcon className="w-4 h-4 shrink-0" />
          <span>{statusTag.label}</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="my-2 min-h-[160px] flex flex-col justify-center">
        {loading ? (
          <div className="space-y-3 py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-[#00f0ff] font-bold">
              <Zap className="w-4 h-4 animate-pulse" />
              <span>Processando métricas de assiduidade com Gemini AI...</span>
            </div>
            <div className="w-full bg-[#080b11] h-2 rounded-full overflow-hidden">
              <div className="bg-[#00f0ff] h-full w-2/3 animate-pulse rounded-full"></div>
            </div>
          </div>
        ) : analysisText ? (
          <div className="text-xs text-[#cbd5e1] space-y-2.5 leading-relaxed bg-[#080b11] border border-[#1e293b] rounded-xl p-3.5 font-sans">
            {analysisText.split('\n\n').map((paragraph, idx) => {
              const formatted = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#f1f5f9]">$1</strong>');
              return (
                <p 
                  key={idx} 
                  dangerouslySetInnerHTML={{ __html: formatted }}
                  className="last:mb-0"
                />
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Bottom Proactive Tip Footer */}
      <div className="bg-[#00f0ff]/5 border border-[#00f0ff]/20 rounded-xl p-3 flex items-start gap-2 text-[11px] text-[#00f0ff]">
        <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          <strong>Dica Kinetix:</strong> Alunos com taxa de assiduidade em queda têm 3x mais chance de evasão nos primeiros 60 dias. Use as recomendações para engajar proativamente.
        </span>
      </div>
    </div>
  );
};
