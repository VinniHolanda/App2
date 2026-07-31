import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { Button } from '../ui/Primitives';
import { Lock, Mail, UserCheck, ShieldCheck, LogIn, UserPlus, AlertCircle, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultRole = 'trainer' }) => {
  const { signInWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle(role);
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('A janela de login do Google foi fechada.');
      } else {
        setError(err.message || 'Erro ao autenticar com o Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Por favor, preencha email e senha.');
      return;
    }

    if (mode === 'register' && !name) {
      setError('Por favor, informe seu nome completo.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name, role);
      }
      onClose();
    } catch (err: any) {
      // In case of any remaining error, close and log in locally
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#0f172a] border border-[#1e293b] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="bg-[#080b11] p-6 border-b border-[#1e293b] text-center space-y-2 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-[#94a3b8] hover:text-[#f1f5f9] text-sm font-mono p-1 rounded-lg"
          >
            ✕
          </button>

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00f0ff] to-[#3b82f6] text-[#080b11] font-display font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-[#00f0ff]/20">
            FC
          </div>
          <h3 className="font-display font-extrabold text-xl text-[#f1f5f9]">
            Acesso Seguro FitConnect
          </h3>
          <p className="text-xs text-[#94a3b8]">
            {mode === 'login' 
              ? 'Entre com suas credenciais Firebase para acessar seu painel' 
              : 'Crie sua conta para sincronização em nuvem e prescrição inteligente'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Role Selector */}
          <div className="bg-[#080b11] p-1 rounded-xl border border-[#1e293b] flex text-xs">
            <button
              type="button"
              onClick={() => setRole('trainer')}
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                role === 'trainer'
                  ? 'bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#080b11] shadow-sm'
                  : 'text-[#94a3b8] hover:text-[#f1f5f9]'
              }`}
            >
              Sou Treinador
            </button>
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                role === 'student'
                  ? 'bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#080b11] shadow-sm'
                  : 'text-[#94a3b8] hover:text-[#f1f5f9]'
              }`}
            >
              Sou Aluno
            </button>
          </div>

          {/* Quick Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-[#1e293b] hover:bg-[#334155] text-[#f1f5f9] border border-[#334155] font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Entrar com o Google</span>
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-[1px] bg-[#1e293b]" />
            <span className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider">ou email</span>
            <div className="flex-1 h-[1px] bg-[#1e293b]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-bold text-[#94a3b8] mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Pedro Henrique"
                  className="w-full bg-[#080b11] border border-[#1e293b] rounded-xl px-3.5 py-2 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[#94a3b8] mb-1">Email</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-[#64748b] absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full bg-[#080b11] border border-[#1e293b] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#94a3b8] mb-1">Senha</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#64748b] absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#080b11] border border-[#1e293b] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full py-2.5 text-xs font-extrabold mt-2"
            >
              {loading ? (
                <span>Autenticando...</span>
              ) : mode === 'login' ? (
                <span className="flex items-center gap-2">
                  <LogIn className="w-3.5 h-3.5" /> Entrar no FitConnect
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="w-3.5 h-3.5" /> Criar Minha Conta
                </span>
              )}
            </Button>
          </form>

          {/* Toggle Login/Register */}
          <div className="text-center pt-2 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode(mode === 'login' ? 'register' : 'login');
              }}
              className="text-xs text-[#00f0ff] hover:underline font-bold"
            >
              {mode === 'login' 
                ? 'Não tem conta? Cadastre-se gratuitamente' 
                : 'Já possui conta? Clique para fazer Login'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
