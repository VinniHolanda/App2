import fs from 'fs';

const path = 'src/presentation/views/ClientDetailView.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                  <div className="flex items-center gap-2">
                    {isEditMode ? (
                      <Button size="sm" variant="primary" onClick={() => {
                        if (onSaveClient && editedProgram) {
                          onSaveClient({ ...client, program: editedProgram });
                        }
                        setIsEditMode(false);
                      }}>
                        <Check className="w-4 h-4 mr-1" /> Concluir edição
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditedProgram(JSON.parse(JSON.stringify(client.program)));
                        setIsEditMode(true);
                      }} className="border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/10">
                        <Edit2 className="w-4 h-4 mr-1" /> Editar treino
                      </Button>
                    )}
                  </div>`;

const replacement = `                  <div className="flex items-center gap-2">
                    {isEditMode ? (
                      <Button size="sm" variant="primary" onClick={() => {
                        if (onSaveClient && editedProgram) {
                          onSaveClient({ ...client, program: editedProgram });
                        }
                        setIsEditMode(false);
                      }}>
                        <Check className="w-4 h-4 mr-1" /> Concluir edição
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setShowSaveTemplateModal(true)} className="border-[#1e293b] text-[#f1f5f9] hover:bg-[#1e293b]">
                          <Save className="w-4 h-4 mr-1" /> Salvar como template
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditedProgram(JSON.parse(JSON.stringify(client.program)));
                          setIsEditMode(true);
                        }} className="border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/10">
                          <Edit2 className="w-4 h-4 mr-1" /> Editar treino
                        </Button>
                      </>
                    )}
                  </div>`;

content = content.replace(target, replacement);

const target2 = `          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMesoModal(true)}
              className="border-[#1e293b] text-[#f1f5f9] hover:bg-[#1e293b] text-xs font-bold"
            >
              Planejar Mesociclo
            </Button>`;

const replacement2 = `          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateLibrary(true)}
              className="border-[#1e293b] text-[#f1f5f9] hover:bg-[#1e293b] text-xs font-bold flex items-center gap-1.5"
            >
              <Library className="w-3.5 h-3.5" />
              Templates
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMesoModal(true)}
              className="border-[#1e293b] text-[#f1f5f9] hover:bg-[#1e293b] text-xs font-bold"
            >
              Planejar Mesociclo
            </Button>`;

content = content.replace(target2, replacement2);

fs.writeFileSync(path, content, 'utf8');
