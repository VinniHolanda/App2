import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTrainerViewModel } from './presentation/viewmodels/useTrainerViewModel';
import { TrainerDashboardView } from './presentation/views/TrainerDashboardView';
import { ClientDetailView } from './presentation/views/ClientDetailView';
import { StudentPortalView } from './presentation/views/StudentPortalView';
import { ExerciseLibraryView } from './presentation/views/ExerciseLibraryView';
import { TrainerScheduleView } from './presentation/views/TrainerScheduleView';
import { StudioBrandView } from './presentation/views/StudioBrandView';
import { Button, Modal, Badge } from './presentation/components/ui/Primitives';
import { Layers, Activity, Dumbbell, ShieldCheck, Cpu, Layout, Sparkles, BookOpen, Users, LogIn, LogOut, Calendar, Palette } from 'lucide-react';
import { GeminiChatbot } from './presentation/components/ai/GeminiChatbot';
import { PwaInstallBanner } from './presentation/components/pwa/PwaInstallBanner';
import { useAuth } from './presentation/context/AuthContext';
import { AuthModal } from './presentation/components/auth/AuthModal';
import { WelcomeRoleModal } from './presentation/components/auth/WelcomeRoleModal';
import { BrandProvider, useBrand } from './presentation/context/BrandContext';

function MainAppContent() {
  const trainerVm = useTrainerViewModel();
  const { currentUser, userProfile, logout, setProfileRole } = useAuth();
  const { brand } = useBrand();
  const [appRole, setAppRole] = useState<'trainer' | 'student'>('trainer');
  const [showArchDocModal, setShowArchDocModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Check URL params for invite link or open initial role selector
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteId = params.get('studentId') || params.get('invite');
    if (inviteId) {
      setAppRole('student');
      localStorage.setItem('fitconnect_student_id', inviteId);
    } else {
      const hasSeenWelcome = localStorage.getItem('fitconnect_welcome_seen');
      if (!hasSeenWelcome) {
        setShowWelcomeModal(true);
      }
    }
  }, []);

  // Sync appRole with userProfile role if available
  useEffect(() => {
    if (userProfile?.role) {
      setAppRole(userProfile.role);
    }
  }, [userProfile]);

  const handleRoleSwitch = (newRole: 'trainer' | 'student', studentId?: string) => {
    setAppRole(newRole);
    if (studentId) {
      localStorage.setItem('fitconnect_student_id', studentId);
    }
    localStorage.setItem('fitconnect_welcome_seen', 'true');
    if (currentUser) {
      setProfileRole(newRole);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-[#f1f5f9] font-sans antialiased flex flex-col overflow-x-hidden">
      {/* Toast Floating Alert */}
      {trainerVm.toastMessage && (
        <div 
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a] text-[#f1f5f9] px-5 py-2.5 rounded-full shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce"
          style={{ borderColor: brand.primaryColor, borderWidth: '1px' }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: brand.primaryColor }} />
          {trainerVm.toastMessage}
        </div>
      )}

      {/* Main Top Header */}
      <header className="sticky top-0 z-40 bg-[#080b11]/85 backdrop-blur-md border-b border-[#1e293b] px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {brand.logoUrl ? (
            <img 
              src={brand.logoUrl} 
              alt="Logo do Estúdio" 
              className="w-9 h-9 rounded-xl object-contain bg-[#0f172a] p-1 border border-[#1e293b]"
            />
          ) : (
            <div 
              className="w-9 h-9 rounded-xl text-[#080b11] flex items-center justify-center font-display font-black text-sm shadow-md"
              style={{
                background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.secondaryColor})`
              }}
            >
              {brand.shortInitials || 'KS'}
            </div>
          )}
          <div>
            <h1 className="font-display font-extrabold text-lg text-[#f1f5f9] tracking-tight leading-none flex items-center gap-1.5">
              <span>{brand.studioName || 'Kinetix Studio'}</span>
              <span 
                className="text-[10px] font-mono px-1.5 py-0.5 rounded border font-bold"
                style={{
                  backgroundColor: `${brand.primaryColor}20`,
                  color: brand.primaryColor,
                  borderColor: `${brand.primaryColor}40`
                }}
              >
                PRO
              </span>
            </h1>
            <span className="text-[10px] text-[#94a3b8] font-semibold">{brand.tagline || 'Plataforma de Prescrição & Conexão Esportiva'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* PWA Installation & Status Badge */}
          <PwaInstallBanner />

          {/* Architecture & Evaluation Guide button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchDocModal(true)}
            className="text-xs border border-[#1e293b] hover:border-[#00f0ff]/40 hidden lg:flex"
          >
            <Layers className="w-3.5 h-3.5" style={{ color: brand.primaryColor }} />
            <span>Guia de Arquitetura</span>
          </Button>

          {/* Mode Switcher */}
          <div className="bg-[#0f172a] p-1 rounded-xl border border-[#1e293b] flex gap-1 text-xs items-center">
            <button
              onClick={() => handleRoleSwitch('trainer')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                appRole === 'trainer'
                  ? 'text-[#080b11] shadow-sm'
                  : 'text-[#94a3b8] hover:text-[#f1f5f9]'
              }`}
              style={{
                background: appRole === 'trainer' ? `linear-gradient(135deg, ${brand.primaryColor}, ${brand.secondaryColor})` : undefined
              }}
            >
              Treinador
            </button>
            <button
              onClick={() => handleRoleSwitch('student')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                appRole === 'student'
                  ? 'text-[#080b11] shadow-sm'
                  : 'text-[#94a3b8] hover:text-[#f1f5f9]'
              }`}
              style={{
                background: appRole === 'student' ? `linear-gradient(135deg, ${brand.primaryColor}, ${brand.secondaryColor})` : undefined
              }}
            >
              Portal Aluno
            </button>
            <button
              onClick={() => setShowWelcomeModal(true)}
              title="Trocar perfil ou modo de login"
              className="px-2 py-1.5 text-[#64748b] hover:text-[#00f0ff] transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Firebase Authentication Widget */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-[#0f172a] border border-[#1e293b] rounded-xl px-2.5 py-1 text-xs">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px]"
                style={{
                  backgroundColor: `${brand.primaryColor}20`,
                  color: brand.primaryColor
                }}
              >
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" className="w-6 h-6 rounded-full" />
                ) : (
                  (userProfile?.displayName || currentUser.email || 'U')[0].toUpperCase()
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-bold text-[#f1f5f9] text-[11px] truncate max-w-[110px]">
                  {userProfile?.displayName || currentUser.email?.split('@')[0]}
                </div>
                <div className="text-[9px] font-mono flex items-center gap-1" style={{ color: brand.primaryColor }}>
                  <ShieldCheck className="w-2.5 h-2.5 shrink-0" />
                  <span>Firebase Auth</span>
                </div>
              </div>
              <button
                onClick={() => logout()}
                title="Sair da conta"
                className="p-1 text-[#94a3b8] hover:text-red-400 rounded-lg hover:bg-[#1e293b] transition-colors cursor-pointer ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAuthModal(true)}
              className="text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 shadow-md"
              style={{
                backgroundColor: brand.primaryColor,
                color: '#080b11'
              }}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </Button>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultRole={appRole}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {/* Trainer Navigation Sub-Bar */}
        {appRole === 'trainer' && (
          <div className="mb-6 flex items-center justify-between border-b border-[#1e293b] pb-3 overflow-x-auto">
            <div className="flex gap-2">
              <button
                onClick={() => trainerVm.setActiveNavTab('dashboard')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                  trainerVm.activeNavTab === 'dashboard' || trainerVm.activeNavTab === 'client-detail'
                    ? 'text-[#080b11] shadow-md'
                    : 'bg-[#0f172a] border border-[#1e293b] text-[#94a3b8] hover:text-[#f1f5f9] hover:border-white/30'
                }`}
                style={{
                  backgroundColor: (trainerVm.activeNavTab === 'dashboard' || trainerVm.activeNavTab === 'client-detail') ? brand.primaryColor : undefined
                }}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Gestão de Alunos</span>
              </button>

              <button
                onClick={() => trainerVm.setActiveNavTab('library')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                  trainerVm.activeNavTab === 'library'
                    ? 'text-[#080b11] shadow-md'
                    : 'bg-[#0f172a] border border-[#1e293b] text-[#94a3b8] hover:text-[#f1f5f9] hover:border-white/30'
                }`}
                style={{
                  backgroundColor: trainerVm.activeNavTab === 'library' ? brand.primaryColor : undefined
                }}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Biblioteca de Exercícios</span>
              </button>

              <button
                onClick={() => trainerVm.setActiveNavTab('agenda')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                  trainerVm.activeNavTab === 'agenda'
                    ? 'text-[#080b11] shadow-md'
                    : 'bg-[#0f172a] border border-[#1e293b] text-[#94a3b8] hover:text-[#f1f5f9] hover:border-white/30'
                }`}
                style={{
                  backgroundColor: trainerVm.activeNavTab === 'agenda' ? brand.primaryColor : undefined
                }}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Agenda & Presença</span>
              </button>

              <button
                onClick={() => trainerVm.setActiveNavTab('brand')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                  trainerVm.activeNavTab === 'brand'
                    ? 'text-[#080b11] shadow-md'
                    : 'bg-[#0f172a] border border-[#1e293b] text-[#94a3b8] hover:text-[#f1f5f9] hover:border-white/30'
                }`}
                style={{
                  backgroundColor: trainerVm.activeNavTab === 'brand' ? brand.primaryColor : undefined
                }}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Branding & Marca</span>
              </button>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {appRole === 'trainer' ? (
            <motion.div
              key="trainer-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
            >
              <AnimatePresence mode="wait">
                {trainerVm.activeNavTab === 'dashboard' && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TrainerDashboardView
                      clients={trainerVm.clients}
                      onSelectClient={(id, tab) => {
                        trainerVm.selectClient(id);
                        if (tab) trainerVm.setActiveClientTab(tab as any);
                      }}
                      onSaveClient={trainerVm.handleSaveClient}
                      onOpenLibrary={() => trainerVm.setActiveNavTab('library')}
                      onApplyAutoDeload={trainerVm.handleApplyDeload}
                    />
                  </motion.div>
                )}

                {trainerVm.activeNavTab === 'library' && (
                  <motion.div
                    key="library"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ExerciseLibraryView />
                  </motion.div>
                )}

                {trainerVm.activeNavTab === 'agenda' && (
                  <motion.div
                    key="agenda"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TrainerScheduleView
                      clients={trainerVm.clients}
                      onSaveClassBooking={trainerVm.handleSaveClassBooking}
                      onUpdateBookingStatus={trainerVm.handleUpdateBookingStatus}
                      onDeleteClassBooking={trainerVm.handleDeleteClassBooking}
                      onSelectClient={(id) => trainerVm.selectClient(id)}
                    />
                  </motion.div>
                )}

                {trainerVm.activeNavTab === 'brand' && (
                  <motion.div
                    key="brand"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <StudioBrandView />
                  </motion.div>
                )}

                {trainerVm.activeNavTab === 'client-detail' && trainerVm.selectedClient && (
                  <motion.div
                    key="client-detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      onClick={() => trainerVm.setActiveNavTab('dashboard')}
                      className="mb-4 text-xs text-[#94a3b8] hover:text-[#00f0ff] font-semibold flex items-center gap-1 transition-colors"
                    >
                      ← Voltar ao Painel Geral
                    </button>

                    <ClientDetailView
                      client={trainerVm.selectedClient}
                      activeTab={trainerVm.activeClientTab}
                      onSelectTab={trainerVm.setActiveClientTab}
                      onGenerateProgram={trainerVm.handleGenerateNewProgram}
                      onApplyAutoMeso={trainerVm.handleApplyAutoMeso}
                      onDeleteClient={trainerVm.handleDeleteClient}
                      onSendMessage={trainerVm.handleSendTrainerMessage}
                      onAddSession={trainerVm.handleAddSession}
                      onMoveSession={trainerVm.handleMoveSession}
                      onDeleteSession={trainerVm.handleDeleteSession}
                      onSaveClassBooking={trainerVm.handleSaveClassBooking}
                      onUpdateBookingStatus={trainerVm.handleUpdateBookingStatus}
                      onDeleteClassBooking={trainerVm.handleDeleteClassBooking}
                      onSaveClient={trainerVm.handleSaveClient}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="student-portal-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
            >
              <StudentPortalView
                clientId={trainerVm.selectedClientId || trainerVm.clients?.[0]?.id || ''}
                onBackToTrainer={() => setAppRole('trainer')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Architecture Analysis & Structure Modal */}
      <WelcomeRoleModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        onSelectRole={(role, studentId) => handleRoleSwitch(role, studentId)}
      />

      <Modal
        isOpen={showArchDocModal}
        onClose={() => setShowArchDocModal(false)}
        title="Arquitetura e Personalização da Plataforma"
      >
        <div className="space-y-6 text-xs leading-relaxed text-[#f1f5f9]">
          <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-xl space-y-2">
            <h4 className="font-display text-sm font-bold flex items-center gap-2" style={{ color: brand.primaryColor }}>
              <Sparkles className="w-4 h-4" />
              1. White-Label & Personalização de Marca
            </h4>
            <p className="text-[#94a3b8]">
              O estúdio e o treinador têm total liberdade para definir o nome da sua consultoria, cores primárias/secundárias, logotipo e mensagens exclusivas para os alunos.
            </p>
          </div>

          <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-xl space-y-2">
            <h4 className="font-display text-sm font-bold flex items-center gap-2" style={{ color: brand.primaryColor }}>
              <Layers className="w-4 h-4" />
              2. Arquitetura Desacoplada (Clean Arch + MVVM)
            </h4>
            <p className="text-[#94a3b8]">
              Entidades de domínio puras sem dependência de UI, ViewModel reativo em hooks e camada de apresentação totalmente desacoplada.
            </p>
          </div>
        </div>
      </Modal>

      {/* Floating Multi-Turn Gemini AI Assistant */}
      <GeminiChatbot initialRole={appRole === 'trainer' ? 'physio' : 'coach'} />
    </div>
  );
}

export default function App() {
  return (
    <BrandProvider>
      <MainAppContent />
    </BrandProvider>
  );
}

