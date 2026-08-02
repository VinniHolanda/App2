import React, { useState } from 'react';
import { MailCheck, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Primitives';
import { useAuth } from '../../context/AuthContext';

export const VerifyEmailScreen: React.FC = () => {
  const { currentUser, resendVerificationEmail, checkEmailVerified, logout } = useAuth();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sent, setSent] = useState(false);
  const [notYetVerified, setNotYetVerified] = useState(false);

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerificationEmail();
      setSent(true);
    } catch (e) {
      console.warn('Erro ao reenviar e-mail de verificação:', e);
    } finally {
      setSending(false);
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    setNotYetVerified(false);
    try {
      const verified = await checkEmailVerified();
      if (!verified) setNotYetVerified(true);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-[#f1f5f9] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#0f172a] border border-[#1e293b] rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-[#1e293b] flex items-center justify-center mx-auto mb-4">
          <MailCheck className="w-7 h-7 text-[#38bdf8]" />
        </div>
        <h1 className="text-lg font-bold mb-2">Confirme seu e-mail</h1>
        <p className="text-sm text-[#94a3b8] mb-1">
          Enviamos um link de confirmação para:
        </p>
        <p className="text-sm font-bold text-[#f1f5f9] mb-6">{currentUser?.email}</p>
        <p className="text-xs text-[#64748b] mb-6">
          Clique no link do e-mail e depois volte aqui e toque em "Já confirmei".
          Verifique também a caixa de spam.
        </p>

        <Button onClick={handleCheck} disabled={checking} className="w-full mb-3">
          <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Verificando...' : 'Já confirmei'}
        </Button>

        {notYetVerified && (
          <p className="text-xs text-[#f87171] mb-3">
            Ainda não identificamos a confirmação. Aguarde alguns segundos após clicar no link e tente de novo.
          </p>
        )}

        <button
          onClick={handleResend}
          disabled={sending}
          className="text-xs text-[#94a3b8] hover:text-[#f1f5f9] underline mb-4 block w-full"
        >
          {sending ? 'Reenviando...' : sent ? 'E-mail reenviado ✓' : 'Reenviar e-mail de confirmação'}
        </button>

        <button
          onClick={logout}
          className="text-xs text-[#64748b] hover:text-[#f1f5f9] flex items-center justify-center gap-1 mx-auto"
        >
          <LogOut className="w-3.5 h-3.5" /> Sair e usar outra conta
        </button>
      </div>
    </div>
  );
};
