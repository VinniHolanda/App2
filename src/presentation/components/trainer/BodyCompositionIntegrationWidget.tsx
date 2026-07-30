import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Client, BioimpedanceRecord } from '../../../domain/types';
import { evaluateBodyCompositionProgress } from '../../../domain/engine/prescriptionEngine';
import { Button, Badge, Modal } from '../ui/Primitives';
import {
  Activity,
  Upload,
  FileText,
  Sparkles,
  TrendingUp,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Zap,
  Scale,
  Award,
  ChevronRight,
  Info,
  Loader2,
  FileSpreadsheet,
  Flame,
  ShieldCheck,
  Edit3
} from 'lucide-react';

interface BodyCompositionIntegrationWidgetProps {
  client: Client;
  onUpdateClient: (updatedData: Partial<Client>) => void;
}

export const BodyCompositionIntegrationWidget: React.FC<BodyCompositionIntegrationWidgetProps> = ({
  client,
  onUpdateClient
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Manual / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<BioimpedanceRecord> | null>(null);

  // Active view toggle
  const [activeView, setActiveView] = useState<'grafico' | 'laudos' | 'insights'>('grafico');

  // Compute calculated adherence per week if available from rpeLog
  const calculatedAdherenceByWeek = useMemo(() => {
    if (!client.rpeLog || client.rpeLog.length === 0) return {};
    const weekCountMap: Record<number, number> = {};
    const targetDaysPerWeek = Number(client.days) || 4;

    client.rpeLog.forEach(s => {
      const w = s.week ?? 1;
      weekCountMap[w] = (weekCountMap[w] || 0) + 1;
    });

    const result: Record<number, number> = {};
    Object.keys(weekCountMap).forEach(k => {
      const wNum = Number(k);
      const done = weekCountMap[wNum];
      result[wNum] = Math.min(100, Math.round((done / targetDaysPerWeek) * 100));
    });
    return result;
  }, [client.rpeLog, client.days]);

  // Prepared bioimpedance history sorted chronologically
  const bioHistory = useMemo(() => {
    const list = client.bodyCompositionHistory ? [...client.bodyCompositionHistory] : [];
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [client.bodyCompositionHistory]);

  // Latest vs Initial stats
  const statsSummary = useMemo(() => {
    if (bioHistory.length === 0) {
      return {
        initialLean: 0,
        latestLean: Number(client.weight) ? Number(client.weight) * 0.75 : 50,
        diffLean: 0,
        initialFat: 0,
        latestFat: 20,
        diffFat: 0,
        avgAdherence: 85,
        latestWeight: Number(client.weight) || 70,
        latestDate: 'Sem registros'
      };
    }

    const first = bioHistory[0];
    const latest = bioHistory[bioHistory.length - 1];

    const diffLean = Number((latest.leanMassKg - first.leanMassKg).toFixed(1));
    const diffFat = Number((latest.fatPercentage - first.fatPercentage).toFixed(1));

    const totalAdherence = bioHistory.reduce((acc, curr) => acc + (curr.adherenceRatePct || 85), 0);
    const avgAdherence = Math.round(totalAdherence / bioHistory.length);

    return {
      initialLean: first.leanMassKg,
      latestLean: latest.leanMassKg,
      diffLean,
      initialFat: first.fatPercentage,
      latestFat: latest.fatPercentage,
      diffFat,
      avgAdherence,
      latestWeight: latest.weightKg,
      latestDate: latest.date
    };
  }, [bioHistory, client.weight]);

  // Prescription Engine evaluation rule for bioimpedance progress
  const prescriptionAnalysis = useMemo(() => {
    return evaluateBodyCompositionProgress(client);
  }, [client]);

  const [adjustedSuccessMsg, setAdjustedSuccessMsg] = useState<string | null>(null);

  const handleApplyPrescriptionVolumeAdjust = () => {
    const updatedClient = JSON.parse(JSON.stringify(client));
    if (updatedClient.program && updatedClient.program.meso && updatedClient.program.meso.weeks) {
      updatedClient.program.meso.weeks = updatedClient.program.meso.weeks.map((w: any) => ({
        ...w,
        vol: Math.round((w.vol * 1.15) * 100) / 100,
        f: w.f?.includes('Ajuste IA Bioimpedância') ? w.f : `${w.f} (+15% Vol. IA Bioimpedância)`
      }));
    }

    const adjustNote = `\n⚡ [${new Date().toLocaleDateString('pt-BR')}] Ajuste Automático do Motor de Prescrição: Meta de volume readequada em +15% de séries semanais devido à estagnação de massa magra detectada no laudo de bioimpedância.`;
    updatedClient.notes = (updatedClient.notes || '') + adjustNote;

    onUpdateClient(updatedClient);
    setAdjustedSuccessMsg('Meta de volume do mesociclo ajustada com sucesso (+15% de séries semanais aplicadas)!');
  };

  // Format data for Recharts chart
  const chartData = useMemo(() => {
    if (bioHistory.length === 0) return [];

    const baseProgramSets = client.program?.days?.reduce((acc, d) => {
      return acc + (d.exercises?.reduce((sum, ex) => sum + (Number(ex.sets) || 3), 0) || 0);
    }, 0) || 16;

    const mesoWeeks = client.program?.meso?.weeks || [];

    return bioHistory.map((rec, idx) => {
      const weekNum = rec.weekNumber || idx + 1;
      const realAdherence = calculatedAdherenceByWeek[weekNum] ?? rec.adherenceRatePct ?? 85;
      const mesoFactor = mesoWeeks[weekNum - 1]?.vol || (1 + idx * 0.05);
      const estimatedWeeklySets = Math.round(baseProgramSets * mesoFactor);

      return {
        semanaLabel: `Sem. ${weekNum}`,
        dateStr: rec.date,
        massaMagraKg: rec.leanMassKg,
        massaGordaKg: rec.fatMassKg,
        gorduraPct: rec.fatPercentage,
        pesoKg: rec.weightKg,
        adesaoPct: realAdherence,
        volumeSeries: estimatedWeeklySets,
        fileName: rec.sourceFileName
      };
    });
  }, [bioHistory, calculatedAdherenceByWeek, client.program]);

  // Handle file drop/select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setParseError(null);

    // Create image preview if image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  // Trigger AI Parse via Express endpoint
  const handleParseFileWithAI = async () => {
    if (!selectedFile) return;

    setIsParsing(true);
    setParseError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);

      reader.onloadend = async () => {
        const base64String = reader.result as string;

        const response = await fetch('/api/parse-bioimpedance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64String,
            mimeType: selectedFile.type || 'image/jpeg',
            fileName: selectedFile.name
          })
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          throw new Error(errJson.error || 'Erro ao processar laudo de bioimpedância.');
        }

        const resData = await response.json();
        const parsed = resData.data || {};

        // Calculate week number based on existing records
        const nextWeek = bioHistory.length + 1;

        const newRec: Partial<BioimpedanceRecord> = {
          id: `bio-${Date.now()}`,
          date: parsed.date || new Date().toISOString().split('T')[0],
          weekNumber: nextWeek,
          weightKg: Number(parsed.weightKg) || Number(client.weight) || 70,
          heightCm: Number(parsed.heightCm) || Number(client.height) || 170,
          fatPercentage: Number(parsed.fatPercentage) || 20,
          fatMassKg: Number(parsed.fatMassKg) || Number(((parsed.weightKg || 70) * (parsed.fatPercentage || 20)) / 100),
          leanMassKg: Number(parsed.leanMassKg) || Number(((parsed.weightKg || 70) * (1 - (parsed.fatPercentage || 20) / 100)).toFixed(1)),
          visceralFatLevel: Number(parsed.visceralFatLevel) || 4,
          bmrKcal: Number(parsed.bmrKcal) || 1500,
          waterPercentage: Number(parsed.waterPercentage) || 55,
          adherenceRatePct: statsSummary.avgAdherence || 85,
          sourceFileName: selectedFile.name,
          notes: parsed.notes || `Bioimpedância processada automaticamente via Gemini AI em ${new Date().toLocaleDateString('pt-BR')}.`,
          aiPrescriptionInsights: parsed.aiPrescriptionInsights || [
            'Manter progressão semanal de cargas focando em musculatura principal.',
            'Consumo hídrico mínimo recomendado: 35ml/kg/dia.',
            'Manter frequência e adesão atual para consolidação dos ganhos.'
          ]
        };

        setEditingRecord(newRec);
        setIsModalOpen(true);
        setIsParsing(false);
      };
    } catch (err: any) {
      console.error('Erro ao transcrever bioimpedância:', err);
      setParseError(err.message || 'Falha ao processar laudo com IA Gemini.');
      setIsParsing(false);
    }
  };

  // Open manual entry modal
  const handleOpenManualEntry = () => {
    const nextWeek = bioHistory.length + 1;
    const lastRec = bioHistory[bioHistory.length - 1];

    setEditingRecord({
      id: `bio-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      weekNumber: nextWeek,
      weightKg: lastRec ? lastRec.weightKg : Number(client.weight) || 70,
      heightCm: Number(client.height) || 170,
      fatPercentage: lastRec ? lastRec.fatPercentage : 20,
      fatMassKg: lastRec ? lastRec.fatMassKg : 14,
      leanMassKg: lastRec ? lastRec.leanMassKg : 50,
      visceralFatLevel: lastRec ? lastRec.visceralFatLevel : 3,
      bmrKcal: lastRec ? lastRec.bmrKcal : 1500,
      waterPercentage: lastRec ? lastRec.waterPercentage : 55,
      adherenceRatePct: 90,
      notes: 'Registro manual de avaliação física.',
      aiPrescriptionInsights: [
        'Ajustar volume de treino de acordo com a meta atual.',
        'Acompanhar taxa metabólica basal para prescrição de déficit/superávit.'
      ]
    });
    setIsModalOpen(true);
  };

  // Save record to client history
  const handleSaveRecord = () => {
    if (!editingRecord || !editingRecord.weightKg) return;

    const fullRecord: BioimpedanceRecord = {
      id: editingRecord.id || `bio-${Date.now()}`,
      date: editingRecord.date || new Date().toISOString().split('T')[0],
      weekNumber: editingRecord.weekNumber || bioHistory.length + 1,
      weightKg: Number(editingRecord.weightKg),
      heightCm: Number(editingRecord.heightCm) || Number(client.height) || 170,
      fatPercentage: Number(editingRecord.fatPercentage) || 0,
      fatMassKg: Number(editingRecord.fatMassKg) || Number(((editingRecord.weightKg || 0) * (editingRecord.fatPercentage || 0)) / 100),
      leanMassKg: Number(editingRecord.leanMassKg) || 0,
      visceralFatLevel: Number(editingRecord.visceralFatLevel) || 3,
      bmrKcal: Number(editingRecord.bmrKcal) || 1500,
      waterPercentage: Number(editingRecord.waterPercentage) || 55,
      adherenceRatePct: Number(editingRecord.adherenceRatePct) || 85,
      sourceFileName: editingRecord.sourceFileName || 'Registro Manual',
      notes: editingRecord.notes || '',
      aiPrescriptionInsights: editingRecord.aiPrescriptionInsights || []
    };

    const currentHistory = client.bodyCompositionHistory ? [...client.bodyCompositionHistory] : [];
    const existingIndex = currentHistory.findIndex(r => r.id === fullRecord.id);

    if (existingIndex >= 0) {
      currentHistory[existingIndex] = fullRecord;
    } else {
      currentHistory.push(fullRecord);
    }

    // Also update client weight & height in main client profile for full integration
    onUpdateClient({
      bodyCompositionHistory: currentHistory,
      weight: String(fullRecord.weightKg),
      height: fullRecord.heightCm ? String(fullRecord.heightCm) : client.height
    });

    setIsModalOpen(false);
    setEditingRecord(null);
    setSelectedFile(null);
    setFilePreview(null);
  };

  // Delete record
  const handleDeleteRecord = (recordId: string) => {
    const updated = (client.bodyCompositionHistory || []).filter(r => r.id !== recordId);
    onUpdateClient({ bodyCompositionHistory: updated });
  };

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-6 shadow-xl">
      {/* Widget Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00f0ff]/20 to-[#3b82f6]/20 border border-[#00f0ff]/40 flex items-center justify-center text-[#00f0ff]">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-[#f1f5f9] flex items-center gap-2">
              <span>Módulo de Composição Corporal & Bioimpedância</span>
              <Badge variant="accent" className="text-[10px] py-0.5 px-2">
                IA Multimodal Gemini
              </Badge>
            </h3>
            <p className="text-xs text-[#94a3b8]">
              Evolução temporal de Massa Magra, Gordura e Correlação com Adesão aos Treinos
            </p>
          </div>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#080b11] p-1 rounded-xl border border-[#1e293b]">
            <button
              onClick={() => setActiveView('grafico')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'grafico'
                  ? 'bg-[#00f0ff] text-[#080b11]'
                  : 'text-[#94a3b8] hover:text-[#f1f5f9]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Gráfico de Evolução</span>
            </button>
            <button
              onClick={() => setActiveView('laudos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'laudos'
                  ? 'bg-[#00f0ff] text-[#080b11]'
                  : 'text-[#94a3b8] hover:text-[#f1f5f9]'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Laudos & Transcrição</span>
            </button>
            <button
              onClick={() => setActiveView('insights')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'insights'
                  ? 'bg-[#00f0ff] text-[#080b11]'
                  : 'text-[#94a3b8] hover:text-[#f1f5f9]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Insights de Prescrição</span>
            </button>
          </div>

          <Button
            variant="secondary"
            onClick={handleOpenManualEntry}
            className="text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Medição Manual</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#94a3b8]">
            <span>Massa Magra (Muscular)</span>
            <Activity className="w-4 h-4 text-[#00f0ff]" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-display font-black text-[#00f0ff]">
              {statsSummary.latestLean} <span className="text-xs font-normal text-[#94a3b8]">kg</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold mt-0.5">
              {statsSummary.diffLean >= 0 ? (
                <span className="text-emerald-400">▲ +{statsSummary.diffLean} kg ganho</span>
              ) : (
                <span className="text-rose-400">▼ {statsSummary.diffLean} kg</span>
              )}
              <span className="text-[#64748b]">no ciclo</span>
            </div>
          </div>
        </div>

        <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#94a3b8]">
            <span>% Gordura Corporal</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-display font-black text-amber-400">
              {statsSummary.latestFat}%
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold mt-0.5">
              {statsSummary.diffFat <= 0 ? (
                <span className="text-emerald-400">▼ {statsSummary.diffFat}% gordura</span>
              ) : (
                <span className="text-amber-400">▲ +{statsSummary.diffFat}%</span>
              )}
              <span className="text-[#64748b]">acumulado</span>
            </div>
          </div>
        </div>

        <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#94a3b8]">
            <span>Adesão aos Treinos</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-display font-black text-emerald-400">
              {statsSummary.avgAdherence}%
            </div>
            <div className="text-[11px] font-medium text-[#94a3b8] mt-0.5">
              frequência média das sessões
            </div>
          </div>
        </div>

        <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#94a3b8]">
            <span>Peso Total / Data</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-display font-black text-[#f1f5f9]">
              {statsSummary.latestWeight} <span className="text-xs font-normal text-[#94a3b8]">kg</span>
            </div>
            <div className="text-[11px] font-medium text-[#94a3b8] mt-0.5">
              {statsSummary.latestDate}
            </div>
          </div>
        </div>
      </div>

      {/* Prescription Engine Rule Alert / Suggestion Banner */}
      {prescriptionAnalysis.stagnatedLeanMass ? (
        <div className="bg-gradient-to-r from-amber-500/15 via-[#0f172a] to-purple-500/15 border border-amber-500/40 rounded-xl p-4 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-bold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>{prescriptionAnalysis.title}</span>
            </h4>
            <Badge variant="accent" className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
              Regra do Motor de Prescrição
            </Badge>
          </div>
          <p className="text-xs text-[#cbd5e1] leading-relaxed">
            {prescriptionAnalysis.suggestedActionText}
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-[#94a3b8]">
              Adesão: <strong className="text-emerald-400">{prescriptionAnalysis.adherenceRatePct}%</strong> · Período: <strong className="text-[#00f0ff]">{prescriptionAnalysis.weeksElapsed} sem</strong>
            </span>
            <Button
              variant="primary"
              onClick={handleApplyPrescriptionVolumeAdjust}
              className="text-xs py-1.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 text-[#080b11] font-bold shadow-md shadow-amber-500/20"
            >
              <Zap className="w-3.5 h-3.5 mr-1" />
              <span>⚡ Aplicar Ajuste de Volume (+15%) no Mesociclo</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-[#00f0ff]/10 via-[#0f172a] to-emerald-500/10 border border-[#00f0ff]/30 rounded-xl p-4 flex items-start gap-3">
          <Zap className="w-5 h-5 text-[#00f0ff] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-display font-bold text-xs text-[#00f0ff] uppercase tracking-wider">
              {prescriptionAnalysis.title}
            </h4>
            <p className="text-xs text-[#cbd5e1] leading-relaxed">
              {prescriptionAnalysis.suggestedActionText}
            </p>
          </div>
        </div>
      )}

      {adjustedSuccessMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{adjustedSuccessMsg}</span>
          </span>
          <button onClick={() => setAdjustedSuccessMsg(null)} className="text-emerald-400 hover:underline text-[11px]">
            Fechar
          </button>
        </div>
      )}

      {/* VIEW: GRAPHICAL CHART */}
      {activeView === 'grafico' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#94a3b8]">
            <span className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff]" /> Massa Magra (kg)
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ml-2" /> % Gordura Corporal
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ml-2" /> Adesão (%)
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 ml-2" /> Volume Semanal (séries)
            </span>
            <span className="text-[11px] font-mono text-[#64748b]">Recharts Duplo-Eixo + Correlação</span>
          </div>

          {chartData.length === 0 ? (
            <div className="bg-[#080b11] border border-dashed border-[#1e293b] rounded-xl p-8 text-center space-y-3">
              <Scale className="w-10 h-10 text-[#64748b] mx-auto" />
              <p className="text-sm font-bold text-[#94a3b8]">Nenhum laudo de bioimpedância cadastrado ainda.</p>
              <p className="text-xs text-[#64748b] max-w-md mx-auto">
                Faça o upload do laudo em PDF ou foto (InBody, Tanita, laudo médico) para que a IA Gemini transcreva os dados automaticamente e plote o gráfico de evolução.
              </p>
              <Button
                variant="primary"
                onClick={() => setActiveView('laudos')}
                className="text-xs py-2 px-4"
              >
                <Upload className="w-4 h-4 mr-1.5" />
                Fazer Upload do Primeiro Laudo
              </Button>
            </div>
          ) : (
            <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-4 h-[330px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="semanaLabel" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis
                    yAxisId="left"
                    stroke="#00f0ff"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    domain={['auto', 'auto']}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#10b981"
                    tick={{ fill: '#10b981', fontSize: 11 }}
                    domain={[0, 100]}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#f1f5f9',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                    }}
                    formatter={(val: any, name: any) => {
                      if (name === 'Massa Magra (kg)') return [`${val} kg`, 'Massa Magra'];
                      if (name === '% Gordura') return [`${val}%`, 'Gordura'];
                      if (name === 'Adesão aos Treinos (%)') return [`${val}%`, 'Adesão ao Treino'];
                      if (name === 'Volume (Séries/Semana)') return [`${val} séries`, 'Volume Semanal'];
                      return [val, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar
                    yAxisId="right"
                    dataKey="adesaoPct"
                    name="Adesão aos Treinos (%)"
                    fill="#10b981"
                    opacity={0.25}
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="massaMagraKg"
                    name="Massa Magra (kg)"
                    stroke="#00f0ff"
                    strokeWidth={3}
                    dot={{ fill: '#00f0ff', r: 5, strokeWidth: 2, stroke: '#080b11' }}
                    activeDot={{ r: 7, stroke: '#00f0ff', strokeWidth: 2 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="gorduraPct"
                    name="% Gordura"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={{ fill: '#f59e0b', r: 4 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="volumeSeries"
                    name="Volume (Séries/Semana)"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={{ fill: '#a855f7', r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* VIEW: LAUDOS & UPLOAD / OCR */}
      {activeView === 'laudos' && (
        <div className="space-y-6">
          {/* Upload Drop Zone Box */}
          <div className="bg-[#080b11] border-2 border-dashed border-[#00f0ff]/30 rounded-2xl p-6 text-center space-y-4 hover:border-[#00f0ff]/60 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff] mx-auto shadow-lg shadow-[#00f0ff]/10">
              <Upload className="w-7 h-7" />
            </div>

            <div>
              <h4 className="font-display font-bold text-sm text-[#f1f5f9]">
                Enviar Novo Laudo ou Foto de Bioimpedância
              </h4>
              <p className="text-xs text-[#94a3b8] mt-1 max-w-lg mx-auto">
                Aceita arquivos PDF, JPEG, PNG de exames InBody, Tanita ou laudo impresso. O Gemini AI fará a leitura óptica (OCR) e transcreverá automaticamente peso, altura, % gordura e massa magra.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <label className="cursor-pointer bg-[#1e293b] hover:bg-[#334155] text-[#f1f5f9] px-4 py-2.5 rounded-xl text-xs font-bold border border-[#334155] transition-all flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#00f0ff]" />
                <span>{selectedFile ? selectedFile.name : 'Selecionar Arquivo (PDF / Foto)'}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {selectedFile && (
                <Button
                  variant="primary"
                  onClick={handleParseFileWithAI}
                  disabled={isParsing}
                  className="text-xs py-2.5 px-5 flex items-center gap-2 shadow-lg shadow-[#00f0ff]/20"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#080b11]" />
                      <span>Processando com Gemini Vision...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#080b11]" />
                      <span>⚡ Transcrever Laudo com IA</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Image Preview Thumbnail */}
            {filePreview && (
              <div className="pt-3 flex justify-center">
                <div className="relative border border-[#334155] rounded-xl overflow-hidden max-w-[180px] max-h-[120px]">
                  <img src={filePreview} alt="Preview do Laudo" className="object-cover w-full h-full" />
                </div>
              </div>
            )}

            {parseError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </div>

          {/* History List Table */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-xs text-[#94a3b8] uppercase tracking-wider flex items-center justify-between">
              <span>Histórico de Laudos & Avaliações</span>
              <span className="text-[11px] font-normal text-[#64748b]">
                {bioHistory.length} registo(s) armazenado(s)
              </span>
            </h4>

            {bioHistory.length === 0 ? (
              <p className="text-xs text-[#64748b] text-center py-4">Nenhum registro no histórico.</p>
            ) : (
              <div className="space-y-2">
                {bioHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#334155] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#1e293b] text-[#00f0ff] flex items-center justify-center font-display font-bold text-xs">
                        S{rec.weekNumber || '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#f1f5f9]">{rec.date}</span>
                          {rec.sourceFileName && (
                            <Badge variant="accent" className="text-[9px] py-0 px-1.5">
                              {rec.sourceFileName}
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-[#94a3b8] flex items-center gap-3 mt-0.5">
                          <span>Peso: <strong className="text-[#f1f5f9]">{rec.weightKg}kg</strong></span>
                          <span>Massa Magra: <strong className="text-[#00f0ff]">{rec.leanMassKg}kg</strong></span>
                          <span>% Gordura: <strong className="text-amber-400">{rec.fatPercentage}%</strong></span>
                          {rec.visceralFatLevel && <span>Gord. Visceral: <strong className="text-[#f1f5f9]">{rec.visceralFatLevel}</strong></span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => {
                          setEditingRecord(rec);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#00f0ff] hover:bg-[#1e293b] transition-all"
                        title="Editar registro"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(rec.id)}
                        className="p-1.5 rounded-lg text-[#94a3b8] hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Excluir laudo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: INSIGHTS DE PRESCRIÇÃO */}
      {activeView === 'insights' && (
        <div className="space-y-4">
          <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-4 space-y-3">
            <h4 className="font-display font-bold text-xs text-[#00f0ff] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Diretrizes Estratégicas para Prescrição de Treino & Nutrição</span>
            </h4>
            <p className="text-xs text-[#cbd5e1] leading-relaxed">
              Baseado nos exames de bioimpedância e no nível de adesão do aluno, a inteligência fisiológica sugere as seguintes condutas de periodização:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {bioHistory.length > 0 && bioHistory[bioHistory.length - 1].aiPrescriptionInsights?.map((insight, idx) => (
                <div
                  key={idx}
                  className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3 flex items-start gap-2.5 text-xs text-[#f1f5f9]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#00f0ff] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{insight}</span>
                </div>
              ))}

              {(!bioHistory.length || !bioHistory[bioHistory.length - 1].aiPrescriptionInsights) && (
                <>
                  <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3 flex items-start gap-2.5 text-xs text-[#f1f5f9]">
                    <CheckCircle2 className="w-4 h-4 text-[#00f0ff] shrink-0 mt-0.5" />
                    <span>Prescrever estimulação com foco na preservação e ganho de massa magra muscular.</span>
                  </div>
                  <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3 flex items-start gap-2.5 text-xs text-[#f1f5f9]">
                    <CheckCircle2 className="w-4 h-4 text-[#00f0ff] shrink-0 mt-0.5" />
                    <span>Ajustar volume semanal de séries de acordo com a recuperação subjetiva do aluno.</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT / REVIEW MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Validar Dados do Laudo de Bioimpedância"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#94a3b8]">
            Confira e ajuste as métricas transcritas pelo Gemini AI antes de confirmar o salvamento no perfil do aluno:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#94a3b8] block mb-1">Data do Exame</label>
              <input
                type="date"
                value={editingRecord?.date || ''}
                onChange={e => setEditingRecord(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg p-2 text-xs text-[#f1f5f9]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#94a3b8] block mb-1">Semana de Treino</label>
              <input
                type="number"
                value={editingRecord?.weekNumber || 1}
                onChange={e => setEditingRecord(prev => ({ ...prev, weekNumber: Number(e.target.value) }))}
                className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg p-2 text-xs text-[#f1f5f9]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#94a3b8] block mb-1">Peso Total (kg)</label>
              <input
                type="number"
                step="0.1"
                value={editingRecord?.weightKg || ''}
                onChange={e => setEditingRecord(prev => ({ ...prev, weightKg: Number(e.target.value) }))}
                className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg p-2 text-xs text-[#f1f5f9]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#94a3b8] block mb-1">Altura (cm)</label>
              <input
                type="number"
                value={editingRecord?.heightCm || ''}
                onChange={e => setEditingRecord(prev => ({ ...prev, heightCm: Number(e.target.value) }))}
                className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg p-2 text-xs text-[#f1f5f9]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#94a3b8] block mb-1">% Gordura Corporal</label>
              <input
                type="number"
                step="0.1"
                value={editingRecord?.fatPercentage || ''}
                onChange={e => setEditingRecord(prev => ({ ...prev, fatPercentage: Number(e.target.value) }))}
                className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg p-2 text-xs text-[#f1f5f9]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#f1f5f9] font-bold block mb-1 text-[#00f0ff]">
                Massa Magra (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={editingRecord?.leanMassKg || ''}
                onChange={e => setEditingRecord(prev => ({ ...prev, leanMassKg: Number(e.target.value) }))}
                className="w-full bg-[#080b11] border border-[#00f0ff]/40 rounded-lg p-2 text-xs text-[#00f0ff] font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#94a3b8] block mb-1">Gordura Visceral (1-20)</label>
              <input
                type="number"
                value={editingRecord?.visceralFatLevel || 3}
                onChange={e => setEditingRecord(prev => ({ ...prev, visceralFatLevel: Number(e.target.value) }))}
                className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg p-2 text-xs text-[#f1f5f9]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#94a3b8] block mb-1">TMB (kcal)</label>
              <input
                type="number"
                value={editingRecord?.bmrKcal || 1500}
                onChange={e => setEditingRecord(prev => ({ ...prev, bmrKcal: Number(e.target.value) }))}
                className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg p-2 text-xs text-[#f1f5f9]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#94a3b8] block mb-1">Adesão ao Treino (%)</label>
              <input
                type="number"
                value={editingRecord?.adherenceRatePct || 90}
                onChange={e => setEditingRecord(prev => ({ ...prev, adherenceRatePct: Number(e.target.value) }))}
                className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg p-2 text-xs text-[#f1f5f9]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#94a3b8] block mb-1">Observações do Treinador / Laudo</label>
            <textarea
              value={editingRecord?.notes || ''}
              onChange={e => setEditingRecord(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg p-2.5 text-xs text-[#f1f5f9] min-h-[60px]"
              placeholder="Anotações técnicas sobre hidratação, protocolo de bioimpedância ou dobras..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSaveRecord} className="text-xs">
              💾 Salvar no Histórico do Aluno
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
