import React, { useState, useEffect } from 'react';
import { Client } from '../../../domain/types';
import { Sparkles, Save, Copy, MessageSquare, Check, RefreshCw, Send, FileText, HeartHandshake } from 'lucide-react';
import { calculateStudentClassStats } from '../../../domain/calculators/classStatsCalculator';

interface TrainerNotesWidgetProps {
  client: Client;
  onSaveClient?: (clientData: Partial<Client>) => void;
}

export const TrainerNotesWidget: React.FC<TrainerNotesWidgetProps> = ({ client, onSaveClient }) => {
  const [notes, setNotes] = useState<string>(client.notes || '');
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const [aiPrompting, setAiPrompting] = useState<boolean>(false);
  const [suggestedMessage, setSuggestedMessage] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);
  const [copiedNotes, setCopiedNotes] = useState<boolean>(false);

  // Sync state if client prop updates externally
  useEffect(() => {
    setNotes(client.notes || '');
  }, [client.notes]);

  const handleSaveNotes = async () => {
    if (!onSaveClient) return;
    setSaving(true);
    try {
      await onSaveClient({
        ...client,
        notes: notes
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Erro ao salvar notas do treinador:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAiMessage = async () => {
    setAiPrompting(true);
    try {
      const stats = calculateStudentClassStats(client);
      const promptData = {
        alunoNome: client.name,
        objetivo: client.goal || 'Saúde e Condicionamento',
        nivel: client.level || 'Intermediário',
        tipoAtendimento: client.tipo || 'Presencial',
        taxaFrequencia: `${stats.frequencyPercentage}%`,
        aulasRealizadas: stats.completedClasses,
        faltasTotais: stats.absencesCount,
        creditosReposicao: stats.replacementCreditsAvailable,
        diasPrescritos: `${client.days || 3}x/semana`,
        observacoesTreinador: notes || 'Nenhuma observação prévia.'
      };

      const systemInstruction = `Você é um assistente virtual e personal trainer de elite no Kinetix Studio, mestre em comunicação empática e psicologia de hábitos esportivos.
Sua missão é gerar uma mensagem motivacional e acolhedora, pronta para ser enviada diretamente por WhatsApp ao aluno.

A mensagem deve:
1. Ser personalizada com o primeiro nome do aluno.
2. Reconhecer seu progresso e assiduidade (frequência de ${stats.frequencyPercentage}%).
3. Caso a frequência esteja alta (≥80%), parabenizar e reforçar o orgulho do hábito mantido.
4. Caso a frequência esteja média ou baixa (<80%), encorajar sem julgamentos, lembrando da importância da consistência para o objetivo de ${client.goal} e oferecendo apoio para reagendar ou ajustar a rotina.
5. Utilizar tom positivo, entusiasmado e profissional, mantendo formatação amigável com poucos emojis (ex: 💪, 🏋️, ✨).
6. Ter entre 30 e 70 palavras, sendo concisa e fácil de ler no celular.
7. Retornar APENAS o texto puro da mensagem, sem aspas, títulos ou explicações extras.`;

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-3.6-flash',
          systemInstruction,
          messages: [
            {
              role: 'user',
              content: `Gere a mensagem em Português (Brasil) para envio ao aluno com base nos dados:\n${JSON.stringify(promptData, null, 2)}`
            }
          ]
        })
      });

      if (!response.ok) throw new Error('Erro na geração da mensagem IA');

      const data = await response.json();
      setSuggestedMessage(data.reply.trim());
    } catch (err) {
      console.error('Erro ao sugerir mensagem com Gemini:', err);
      // Fallback
      const stats = calculateStudentClassStats(client);
      const firstName = client.name.split(' ')[0];
      if (stats.frequencyPercentage >= 80) {
        setSuggestedMessage(
          `Fala ${firstName}, tudo bem? Passando para te parabenizar pela excelente consistência nos treinos! ` +
          `Sua frequência de ${stats.frequencyPercentage}% está incrível e é exatamente essa rotina que vai te levar ao seu objetivo de ${client.goal}. Vamos manter esse ritmo firme na próxima semana! 💪🏋️`
        );
      } else {
        setSuggestedMessage(
          `Fala ${firstName}, como você está? Notei que a rotina esteve mais corrida recentemente. ` +
          `A consistência é o pilar mais importante para alcançar ${client.goal}. Conte comigo para ajustarmos os horários ou o que for preciso para você retomar o ritmo de forma leve e constante. Vamos juntos nessa! ✨💪`
        );
      }
    } finally {
      setAiPrompting(false);
    }
  };

  const copyToClipboard = (text: string, type: 'suggested' | 'notes') => {
    navigator.clipboard.writeText(text);
    if (type === 'suggested') {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    } else {
      setCopiedNotes(true);
      setTimeout(() => setCopiedNotes(false), 2000);
    }
  };

  const applySuggestionToNotes = () => {
    if (!suggestedMessage) return;
    const updated = notes ? `${notes}\n\n[Mensagem Enviada ao Aluno]:\n${suggestedMessage}` : suggestedMessage;
    setNotes(updated);
  };

  // WhatsApp formatted link
  const getWhatsAppLink = (messageText: string) => {
    if (!client.whats) return '#';
    const cleanPhone = client.whats.replace(/\D/g, '');
    const encoded = encodeURIComponent(messageText);
    return `https://api.whatsapp.com/send?phone=${cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone}&text=${encoded}`;
  };

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-5 shadow-lg animate-fade-in">
      {/* Component Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base text-[#f1f5f9]">
              Notas do Treinador & Comunicação Proativa
            </h3>
            <p className="text-xs text-[#94a3b8]">
              Anotações confidenciais e sugestões automatizadas com Gemini AI para manter a aderência do aluno
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateAiMessage}
          disabled={aiPrompting}
          className="bg-gradient-to-r from-[#00f0ff]/20 to-purple-600/20 hover:from-[#00f0ff]/30 hover:to-purple-600/30 border border-[#00f0ff]/40 text-[#00f0ff] text-xs font-bold px-3.5 py-2 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${aiPrompting ? 'animate-spin' : ''}`} />
          <span>{aiPrompting ? 'Sugerindo com Gemini...' : 'Gerar Mensagem Motivacional IA'}</span>
        </button>
      </div>

      {/* Gemini AI Suggested Message Box (if generated or requested) */}
      {suggestedMessage && (
        <div className="bg-[#080b11] border border-[#00f0ff]/30 rounded-xl p-4 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-[#1e293b] pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#00f0ff]">
              <HeartHandshake className="w-4 h-4" />
              <span>Mensagem Sugerida pelo Gemini AI (Pronta para Envio)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(suggestedMessage, 'suggested')}
                className="text-[11px] font-bold text-[#94a3b8] hover:text-[#00f0ff] bg-[#0f172a] border border-[#1e293b] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all"
              >
                {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMessage ? 'Copiado!' : 'Copiar'}</span>
              </button>

              <button
                onClick={applySuggestionToNotes}
                className="text-[11px] font-bold text-[#00f0ff] hover:bg-[#00f0ff]/10 bg-[#0f172a] border border-[#00f0ff]/30 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all"
                title="Anexar texto às notas do aluno"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Anexar às Notas</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-[#cbd5e1] leading-relaxed italic bg-[#0f172a] border border-[#1e293b] rounded-lg p-3 font-sans">
            "{suggestedMessage}"
          </div>

          {/* Direct WhatsApp Action Button */}
          {client.whats ? (
            <a
              href={getWhatsAppLink(suggestedMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar via WhatsApp ({client.whats})</span>
            </a>
          ) : (
            <p className="text-[11px] text-[#64748b]">
              💡 Dica: Cadastre o WhatsApp do aluno no perfil para abrir a conversa com 1 clique.
            </p>
          )}
        </div>
      )}

      {/* Trainer Persistent Notes Textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#94a3b8] flex items-center gap-1.5">
            <span>Anotações Particulares & Diretrizes do Treinador</span>
            {savedSuccess && (
              <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1 animate-fade-in">
                <Check className="w-3 h-3" /> Salvo no Perfil!
              </span>
            )}
          </label>

          <button
            onClick={() => copyToClipboard(notes, 'notes')}
            disabled={!notes}
            className="text-[11px] font-bold text-[#94a3b8] hover:text-[#00f0ff] flex items-center gap-1 transition-all disabled:opacity-40"
          >
            {copiedNotes ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedNotes ? 'Copiado!' : 'Copiar Notas'}</span>
          </button>
        </div>

        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Digite observações sobre a evolução, preferências do aluno, restrições biomecânicas ou combinados de frequência..."
          className="w-full bg-[#080b11] border border-[#1e293b] rounded-xl p-3.5 text-xs text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-[#00f0ff] transition-all resize-y leading-relaxed font-sans"
        />

        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-[#64748b]">
            As anotações ficam salvas de forma permanente no histórico deste aluno.
          </p>

          <button
            onClick={handleSaveNotes}
            disabled={saving}
            className="bg-[#00f0ff] hover:bg-[#00d0df] text-[#080b11] font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Salvando...' : 'Salvar Notas'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
