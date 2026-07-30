import React, { useState } from 'react';
import { Modal, Button, Badge } from '../ui/Primitives';
import { Client } from '../../../domain/types';
import { 
  Share2, Copy, Check, QrCode, Send, Sparkles, Key, Link as LinkIcon, 
  Smartphone, ShieldCheck, CheckCircle2, UserCheck 
} from 'lucide-react';
import { useBrand } from '../../context/BrandContext';

interface StudentInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}

export const StudentInviteModal: React.FC<StudentInviteModalProps> = ({
  isOpen,
  onClose,
  client
}) => {
  const { brand } = useBrand();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Generate direct link using current origin
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteLink = `${baseUrl}/?studentId=${client.id}`;
  const studentPass = client.portal?.pass || '123456';
  const studentEmail = client.email || client.portal?.email || `${client.name.toLowerCase().replace(/\s+/g, '.')}@fitconnect.com`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const whatsappMessage = encodeURIComponent(
    `Olá ${client.name.split(' ')[0]}! 👋\n\n` +
    `Seu treino de *${client.goal}* no *${brand.studioName || 'Kinetix Studio'}* já está liberado na sua ficha digital!\n\n` +
    `📲 *Link de Acesso Direto:*\n${inviteLink}\n\n` +
    `🔑 *Dados do Portal:*\nE-mail: ${studentEmail}\nSenha: ${studentPass}\n\n` +
    `Você pode abrir direto no celular e registrar suas cargas, RPE e áudios mesmo sem internet no salão de musculação! 💪`
  );

  const whatsappUrl = `https://wa.me/${client.whats ? client.whats.replace(/\D/g, '') : ''}?text=${whatsappMessage}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Convite Digital · ${client.name}`}
    >
      <div className="space-y-6 text-xs text-[#f1f5f9]">
        {/* Header summary */}
        <div 
          className="p-4 rounded-2xl border flex items-center gap-3.5"
          style={{
            backgroundColor: `${brand.primaryColor}10`,
            borderColor: `${brand.primaryColor}30`
          }}
        >
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-[#080b11] shrink-0 shadow-lg"
            style={{ backgroundColor: brand.primaryColor }}
          >
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display text-sm font-bold text-[#f1f5f9]">
              Acesso ao Portal do Aluno
            </h4>
            <p className="text-[#94a3b8] text-[11px] mt-0.5">
              O aluno pode acessar pelo link direto ou conectar usando Google/E-mail para ver a ficha atualizada e registrar cargas offline no salão.
            </p>
          </div>
        </div>

        {/* Link Box */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-[#00f0ff]" />
            Link de Acesso Direto ao Portal
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-[#00f0ff] font-mono select-all focus:outline-none"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="shrink-0 border-[#1e293b] text-[#f1f5f9] hover:border-[#00f0ff] font-bold flex items-center gap-1.5 py-2.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Link</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Credentials & PIN Card */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#f1f5f9] flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-400" />
              Credenciais de Acesso do Aluno
            </span>
            <Badge variant="accent">Pronto para Uso</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-[#080b11] p-3 rounded-xl border border-[#1e293b]">
              <span className="text-[10px] text-[#64748b] block font-bold uppercase">E-mail Cadastrado</span>
              <span className="font-mono text-[#f1f5f9] font-bold truncate block mt-0.5">{studentEmail}</span>
            </div>
            <div className="bg-[#080b11] p-3 rounded-xl border border-[#1e293b]">
              <span className="text-[10px] text-[#64748b] block font-bold uppercase">Senha Padrão / PIN</span>
              <span className="font-mono text-[#00f0ff] font-extrabold text-sm block mt-0.5">{studentPass}</span>
            </div>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* WhatsApp Direct */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all text-xs"
          >
            <Send className="w-4 h-4" />
            <span>Enviar no WhatsApp</span>
          </a>

          {/* Toggle QR Code */}
          <Button
            variant="outline"
            onClick={() => setShowQr(!showQr)}
            className="w-full border-[#1e293b] hover:border-[#00f0ff]/50 text-[#f1f5f9] font-bold py-3 flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4 text-[#00f0ff]" />
            <span>{showQr ? 'Ocultar QR Code' : 'Mostrar QR Code no Tela'}</span>
          </Button>
        </div>

        {/* QR Code visual box */}
        {showQr && (
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 text-center space-y-3 animate-fade-in">
            <div className="w-44 h-44 bg-white p-3 rounded-xl mx-auto flex flex-col items-center justify-center border-4 border-[#00f0ff] shadow-2xl">
              {/* Simulated QR matrix visual */}
              <div className="w-full h-full bg-slate-900 rounded-lg p-2 flex flex-col justify-between items-center text-white">
                <div className="flex justify-between w-full">
                  <div className="w-8 h-8 bg-white border-2 border-black rounded" />
                  <div className="w-8 h-8 bg-white border-2 border-black rounded" />
                </div>
                <div className="text-[9px] font-mono font-bold text-[#00f0ff] tracking-tight">
                  KINETIX QR
                </div>
                <div className="flex justify-between w-full">
                  <div className="w-8 h-8 bg-white border-2 border-black rounded" />
                  <div className="w-4 h-4 bg-[#00f0ff] rounded-full animate-ping" />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[#94a3b8]">
              Mostre este QR Code no celular ou tablet para o aluno apontar a câmera e abrir a ficha instantaneamente.
            </p>
          </div>
        )}

        {/* Offline-First Instructions */}
        <div className="bg-[#0f172a]/60 border border-[#1e293b] p-3.5 rounded-xl space-y-1.5 text-[11px] text-[#94a3b8]">
          <div className="font-bold text-[#f1f5f9] flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-[#00f0ff]" />
            Ativação do App Offline no Salão
          </div>
          <p>
            O aluno pode clicar em <strong>"Adicionar à Tela Inicial"</strong> no navegador do celular. O aplicativo funcionará normalmente no salão de musculação sem internet, salvando cargas e séries localmente!
          </p>
        </div>
      </div>
    </Modal>
  );
};
