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
