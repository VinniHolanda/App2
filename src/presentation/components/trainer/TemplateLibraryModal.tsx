import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Trash2, CheckCircle2, AlertTriangle, Play } from 'lucide-react';
import { WorkoutTemplate } from '../../../domain/types';
import { templateRepository } from '../../../data/repositories/TemplateRepository';
import { auth } from '../../../lib/firebase';
import { Button, Badge } from '../ui/Primitives';

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: WorkoutTemplate) => void;
}

export const TemplateLibraryModal: React.FC<TemplateLibraryModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate
}) => {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadTemplates = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setIsLoading(true);
    const loaded = await templateRepository.listTemplates(uid);
    setTemplates(loaded.sort((a, b) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.() || 0));
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o template "${name}"?`)) {
      await templateRepository.deleteTemplate(id);
      await loadTemplates();
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.goal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.level?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020817]/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-[#0f172a] border border-[#1e293b] rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-[#1e293b] bg-[#0f172a]">
            <h2 className="text-xl font-display font-bold text-[#f1f5f9] flex items-center gap-2">
              📚 Biblioteca de Templates
            </h2>
            <button onClick={onClose} className="text-[#64748b] hover:text-[#f1f5f9] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b border-[#1e293b] bg-[#0f172a]/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
              <input
                type="text"
                placeholder="Buscar por nome, objetivo ou nível..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#020817] border border-[#1e293b] rounded-xl pl-9 pr-4 py-2 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff] transition-colors"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoading ? (
              <div className="text-center py-10 text-[#64748b]">Carregando templates...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-10 text-[#64748b]">
                {searchTerm ? 'Nenhum template encontrado para sua busca.' : 'Você ainda não salvou nenhum template.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map(t => (
                  <div key={t.id} className="bg-[#020817] border border-[#1e293b] rounded-xl p-4 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-[#f1f5f9] text-base leading-tight">{t.name}</h3>
                      <button 
                        onClick={() => handleDelete(t.id, t.name)}
                        className="text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0 ml-2"
                        title="Excluir Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {t.level && <Badge variant="secondary">{t.level}</Badge>}
                      {t.goal && <Badge variant="accent">{t.goal}</Badge>}
                      <Badge variant="outline">{t.days.length} {t.days.length === 1 ? 'dia' : 'dias'}</Badge>
                    </div>
                    
                    {t.sourceNote && (
                      <p className="text-xs text-[#64748b] mb-4 line-clamp-2 italic">
                        {t.sourceNote}
                      </p>
                    )}

                    <div className="mt-auto pt-4 border-t border-[#1e293b]">
                      <Button 
                        variant="primary" 
                        className="w-full justify-center" 
                        size="sm"
                        onClick={() => {
                          onApplyTemplate(t);
                          onClose();
                        }}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Aplicar a este aluno
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
