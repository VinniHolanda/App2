import fs from 'fs';

const path = 'src/presentation/views/ClientDetailView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { Maximize2, Minimize2, Target, Sparkles, Activity, X, Calendar, List, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Clock, Plus, Trash2, Check, Share2, Edit2 } from 'lucide-react';",
  "import { Maximize2, Minimize2, Target, Sparkles, Activity, X, Calendar, List, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Clock, Plus, Trash2, Check, Share2, Edit2, Save, Library } from 'lucide-react';\nimport { TemplateLibraryModal } from '../components/trainer/TemplateLibraryModal';\nimport { templateRepository } from '../../data/repositories/TemplateRepository';"
);

const stateTarget = `  // Inline Quick Editor State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedProgram, setEditedProgram] = useState<Program | null>(null);`;
  
const stateReplacement = `  // Inline Quick Editor State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedProgram, setEditedProgram] = useState<Program | null>(null);

  // Templates State
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');`;

content = content.replace(stateTarget, stateReplacement);

fs.writeFileSync(path, content, 'utf8');
