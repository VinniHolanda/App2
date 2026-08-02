import React from 'react';
import { Modal, Badge } from '../ui/Primitives';
import { useBrand } from '../../context/BrandContext';
import { 
  Users, Dumbbell, ArrowRight, ChevronRight, Zap
} from 'lucide-react';

interface WelcomeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: (role: 'trainer' | 'student') => void;
}

export const WelcomeRoleModal: React.FC<WelcomeRoleModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth
}) => {
  const { brand } = useBrand();

  const handleChooseTrainer = () => {
    onOpenAuth('trainer');
    onClose();
  };

  const handleChooseStudent = () => {
    onOpenAuth('student');
    onClose();
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
            </div>

            <div className="space-y-2 pt-2 border-t border-[#1e293b]">
              <button
                onClick={handleChooseStudent}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#080b11] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all text-xs"
              >
                <span>Acessar como Aluno</span>
                <ChevronRight className="w-4 h-4" />
              </button>
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
