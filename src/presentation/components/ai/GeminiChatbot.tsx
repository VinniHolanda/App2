import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, Sparkles, X, Minimize2, Maximize2, RefreshCw, Zap, Cpu, Award, User, MessageSquare } from 'lucide-react';
import { Button } from '../ui/Primitives';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export interface RolePreset {
  id: string;
  title: string;
  roleDescription: string;
  systemInstruction: string;
  defaultPrompts: string[];
}

const ROLE_PRESETS: RolePreset[] = [
  {
    id: 'physio',
    title: 'Fisiologista FitConnect',
    roleDescription: 'Especialista em fisiologia do exercício, MEV/MAV/MRV, biomecânica e sRPE Foster.',
    systemInstruction: `Você é o Fisiologista Chefe da plataforma FitConnect. Sua função é auxiliar treinadores de alto desempenho com respostas fundamentadas na ciência do treinamento de força, hipertrofia, periodização (ondulória, blocos, linear), volume muscular (MEV, MAV, MRV de Mike Israetel), estimativa de 1RM (fórmula de Epley) e monitoramento de carga interna sRPE Foster. Seja direto, técnico e prático.`,
    defaultPrompts: [
      'Como ajustar o volume quando o aluno atinge o MRV?',
      'Qual a diferença de hipertrofia entre 3 min e 90s de descanso?',
      'Como utilizar o sRPE Foster para prevenir overreaching?'
    ]
  },
  {
    id: 'coach',
    title: 'Coach FitConnect',
    roleDescription: 'Assistente motivacional e instrutor de execução técnica para o aluno.',
    systemInstruction: `Você é o Coach FitConnect, um assistente empático, motivador e claro para alunos de musculação e condicionamento. Responda com tom encorajador e simples. Explique a técnica de execução correta dos exercícios, a importância da cadência e da respiração, e como registrar o esforço RPE corretamente.`,
    defaultPrompts: [
      'Como saber se estou usando a carga certa no agachamento?',
      'O que fazer se eu sentir dor na lombar durante o levantamento terra?',
      'Qual a importância de beber água durante o treino?'
    ]
  },
  {
    id: 'recovery',
    title: 'Nutrição & Recuperação',
    roleDescription: 'Especialista em recuperação neuromuscular, sono e nutrição esportiva.',
    systemInstruction: `Você é o Especialista em Recuperação e Nutrição FitConnect. Forneça conselhos baseados em evidências científicas sobre qualidade de sono, ingestão de macronutrientes, hidratação, timing de proteínas para síntese proteica muscular (MPS) e estratégias para mitigar dor muscular tardia (DMIT).`,
    defaultPrompts: [
      'Quantas gramas de proteína por kg são ideais para hipertrofia?',
      'Como o sono afeta a síntese proteica e os níveis de cortisol?',
      'Crioimersão (banho de gelo) prejudica a hipertrofia muscular?'
    ]
  }
];

export const GeminiChatbot: React.FC<{ defaultOpen?: boolean; initialRole?: string }> = ({ defaultOpen = false, initialRole = 'physio' }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeRole, setActiveRole] = useState<RolePreset>(
    ROLE_PRESETS.find(r => r.id === initialRole) || ROLE_PRESETS[0]
  );
  const [speedMode, setSpeedMode] = useState<'fast' | 'general' | 'complex'>('general');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Olá! Sou o **${activeRole.title}** alimentado por Gemini. Como posso ajudar com sua preparação física, fisiologia ou dúvidas técnicas hoje?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, text: m.content })),
          systemInstruction: activeRole.systemInstruction,
          speedMode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro de comunicação');
      }

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Desculpe, não consegui obter uma resposta válida.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Não foi possível conectar ao assistente Gemini: ${err.message || 'Verifique sua conexão.'}`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Chat reiniciado com a persona **${activeRole.title}**. Como posso ajudar?`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#080b11] p-4 rounded-full shadow-2xl shadow-[#00f0ff]/30 border-2 border-[#080b11]/20 flex items-center gap-2 font-display font-bold group cursor-pointer"
        >
          <Sparkles className="w-5 h-5 text-[#080b11] animate-pulse" />
          <span className="text-xs tracking-wide hidden sm:inline">IA FitConnect</span>
        </motion.button>
      )}

      {/* Floating Chat Modal / Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed z-50 bg-[#0f172a] border border-[#1e293b] shadow-2xl rounded-3xl flex flex-col overflow-hidden backdrop-blur-xl ${
              isExpanded
                ? 'inset-4 md:inset-10'
                : 'bottom-4 right-4 w-[92vw] sm:w-[440px] h-[600px] max-h-[85vh]'
            }`}
          >
            {/* Header */}
            <div className="bg-[#080b11] border-b border-[#1e293b] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00f0ff] to-[#3b82f6] text-[#080b11] flex items-center justify-center font-black shadow-md shadow-[#00f0ff]/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-[#f1f5f9] flex items-center gap-1.5">
                    FitConnect AI <span className="text-[10px] bg-[#00f0ff]/15 text-[#00f0ff] px-2 py-0.5 rounded-full font-mono font-semibold">Gemini 3</span>
                  </h3>
                  <p className="text-[11px] text-[#94a3b8] font-medium">{activeRole.title}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleResetChat}
                  title="Reiniciar Conversa"
                  className="p-2 text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#1f1f26] rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Reduzir' : 'Expandir'}
                  className="p-2 text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#1f1f26] rounded-lg transition-colors hidden sm:block"
                >
                  {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Fechar"
                  className="p-2 text-[#94a3b8] hover:text-red-400 hover:bg-[#1f1f26] rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Persona & Speed Selector */}
            <div className="bg-[#0f172a] px-4 py-2 border-b border-[#1e293b] flex items-center justify-between text-xs gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">Papel:</span>
                <select
                  value={activeRole.id}
                  onChange={e => {
                    const found = ROLE_PRESETS.find(r => r.id === e.target.value);
                    if (found) {
                      setActiveRole(found);
                      setMessages(prev => [
                        ...prev,
                        {
                          id: `role-${Date.now()}`,
                          role: 'assistant',
                          content: `Modo alterado para **${found.title}**. ${found.roleDescription}`,
                          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        }
                      ]);
                    }
                  }}
                  className="bg-[#0f172a] border border-[#1e293b] text-[#f1f5f9] text-xs rounded-lg px-2 py-1 font-semibold focus:outline-none focus:border-[#00f0ff]"
                >
                  {ROLE_PRESETS.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">Velocidade:</span>
                <button
                  onClick={() => setSpeedMode('fast')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    speedMode === 'fast' ? 'bg-[#00f0ff] text-[#080b11]' : 'bg-[#0f172a] text-[#94a3b8]'
                  }`}
                  title="Gemini 3.1 Flash-Lite (Resposta ultra rápida)"
                >
                  Rápido
                </button>
                <button
                  onClick={() => setSpeedMode('general')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    speedMode === 'general' ? 'bg-[#00f0ff] text-[#080b11]' : 'bg-[#0f172a] text-[#94a3b8]'
                  }`}
                  title="Gemini 3.6 Flash (Padrão balanceado)"
                >
                  Geral
                </button>
                <button
                  onClick={() => setSpeedMode('complex')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    speedMode === 'complex' ? 'bg-[#00f0ff] text-[#080b11]' : 'bg-[#0f172a] text-[#94a3b8]'
                  }`}
                  title="Gemini 3.1 Pro Preview (Raciocínio científico profundo)"
                >
                  Pro
                </button>
              </div>
            </div>

            {/* Scrollable Conversation Thread */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-1.5 shadow-md ${
                      msg.role === 'user'
                        ? 'bg-[#00f0ff] text-[#080b11] font-medium rounded-br-none'
                        : 'bg-[#0f172a] border border-[#2a2a33] text-[#f1f5f9] rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div className={`text-[9px] flex items-center justify-between gap-2 mt-1 ${
                      msg.role === 'user' ? 'text-black/60 font-semibold' : 'text-[#64748b]'
                    }`}>
                      <span>{msg.timestamp}</span>
                      {msg.modelUsed && <span className="font-mono">{msg.modelUsed}</span>}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-[#00f0ff] p-3 bg-[#0f172a] border border-[#2a2a33] rounded-2xl w-fit animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>FitConnect AI processando análise...</span>
                </div>
              )}
            </div>

            {/* Default Prompts Suggestions */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 border-t border-[#1e293b] bg-[#0f172a] space-y-1.5">
                <div className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">Sugestões rápidas:</div>
                <div className="flex flex-wrap gap-1.5">
                  {activeRole.defaultPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(p)}
                      className="text-[11px] bg-[#0f172a] hover:bg-[#1e293b] text-[#00f0ff] px-2.5 py-1 rounded-lg border border-[#2a2a33] transition-colors text-left"
                    >
                      💡 {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input Bar */}
            <div className="p-3 bg-[#0f172a] border-t border-[#1e293b] flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={`Pergunte ao ${activeRole.title}...`}
                disabled={isLoading}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 bg-[#1a1a20] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff] disabled:opacity-50"
              />
              <Button
                variant="primary"
                disabled={isLoading || !input.trim()}
                onClick={() => handleSendMessage()}
                className="font-bold px-3 py-2.5 text-xs flex items-center gap-1 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
