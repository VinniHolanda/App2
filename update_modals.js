import fs from 'fs';

const path = 'src/presentation/views/ClientDetailView.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `      {/* Student Invite Modal */}
      <StudentInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        client={client}
      />
    </div>
  );
};`;

const replacement = `      {/* Student Invite Modal */}
      <StudentInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        client={client}
      />

      <TemplateLibraryModal
        isOpen={showTemplateLibrary}
        onClose={() => setShowTemplateLibrary(false)}
        onApplyTemplate={(template) => {
          if (!client.program) return;
          const updatedClient = { ...client };
          updatedClient.program = {
            ...updatedClient.program,
            days: JSON.parse(JSON.stringify(template.days))
          };
          if (onSaveClient) {
            onSaveClient(updatedClient);
          }
        }}
      />

      <Modal
        isOpen={showSaveTemplateModal}
        onClose={() => {
          setShowSaveTemplateModal(false);
          setNewTemplateName('');
        }}
        title="Salvar como Template"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#94a3b8]">
            Dê um nome para este template. Ele será salvo na sua biblioteca para uso futuro.
          </p>
          <input
            type="text"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder="Ex: Hipertrofia Avançado 4x"
            className="w-full bg-[#020817] border border-[#1e293b] rounded-xl px-4 py-2 text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowSaveTemplateModal(false)}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={!newTemplateName.trim()}
              onClick={async () => {
                if (client.program) {
                  const newTemplate = {
                    id: crypto.randomUUID(),
                    trainerId: '', // vai ser preenchido no repository
                    name: newTemplateName.trim(),
                    goal: client.goal,
                    level: client.level,
                    createdAt: null,
                    days: JSON.parse(JSON.stringify(client.program.days)),
                    sourceNote: \`Originado de \${client.name}\`
                  };
                  await templateRepository.saveTemplate(newTemplate);
                }
                setShowSaveTemplateModal(false);
                setNewTemplateName('');
              }}
            >
              Salvar Template
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};`;

content = content.replace(target, replacement);

fs.writeFileSync(path, content, 'utf8');
