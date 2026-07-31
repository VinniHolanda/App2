import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Gemini Multi-turn Chat Endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, systemInstruction, model, speedMode } = req.body;

    // Model selection logic matching user guidelines:
    // - gemini-3.1-pro-preview for complex reasoning/biomechanics
    // - gemini-3.6-flash / gemini-3.5-flash for general coaching queries
    // - gemini-3.1-flash-lite for fast response tasks
    let selectedModel = 'gemini-3.6-flash';
    if (model) {
      selectedModel = model;
    } else if (speedMode === 'fast') {
      selectedModel = 'gemini-3.1-flash-lite';
    } else if (speedMode === 'complex') {
      selectedModel = 'gemini-3.1-pro-preview';
    }

    const ai = getGenAI();

    // Format conversation history for Gemini API
    const formattedContents = (messages || []).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content || m.text }],
    }));

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction || 'Você é o Kinetix AI, especialista em fisiologia do treino, ciência do exercício e biomecânica.',
        temperature: 0.7,
      },
    });

    res.json({
      reply: response.text || 'Nenhuma resposta gerada.',
      modelUsed: selectedModel,
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      error: error.message || 'Erro ao comunicar com a inteligência artificial Gemini.',
    });
  }
});

// Gemini Bioimpedance / Body Composition File OCR & Parser Endpoint
app.post('/api/parse-bioimpedance', async (req, res) => {
  try {
    const { fileBase64, mimeType, fileName } = req.body;

    if (!fileBase64) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado para análise.' });
    }

    const ai = getGenAI();
    const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');

    const prompt = `
Você é um especialista em Fisiologia do Exercício, Avaliação Física e Leitura de Exames de Bioimpedância (InBody, Tanita, Avanutri, laudos em PDF/imagem).
Analise com precisão o arquivo/imagem fornecido (${fileName || 'documento'}) e transcreva todas as informações de composição corporal.

Retorne estritamente um objeto JSON válido com a seguinte estrutura:
{
  "date": "YYYY-MM-DD",
  "weightKg": 70.5,
  "heightCm": 175,
  "fatPercentage": 18.5,
  "fatMassKg": 13.0,
  "leanMassKg": 57.5,
  "visceralFatLevel": 4,
  "bmrKcal": 1650,
  "waterPercentage": 58.2,
  "notes": "Descrição sumária com destaque para o nível de hidratação, massa muscular esquelética e retenção.",
  "aiPrescriptionInsights": [
    "Recomendação 1 para o treinador ajustar a prescrição de treino com base nos dados do laudo",
    "Recomendação 2 sobre distribuição de volume e grupos musculares a enfatizar",
    "Recomendação 3 sobre manejo de cardio ou densidade de treino"
  ]
}

Regras:
1. Extraia os números reais contidos no documento. Se alguma métrica específica não for encontrada no relatório, estime com base fisiológica lógica no peso/massa magra ou use 0.
2. Formate a data em YYYY-MM-DD (se não houver data no documento, use a data de hoje: ${new Date().toISOString().split('T')[0]}).
3. Crie 3 insights estratégicos de prescrição de treino extremamente profissionais em português.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: cleanBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(text);
    } catch (e) {
      console.warn('Falha no JSON parse do Gemini, tentando sanitizar:', text);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      }
    }

    res.json({
      success: true,
      data: parsedData,
      rawText: text,
      fileName
    });
  } catch (error: any) {
    console.error('Erro na transcrição da bioimpedância:', error);
    res.status(500).json({
      error: error.message || 'Erro ao processar o arquivo de bioimpedância via IA.',
    });
  }
});

// Gemini Program Generation Endpoint
app.post('/api/gemini/generate-program', async (req, res) => {
  try {
    const { clientData, promptNotes } = req.body;
    
    if (!clientData) {
      return res.status(400).json({ error: 'Dados do aluno são obrigatórios.' });
    }

    const ai = getGenAI();

    const prompt = `Você é um Treinador Master (PhD em Fisiologia do Treinamento e Biomecânica).
Sua tarefa é criar um programa de treinamento altamente científico e periodizado para o seguinte aluno:

**Dados do Aluno:**
- Nome: ${clientData.name}
- Nível: ${clientData.level}
- Objetivo: ${clientData.goal}
- Disponibilidade: ${clientData.daysPerWeek || 3} dias/semana
- Lesões/Limitações: ${clientData.injuries?.join(', ') || 'Nenhuma'}
- Equipamento disponível: ${clientData.equipment?.join(', ') || 'Completo (Academia)'}
${promptNotes ? `- Notas adicionais do treinador: ${promptNotes}` : ''}

**Regras Metodológicas:**
1. Baseado no nível e objetivo, prescreva um volume semanal adequado (MEV a MRV).
2. Distribua o treino nos dias disponíveis de forma inteligente (ex: FullBody 3x, AB 4x, ABC 5x).
3. Utilize métodos avançados de periodização (Cluster sets, Rest-Pause, Drop-sets) apenas para avançados, e focados em técnica/adaptação para iniciantes.
4. Se houver lesão, substitua exercícios biomecanicamente arriscados, justificando brevemente nas 'notes' do exercício.
5. O campo "summary" deve ser um resumo inspirador e científico do programa.
6. "principles" deve listar 3 a 5 princípios biomecânicos ou fisiológicos aplicados.

**Estrutura do JSON Esperado:**
{
  "summary": "Resumo do programa...",
  "principles": ["Princípio 1", "Princípio 2"],
  "days": [
    {
      "name": "Treino A",
      "focus": "Membros Inferiores (Foco Quadríceps)",
      "exercises": [
        {
          "name": "Agachamento Livre",
          "pat": "squat",
          "sets": "3-4",
          "reps": "8-10",
          "rest": "120s",
          "rpe": "8",
          "notes": "Foque na fase excêntrica controlada (3s)"
        }
      ]
    }
  ]
}
Nota: "pat" (padrão de movimento) deve ser um de: "squat", "hinge", "lunge", "push_horiz", "push_vert", "pull_horiz", "pull_vert", "core", "iso", "carry", "plyo", "mobility", "cardio", "other".
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const text = response.text || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(text);
    } catch (e) {
      console.warn('Falha no JSON parse do Gemini:', text);
      const jsonMatch = text.match(/\\{[\\s\\S]*\\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      }
    }

    res.json({
      success: true,
      program: parsedData
    });
  } catch (error: any) {
    console.error('Erro na geração do treino:', error);
    res.status(500).json({
      error: error.message || 'Erro ao gerar o programa via IA.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kinetix Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
