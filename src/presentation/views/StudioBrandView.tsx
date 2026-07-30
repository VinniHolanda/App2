import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useBrand, PRESET_BRAND_COLORS, StudioBrand } from '../context/BrandContext';
import { Button, Card, Badge } from '../components/ui/Primitives';
import { 
  Palette, 
  Building2, 
  Sparkles, 
  Check, 
  Upload, 
  Image as ImageIcon, 
  RefreshCw, 
  Save, 
  Smartphone, 
  MessageSquare, 
  Globe, 
  Instagram, 
  Phone, 
  Eye, 
  Crown,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Dumbbell
} from 'lucide-react';

export const StudioBrandView: React.FC = () => {
  const { brand, updateBrand, resetBrand } = useBrand();

  const [formData, setFormData] = useState<StudioBrand>({ ...brand });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(brand.logoUrl);

  const handleInputChange = (field: keyof StudioBrand, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePresetColorSelect = (hex: string, secondary: string) => {
    setFormData(prev => ({
      ...prev,
      primaryColor: hex,
      secondaryColor: secondary
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Por favor, selecione uma imagem menor que 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setFormData(prev => ({ ...prev, logoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    setFormData(prev => ({ ...prev, logoUrl: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBrand(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Deseja restaurar as configurações originais da marca?')) {
      resetBrand();
      setFormData(brand);
      setLogoPreview('');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] border border-[#1e293b] rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div 
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none transition-colors duration-500"
          style={{ backgroundColor: formData.primaryColor }}
        />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/5 border border-white/10" style={{ color: formData.primaryColor }}>
              <Crown className="w-3.5 h-3.5" />
              <span>Personalização White-Label & Marca</span>
            </div>
            <h2 className="font-display font-black text-2xl md:text-3xl text-[#f1f5f9] tracking-tight">
              Branding & Identidade do Estúdio
            </h2>
            <p className="text-xs md:text-sm text-[#94a3b8] max-w-xl leading-relaxed">
              Defina o nome do seu estúdio, cores da sua marca, logotipo e mensagens personalizadas para que todos os seus alunos vejam a sua identidade exclusiva.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              className="text-xs py-2.5 px-4 bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] hover:text-[#f1f5f9] border-none"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Restaurar Padrão
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="text-xs font-extrabold py-2.5 px-5 shadow-lg shadow-black/40 flex items-center gap-2"
              style={{
                backgroundColor: formData.primaryColor,
                color: '#080b11'
              }}
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              Salvar Alterações
            </Button>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {savedSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl flex items-center gap-3 shadow-lg"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs font-bold">
            Marca e cores salvas com sucesso! As alterações já estão aplicadas em todo o app e portal dos alunos.
          </div>
        </motion.div>
      )}

      {/* Main Grid: Form + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Customization Controls (7 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Studio Identity */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 md:p-6 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <Building2 className="w-4 h-4" style={{ color: formData.primaryColor }} />
              <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-[#f1f5f9]">
                1. Identidade do Estúdio / Treinador
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#94a3b8]">Nome do Estúdio / Consultoria *</label>
                <input
                  type="text"
                  required
                  value={formData.studioName}
                  onChange={e => handleInputChange('studioName', e.target.value)}
                  placeholder="Ex: Kinetix Studio, Elite Training..."
                  className="w-full bg-[#080b11] border border-[#1e293b] focus:border-white/40 rounded-xl px-3.5 py-2.5 text-xs text-[#f1f5f9] outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#94a3b8]">Sigla / Iniciais (Logotipo) *</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={formData.shortInitials}
                  onChange={e => handleInputChange('shortInitials', e.target.value.toUpperCase())}
                  placeholder="Ex: KS, ET, VP"
                  className="w-full bg-[#080b11] border border-[#1e293b] focus:border-white/40 rounded-xl px-3.5 py-2.5 text-xs text-[#f1f5f9] font-mono font-bold uppercase outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#94a3b8]">Slogan ou Subtítulo Oficial</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={e => handleInputChange('tagline', e.target.value)}
                placeholder="Ex: Inteligência em Prescrição & Consultoria Esportiva"
                className="w-full bg-[#080b11] border border-[#1e293b] focus:border-white/40 rounded-xl px-3.5 py-2.5 text-xs text-[#f1f5f9] outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#94a3b8]">Nome do Treinador Principal</label>
              <input
                type="text"
                value={formData.trainerName}
                onChange={e => handleInputChange('trainerName', e.target.value)}
                placeholder="Ex: Treinador Vinicius Holanda"
                className="w-full bg-[#080b11] border border-[#1e293b] focus:border-white/40 rounded-xl px-3.5 py-2.5 text-xs text-[#f1f5f9] outline-none transition-colors"
              />
            </div>

            {/* Custom Logo Upload */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-[#94a3b8] flex items-center justify-between">
                <span>Logotipo Personalizado (Opcional)</span>
                <span className="text-[10px] text-[#64748b]">PNG / JPG / SVG (máx. 2MB)</span>
              </label>

              {logoPreview ? (
                <div className="flex items-center justify-between p-3 bg-[#080b11] border border-[#1e293b] rounded-xl">
                  <div className="flex items-center gap-3">
                    <img 
                      src={logoPreview} 
                      alt="Logo do Estúdio" 
                      className="w-10 h-10 rounded-lg object-contain bg-[#1e293b]/50 p-1 border border-white/10"
                    />
                    <div>
                      <div className="text-xs font-bold text-[#f1f5f9]">Logotipo Carregado</div>
                      <div className="text-[10px] text-emerald-400 font-semibold">Ativo em todo o sistema</div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveLogo}
                    className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Remover
                  </Button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-[#1e293b] hover:border-white/30 bg-[#080b11]/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center">
                  <Upload className="w-6 h-6 text-[#94a3b8]" />
                  <div className="text-xs font-bold text-[#f1f5f9]">Clique para enviar o logotipo da sua marca</div>
                  <div className="text-[10px] text-[#64748b]">Caso não envie, o sistema gerará o ícone com a sua sigla ({formData.shortInitials || 'KS'})</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Section 2: Color Palette */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 md:p-6 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <Palette className="w-4 h-4" style={{ color: formData.primaryColor }} />
              <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-[#f1f5f9]">
                2. Paleta de Cores da Marca
              </h3>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94a3b8]">Paletas e Combinações Prontas</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PRESET_BRAND_COLORS.map(p => {
                  const isSelected = formData.primaryColor.toLowerCase() === p.hex.toLowerCase();
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handlePresetColorSelect(p.hex, p.secondary)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                        isSelected 
                          ? 'border-white bg-white/10 shadow-lg scale-[1.02]' 
                          : 'border-[#1e293b] bg-[#080b11] hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="w-4 h-4 rounded-full border border-black/30 shadow-sm shrink-0" 
                          style={{ backgroundColor: p.hex }}
                        />
                        <span 
                          className="w-3 h-3 rounded-full border border-black/30 shrink-0" 
                          style={{ backgroundColor: p.secondary }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-[#f1f5f9] truncate">{p.name.split(' ')[0]} {p.name.split(' ')[1] || ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#94a3b8] flex items-center justify-between">
                  <span>Cor Primária (Hex)</span>
                  <span className="font-mono text-[11px]" style={{ color: formData.primaryColor }}>{formData.primaryColor}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={e => handleInputChange('primaryColor', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-[#1e293b] bg-[#080b11] cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={e => handleInputChange('primaryColor', e.target.value)}
                    className="flex-1 bg-[#080b11] border border-[#1e293b] focus:border-white/40 rounded-xl px-3 py-2 text-xs font-mono text-[#f1f5f9] outline-none uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#94a3b8] flex items-center justify-between">
                  <span>Cor Secundária (Gradients)</span>
                  <span className="font-mono text-[11px]" style={{ color: formData.secondaryColor }}>{formData.secondaryColor}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={e => handleInputChange('secondaryColor', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-[#1e293b] bg-[#080b11] cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.secondaryColor}
                    onChange={e => handleInputChange('secondaryColor', e.target.value)}
                    className="flex-1 bg-[#080b11] border border-[#1e293b] focus:border-white/40 rounded-xl px-3 py-2 text-xs font-mono text-[#f1f5f9] outline-none uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Student Portal & Contacts */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 md:p-6 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <Smartphone className="w-4 h-4" style={{ color: formData.primaryColor }} />
              <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-[#f1f5f9]">
                3. Experiência do Aluno & Suporte
              </h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#94a3b8]">Mensagem de Boas-Vindas no Portal do Aluno</label>
              <textarea
                rows={2}
                value={formData.welcomeMessageStudent}
                onChange={e => handleInputChange('welcomeMessageStudent', e.target.value)}
                placeholder="Mensagem exibida no topo do portal dos seus alunos..."
                className="w-full bg-[#080b11] border border-[#1e293b] focus:border-white/40 rounded-xl p-3 text-xs text-[#f1f5f9] outline-none resize-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#94a3b8] flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-emerald-400" /> WhatsApp da Consultoria
                </label>
                <input
                  type="text"
                  value={formData.whatsappNumber || ''}
                  onChange={e => handleInputChange('whatsappNumber', e.target.value)}
                  placeholder="Ex: 5511999998888"
                  className="w-full bg-[#080b11] border border-[#1e293b] focus:border-white/40 rounded-xl px-3.5 py-2.5 text-xs text-[#f1f5f9] outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#94a3b8] flex items-center gap-1.5">
                  <Instagram className="w-3 h-3 text-pink-400" /> Instagram do Estúdio
                </label>
                <input
                  type="text"
                  value={formData.instagramHandle || ''}
                  onChange={e => handleInputChange('instagramHandle', e.target.value)}
                  placeholder="Ex: @kinetix.studio"
                  className="w-full bg-[#080b11] border border-[#1e293b] focus:border-white/40 rounded-xl px-3.5 py-2.5 text-xs text-[#f1f5f9] outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              className="text-xs font-extrabold py-3 px-8 shadow-xl flex items-center gap-2"
              style={{
                backgroundColor: formData.primaryColor,
                color: '#080b11'
              }}
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              SALVAR E APLICAR BRANDING
            </Button>
          </div>
        </form>

        {/* Right Column: Live Interactive Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6 sticky top-24">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#94a3b8]" />
                <h3 className="font-display font-extrabold text-xs uppercase tracking-wider text-[#f1f5f9]">
                  Prévia em Tempo Real
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10" style={{ color: formData.primaryColor }}>
                Modo Aluno
              </Badge>
            </div>

            {/* Simulated Header Preview */}
            <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-3">
                {formData.logoUrl ? (
                  <img 
                    src={formData.logoUrl} 
                    alt="Logo" 
                    className="w-8 h-8 rounded-lg object-contain bg-[#1e293b]/50 p-0.5 border border-white/10"
                  />
                ) : (
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-black text-xs text-[#080b11] shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})`
                    }}
                  >
                    {formData.shortInitials || 'KS'}
                  </div>
                )}
                <div>
                  <div className="font-display font-black text-sm text-[#f1f5f9] tracking-tight leading-none flex items-center gap-1.5">
                    <span>{formData.studioName || 'Kinetix Studio'}</span>
                    <span 
                      className="text-[9px] font-mono px-1 py-0.2 rounded border font-bold"
                      style={{
                        backgroundColor: `${formData.primaryColor}20`,
                        color: formData.primaryColor,
                        borderColor: `${formData.primaryColor}40`
                      }}
                    >
                      PRO
                    </span>
                  </div>
                  <div className="text-[9px] text-[#94a3b8] truncate max-w-[170px]">
                    {formData.tagline || 'Inteligência em Prescrição'}
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Student Welcome Card Preview */}
            <div 
              className="border rounded-2xl p-4 space-y-3 relative overflow-hidden"
              style={{
                backgroundColor: '#080b11',
                borderColor: `${formData.primaryColor}30`
              }}
            >
              <div 
                className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-15 blur-2xl pointer-events-none"
                style={{ backgroundColor: formData.primaryColor }}
              />

              <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#94a3b8]">PORTAL DO ALUNO</span>
                  <span 
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${formData.primaryColor}20`,
                      color: formData.primaryColor
                    }}
                  >
                    ● Ativo
                  </span>
                </div>

                <div className="text-sm font-extrabold text-[#f1f5f9]">
                  {formData.welcomeMessageStudent || 'Bem-vindo ao portal!'}
                </div>

                <div className="text-[11px] text-[#94a3b8] flex items-center gap-1">
                  <Dumbbell className="w-3 h-3" style={{ color: formData.primaryColor }} />
                  <span>Prescrição por: <strong>{formData.trainerName}</strong></span>
                </div>

                {/* Contacts */}
                <div className="pt-2 flex flex-wrap gap-2">
                  {formData.whatsappNumber && (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold">
                      <Phone className="w-2.5 h-2.5" /> WhatsApp Suporte
                    </span>
                  )}
                  {formData.instagramHandle && (
                    <span className="text-[10px] bg-pink-500/10 text-pink-300 border border-pink-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold">
                      <Instagram className="w-2.5 h-2.5" /> {formData.instagramHandle}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Button Theme Preview */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-[#94a3b8]">Estilo de Botões Primários</span>
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl font-extrabold text-xs shadow-lg transition-transform active:scale-95 cursor-default flex items-center justify-center gap-2"
                style={{
                  backgroundColor: formData.primaryColor,
                  color: '#080b11'
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                EXEMPLO DE BOTÃO PRIMÁRIO
              </button>
            </div>

            <div className="text-[10px] text-[#64748b] text-center pt-2 italic">
              ✨ As alterações são salvas e persistidas para todos os acessos do aplicativo.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
