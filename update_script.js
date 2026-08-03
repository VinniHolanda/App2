import fs from 'fs';

const path = 'src/presentation/views/ClientDetailView.tsx';
let content = fs.readFileSync(path, 'utf8');

const target1 = `            {/* Program Days Display */}
            {client.program ? (
              <div className="space-y-4">
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-2">
                  <h4 className="font-display font-bold text-sm text-[#00f0ff]">Racional da Prescrição</h4>
                  <p className="text-sm text-[#f1f5f9] leading-relaxed">{client.program.summary}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {client.program.principles?.map((p, idx) => (
                      <Badge key={idx} variant="accent">{p}</Badge>
                    ))}
                  </div>
                </div>`;

const replacement1 = `            {/* Program Days Display */}
            {client.program ? (
              <div className="space-y-4">
                <div className="flex flex-wrap justify-between items-center bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 gap-4">
                  <h3 className="font-display font-bold text-base text-[#f1f5f9]">Rotina de Treinos</h3>
                  <div className="flex items-center gap-2">
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
                  </div>
                </div>

                <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-2">
                  <h4 className="font-display font-bold text-sm text-[#00f0ff]">Racional da Prescrição</h4>
                  <p className="text-sm text-[#f1f5f9] leading-relaxed">{client.program.summary}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {client.program.principles?.map((p, idx) => (
                      <Badge key={idx} variant="accent">{p}</Badge>
                    ))}
                  </div>
                </div>`;

content = content.replace(target1, replacement1);

const target2 = `                {(client.program.days || []).map((day, di) => (
                  <motion.div
                    key={di}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: di * 0.08, duration: 0.25 }}
                    className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-3 hover:border-[#1e293b] transition-colors"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-[#1e293b]">
                      <div>
                        <h4 className="font-bold text-base text-[#f1f5f9]">{day.name}</h4>
                        <div className="text-xs text-[#64748b] font-medium">{day.focus}</div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-sans">
                        <thead>
                          <tr className="border-b border-[#1e293b] text-[#64748b] uppercase tracking-wider">
                            <th className="py-2 px-2">Exercício</th>
                            <th className="py-2 px-2">Padrão</th>
                            <th className="py-2 px-2 text-center">Séries</th>
                            <th className="py-2 px-2 text-center">Reps</th>
                            <th className="py-2 px-2 text-center">Descanso</th>
                            <th className="py-2 px-2 text-center">RPE</th>
                            <th className="py-2 px-2 text-center">Método</th>
                            <th className="py-2 px-2 text-right">IA Substituição</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(day.exercises || []).map((ex, ei) => (
                            <tr key={ei} className="border-b border-[#1e293b]/50 hover:bg-[#0f172a] transition-colors">
                              <td className="py-2.5 px-2 font-bold text-[#f1f5f9]">
                                {ex.name}
                                {ex.notes && (
                                  <div className="text-[10px] font-normal text-emerald-400 mt-0.5">{ex.notes}</div>
                                )}
                              </td>
                              <td className="py-2.5 px-2 text-[#94a3b8]">{MOVEMENT_PATTERN_LABELS[ex.pat as keyof typeof MOVEMENT_PATTERN_LABELS] || ex.pat}</td>
                              <td className="py-2.5 px-2 text-center font-mono font-bold text-[#00f0ff]">{ex.sets}</td>
                              <td className="py-2.5 px-2 text-center font-mono text-[#f1f5f9]">{ex.reps}</td>
                              <td className="py-2.5 px-2 text-center text-[#94a3b8]">{ex.rest}</td>
                              <td className="py-2.5 px-2 text-center font-mono text-[#94a3b8]">RPE {ex.rpe}</td>
                              <td className="py-2.5 px-2 text-center">
                                <TrainingMethodBadge 
                                  methodKeyOrName={ex.method || 'tradicional'} 
                                  clientLevel={client.level}
                                  periodizationPhase={client.program?.meso?.weeks?.[0]?.f || 'Base'}
                                  goal={client.goal}
                                />
                              </td>
                              <td className="py-2.5 px-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => setAiSubModal({ isOpen: true, dayIndex: di, exerciseIndex: ei, exercise: ex })}
                                  className="text-[10px] font-bold text-[#00f0ff] hover:bg-[#00f0ff]/10 border border-[#00f0ff]/30 px-2 py-1 rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer"
                                  title="IA Assistente de Substituição Biomecânica"
                                >
                                  <Sparkles className="w-3 h-3 text-[#00f0ff]" />
                                  <span>IA Substituir</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                ))}
              </div>`;

const replacement2 = `                {((isEditMode ? editedProgram?.days : client.program.days) || []).map((day, di) => (
                  <motion.div
                    key={di}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: di * 0.08, duration: 0.25 }}
                    className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-3 hover:border-[#1e293b] transition-colors"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-[#1e293b]">
                      <div>
                        {isEditMode ? (
                          <input 
                            value={day.name} 
                            onChange={(e) => {
                              const newProgram = { ...editedProgram! };
                              newProgram.days[di].name = e.target.value;
                              setEditedProgram(newProgram);
                            }}
                            className="bg-[#0d1420] border border-[#1e293b] rounded p-1 text-sm font-bold text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff] mb-1 block w-64"
                          />
                        ) : (
                          <h4 className="font-bold text-base text-[#f1f5f9]">{day.name}</h4>
                        )}
                        {isEditMode ? (
                          <input 
                            value={day.focus || ''} 
                            onChange={(e) => {
                              const newProgram = { ...editedProgram! };
                              newProgram.days[di].focus = e.target.value;
                              setEditedProgram(newProgram);
                            }}
                            className="bg-[#0d1420] border border-[#1e293b] rounded p-1 text-xs text-[#94a3b8] focus:outline-none focus:border-[#00f0ff] block w-64"
                          />
                        ) : (
                          <div className="text-xs text-[#64748b] font-medium">{day.focus}</div>
                        )}
                      </div>
                      {isEditMode && (
                        <button
                          onClick={() => {
                            if (window.confirm('Remover este dia inteiro?')) {
                              const newProgram = { ...editedProgram! };
                              newProgram.days.splice(di, 1);
                              setEditedProgram(newProgram);
                            }
                          }}
                          className="text-rose-400 hover:text-rose-300 p-2 rounded-lg hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-sans">
                        <thead>
                          <tr className="border-b border-[#1e293b] text-[#64748b] uppercase tracking-wider">
                            <th className="py-2 px-2">Exercício</th>
                            <th className="py-2 px-2">Padrão</th>
                            <th className="py-2 px-2 text-center">Séries</th>
                            <th className="py-2 px-2 text-center">Reps</th>
                            <th className="py-2 px-2 text-center">Descanso</th>
                            <th className="py-2 px-2 text-center">RPE</th>
                            <th className="py-2 px-2 text-center">Método</th>
                            <th className="py-2 px-2 text-right">{isEditMode ? 'Ação' : 'IA Substituição'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(day.exercises || []).map((ex, ei) => (
                            <tr key={ei} className="border-b border-[#1e293b]/50 hover:bg-[#0f172a] transition-colors">
                              <td className="py-2.5 px-2 font-bold text-[#f1f5f9]">
                                {isEditMode ? (
                                  <input 
                                    value={ex.name} 
                                    onChange={(e) => {
                                      const newProgram = { ...editedProgram! };
                                      newProgram.days[di].exercises[ei].name = e.target.value;
                                      setEditedProgram(newProgram);
                                    }}
                                    className="w-full min-w-[120px] bg-[#0d1420] border border-[#1e293b] rounded p-1 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
                                  />
                                ) : (
                                  <>
                                    {ex.name}
                                    {ex.notes && (
                                      <div className="text-[10px] font-normal text-emerald-400 mt-0.5">{ex.notes}</div>
                                    )}
                                  </>
                                )}
                              </td>
                              <td className="py-2.5 px-2 text-[#94a3b8]">{MOVEMENT_PATTERN_LABELS[ex.pat as keyof typeof MOVEMENT_PATTERN_LABELS] || ex.pat}</td>
                              <td className="py-2.5 px-2 text-center font-mono font-bold text-[#00f0ff]">
                                {isEditMode ? (
                                  <input 
                                    value={ex.sets} 
                                    onChange={(e) => {
                                      const newProgram = { ...editedProgram! };
                                      newProgram.days[di].exercises[ei].sets = e.target.value;
                                      setEditedProgram(newProgram);
                                    }}
                                    className="w-12 text-center bg-[#0d1420] border border-[#1e293b] rounded p-1 text-xs font-mono font-bold text-[#00f0ff] focus:outline-none focus:border-[#00f0ff]"
                                  />
                                ) : (
                                  ex.sets
                                )}
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono text-[#f1f5f9]">
                                {isEditMode ? (
                                  <input 
                                    value={ex.reps} 
                                    onChange={(e) => {
                                      const newProgram = { ...editedProgram! };
                                      newProgram.days[di].exercises[ei].reps = e.target.value;
                                      setEditedProgram(newProgram);
                                    }}
                                    className="w-14 text-center bg-[#0d1420] border border-[#1e293b] rounded p-1 text-xs font-mono text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
                                  />
                                ) : (
                                  ex.reps
                                )}
                              </td>
                              <td className="py-2.5 px-2 text-center text-[#94a3b8]">
                                {isEditMode ? (
                                  <input 
                                    value={ex.rest} 
                                    onChange={(e) => {
                                      const newProgram = { ...editedProgram! };
                                      newProgram.days[di].exercises[ei].rest = e.target.value;
                                      setEditedProgram(newProgram);
                                    }}
                                    className="w-14 text-center bg-[#0d1420] border border-[#1e293b] rounded p-1 text-xs text-[#94a3b8] focus:outline-none focus:border-[#00f0ff]"
                                  />
                                ) : (
                                  ex.rest
                                )}
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono text-[#94a3b8]">
                                {isEditMode ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <span>RPE</span>
                                    <input 
                                      value={ex.rpe} 
                                      onChange={(e) => {
                                        const newProgram = { ...editedProgram! };
                                        newProgram.days[di].exercises[ei].rpe = e.target.value;
                                        setEditedProgram(newProgram);
                                      }}
                                      className="w-10 text-center bg-[#0d1420] border border-[#1e293b] rounded p-1 text-xs font-mono text-[#94a3b8] focus:outline-none focus:border-[#00f0ff]"
                                    />
                                  </div>
                                ) : (
                                  \`RPE \${ex.rpe}\`
                                )}
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <TrainingMethodBadge 
                                  methodKeyOrName={ex.method || 'tradicional'} 
                                  clientLevel={client.level}
                                  periodizationPhase={client.program?.meso?.weeks?.[0]?.f || 'Base'}
                                  goal={client.goal}
                                />
                              </td>
                              <td className="py-2.5 px-2 text-right">
                                {isEditMode ? (
                                  <button
                                    onClick={() => {
                                      const newProgram = { ...editedProgram! };
                                      newProgram.days[di].exercises.splice(ei, 1);
                                      setEditedProgram(newProgram);
                                    }}
                                    className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors inline-flex"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setAiSubModal({ isOpen: true, dayIndex: di, exerciseIndex: ei, exercise: ex })}
                                    className="text-[10px] font-bold text-[#00f0ff] hover:bg-[#00f0ff]/10 border border-[#00f0ff]/30 px-2 py-1 rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer"
                                    title="IA Assistente de Substituição Biomecânica"
                                  >
                                    <Sparkles className="w-3 h-3 text-[#00f0ff]" />
                                    <span>IA Substituir</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {isEditMode && (
                      <div className="pt-2 border-t border-[#1e293b]/50">
                        <button
                          onClick={() => {
                            const newProgram = { ...editedProgram! };
                            newProgram.days[di].exercises.push({
                              name: '',
                              pat: 'push_h',
                              sets: '3',
                              reps: '10',
                              rest: '60s',
                              rpe: '7'
                            });
                            setEditedProgram(newProgram);
                          }}
                          className="text-xs font-bold text-[#00f0ff] hover:text-[#00f0ff]/80 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-[#00f0ff]/10 transition-colors"
                        >
                          <Plus className="w-4 h-4" /> Adicionar Exercício
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {isEditMode && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={() => {
                        const newProgram = { ...editedProgram! };
                        newProgram.days = newProgram.days || [];
                        newProgram.days.push({
                          name: 'Novo dia',
                          focus: '',
                          exercises: []
                        });
                        setEditedProgram(newProgram);
                      }}
                      className="text-sm font-bold text-[#f1f5f9] hover:text-[#00f0ff] border border-[#1e293b] border-dashed hover:border-[#00f0ff] flex items-center justify-center gap-2 p-4 rounded-2xl transition-colors w-full"
                    >
                      <Plus className="w-5 h-5" /> Adicionar dia de treino
                    </button>
                  </div>
                )}
              </div>`;

content = content.replace(target2, replacement2);

fs.writeFileSync(path, content, 'utf8');
