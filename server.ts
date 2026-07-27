import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

function formatAiError(err: any): string {
  const msg = err?.message || String(err || '');
  if (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('spending cap') ||
    msg.includes('Quota exceeded')
  ) {
    return 'Przekroczono limit darmowego klucza domyślnego. Wygeneruj własny bezpłatny klucz Gemini API na stronie aistudio.google.com/app/apikey i wklej go w zakładce "Ustawienia" w aplikacji.';
  }
  return msg || 'Wystąpił błąd podczas komunikacji z AI.';
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser with 25mb limit for base64 receipt images
  app.use(express.json({ limit: '25mb' }));

  // Helper to initialize GenAI client safely
  function getGenAIClient(customApiKey?: string) {
    const key = customApiKey?.trim() || process.env.GEMINI_API_KEY || '';
    if (!key) {
      throw new Error('Brak klucza Gemini API Key. Skonfiguruj klucz w Ustawieniach lub w pliku .env.');
    }
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 1. Scan Receipt Endpoint
  app.post('/api/scan-receipt', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', customApiKey } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Nie przesłano zdjęcia paragonu.' });
      }

      // Strip data URL prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const ai = getGenAIClient(customApiKey);

      const prompt = `Jesteś precyzyjnym asystentem odczytującym polskie paragony fiskalne. 
Przeanalizuj przesłane zdjęcie paragonu i wyciągnij następujące dane:
1. Sklep: Nazwa sklepu (np. Biedronka, Lidl, Rossmann, Pepco, Żabka, Dino, Apteka, itp.).
2. Data: Data zakupu w formacie YYYY-MM-DD. Jeśli data jest niewyraźna lub jej brak, użyj dzisiejszej daty: ${new Date().toISOString().split('T')[0]}.
3. Kwota całkowita: Łączna kwota do zapłaty (SUMA / PLN) jako liczba zmiennoprzecinkowa (np. 45.90).
4. Kategoria: Wybierz dokładnie jedną z następujących kategorii, najlepiej pasującą do towarów:
   - "Spożywcze"
   - "Chemia/Kosmetyki"
   - "Dom"
   - "Zdrowie"
   - "Odzież"
   - "Rozrywka"
   - "Rachunki/Usługi"
   - "Inne"
5. Pozycje (items): Lista wyciągniętych najważniejszych produktów z paragonu (nazwa i cena).
6. Notatka (notes): Krótkie opcjonalne podsumowanie zakupów.

Odpowiedz wyłącznie prawidłowym obiektem JSON zgodnym ze schematem.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType: mimeType,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              store: { type: Type.STRING, description: 'Nazwa sklepu' },
              date: { type: Type.STRING, description: 'Data YYYY-MM-DD' },
              total: { type: Type.NUMBER, description: 'Kwota całkowita w PLN' },
              category: {
                type: Type.STRING,
                description: 'Kategoria: Spożywcze, Chemia/Kosmetyki, Dom, Zdrowie, Odzież, Rozrywka, Rachunki/Usługi, Inne',
              },
              notes: { type: Type.STRING, description: 'Krótkie opcjonalne uwagi' },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    price: { type: Type.NUMBER },
                  },
                },
              },
            },
            required: ['store', 'date', 'total', 'category'],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Brak odpowiedzi od AI.');
      }

      const parsedData = JSON.parse(text);
      res.json({ success: true, data: parsedData });
    } catch (err: any) {
      console.error('Błąd podczas skanowania paragonu:', err);
      res.status(500).json({
        error: formatAiError(err),
      });
    }
  });

  // 2. Analyze Month Endpoint
  app.post('/api/analyze-month', async (req, res) => {
    try {
      const { month, receipts, customApiKey } = req.body;

      if (!receipts || !Array.isArray(receipts)) {
        return res.status(400).json({ error: 'Nie przekazano listy paragonów.' });
      }

      const ai = getGenAIClient(customApiKey);

      const prompt = `Jesteś życzliwym, mądrym i pomocnym doradcą budżetowym. Piszesz podsumowanie wydatków na dany miesiąc (${month}) dla Mamy.
Oto lista zarejestrowanych wydatków z tego miesiąca (w PLN):
${JSON.stringify(receipts, null, 2)}

Twój cel:
Napisz krótkie, bardzo czytelne i miłe podsumowanie po polsku, używając wypunktowań, pogrubień oraz ciepłego, zrozumiałego języka.
Uwzględnij:
1. 📊 Ogólne podsumowanie (ile łącznie wydano i ile było paragonów).
2. 🏬 Sklep, w którym wydano najwięcej pieniędzy.
3. 🛒 Główną kategorię wydatków (np. na co poszło najwięcej).
4. 💡 2-3 praktyczne, ciepłe i sympatyczne spostrzeżenia lub wskazówki na kolejny miesiąc.

Formatuj odpowiedź estetycznie w czystym tekście/Markdown (używaj list z gwiazdkami lub myślnikami, nagłówków, bez zbędnego skomplikowanego słownictwa).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      const text = response.text || 'Brak podsumowania.';
      res.json({ success: true, analysis: text });
    } catch (err: any) {
      console.error('Błąd podczas analizy miesiąca:', err);
      res.status(500).json({
        error: formatAiError(err),
      });
    }
  });

  // Vite development vs production serving
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
    console.log(`Serwer uruchomiony na portzie ${PORT}`);
  });
}

startServer();
