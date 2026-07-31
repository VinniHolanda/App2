import React, { useState, useEffect } from 'react';
import { Modal, Button, Card, Badge } from '../ui/Primitives';
import { Client } from '../../../domain/types';
import { clientRepository } from '../../../data/repositories/ClientRepository';
import { useAuth } from '../../context/AuthContext';
import { useBrand } from '../../context/BrandContext';
import { 
  Users, Dumbbell, ShieldCheck, LogIn, ChevronRight, Sparkles, 
  CheckCircle2, ArrowRight, Layers, Smartphone, Zap
} from 'lucide-react';

interface WelcomeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: 'trainer' | 'student', studentId?: string) => void;
}

export const WelcomeRoleModal: React.FC<WelcomeRoleModalProps> = ({
  isOpen,
  onClose,
  onSelectRole
}) => {
  const { brand } = useBrand();
  const { currentUser, signInWithGoogle } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [showStudentList, setShowStudentList] = useState(false);

  useEffect(() => {
    if (isOpen) {
      clientRepository.getClients().then(data => {
        setClients(data);
        if (data.length > 0) {
          setSelectedStudentId(data[0].id);
        }
      });
    }
  }, [isOpen]);

  const handleChooseTrainer = () => {
    onSelectRole('trainer');
    onClose();
  };

  const handleChooseStudentDirect = (studentId?: string) => {
    const idToUse = studentId || selectedStudentId || (clients[0]?.id);
    onSelectRole('student', idToUse);
    onClose();
  };

  const handleGoogleAuth = async (role: 'trainer' | 'student') => {
    try {
      await signInWithGoogle(role);
      onSelectRole(role);
      onClose();
    } catch (err) {
      console.error("Google Auth error:", err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Acesso ao Sistema · Escolha seu Perfil"
    >
      <div className="space-y-6 text-xs text-[#f1f5f9]">
        <div className="text-center space-y-2">
          <div 
            className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center font-display font-black text-xl text-[#080b11] shadow-xl"
            style={{
              background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.secondaryColor})`
            }}
          >
            {brand.shortInitials || 'KS'}
          </div>
          <h3 className="font-display font-extrabold text-xl text-[#f1f5f9] tracking-tight">
            Como você deseja acessar hoje?
          </h3>
          <p className="text-xs text-[#94a3b8] max-w-sm mx-auto">
            A plataforma opera em tempo real com sincronização na nuvem e suporte offline para o salão de musculação.
          </p>
        </div>

        {/* Two Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Trainer Card */}
          <div className="bg-[#0f172a] border border-[#1e293b] hover:border-[#00f0ff]/50 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff] flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-extrabold text-base text-[#f1f5f9] group-hover:text-[#00f0ff] transition-colors">
                    Painel do Treinador
                  </h4>
                  <Badge variant="accent">Personal</Badge>
                </div>
                <p className="text-xs text-[#94a3b8] mt-1.5 leading-relaxed">
                  Prescreva treinos, ajuste periodizações e mesociclos, acompanhe bioimpedância, agenda e envie convites.
                </p>
              </div>

              <div className="space-y-1.5 text-[11px] text-[#64748b] pt-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00f0ff]" /> Prescrição com Motor Biompressivo
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00f0ff]" /> Envio de Convites por WhatsApp/Link
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#1e293b]">
              <button
                onClick={handleChooseTrainer}
                className="w-full bg-[#00f0ff] hover:bg-[#00d0df] text-[#080b11] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#00f0ff]/20 transition-all text-xs"
              >
                <span>Acessar Painel do Treinador</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Student Card */}
          <div className="bg-[#0f172a] border border-[#1e293b] hover:border-emerald-500/50 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-extrabold text-base text-[#f1f5f9] group-hover:text-emerald-400 transition-colors">
                    Portal do Aluno
                  </h4>
                  <Badge variant="neutral">Atleta</Badge>
                </div>
                <p className="text-xs text-[#94a3b8] mt-1.5 leading-relaxed">
                  Veja sua ficha do dia no salão de musculação, registre cargas, RPE, tempo sob tensão e notas por áudio.
                </p>
              </div>

              <div className="space-y-1.5 text-[11px] text-[#64748b] pt-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Funcionamento Offline (IndexedDB)
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Timer de Descanso & Gravação de Áudio
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#1e293b]">
              {!showStudentList ? (
                <button
                  onClick={() => setShowStudentList(true)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#080b11] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all text-xs"
                >
                  <span>Acessar como Aluno</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="space-y-2 animate-fade-in max-h-40 overflow-y-auto pr-1">
                  <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider block">
                    Escolha seu perfil de Aluno:
                  </span>
                  {(clients || []).map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleChooseStudentDirect(c.id)}
                      className="w-full bg-[#080b11] hover:bg-[#1a2333] border border-[#1e293b] hover:border-emerald-500/50 rounded-xl p-2.5 flex items-center justify-between text-left transition-all"
                    >
                      <span className="font-bold text-[#f1f5f9] truncate text-xs">{c.name}</span>
                      <span className="text-[10px] text-emerald-400 font-bold">Acessar →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-[#080b11] p-3 rounded-xl border border-[#1e293b] text-center text-[11px] text-[#64748b] flex items-center justify-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Você pode alterar seu modo de acesso a qualquer momento no menu superior da aplicação.</span>
        </div>
      </div>
    </Modal>
  );
};
