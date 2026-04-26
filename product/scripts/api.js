/**
 * api.js — Communication with Google Gemini API
 */

import { getApiKey } from './settings.js';

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Generate product descriptions using Gemini
 * @param {Object} productData 
 * @returns {Promise<{short: string, long: string, bullets: string}>}
 */
export async function generateDescription(productData) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Моля, въведете Google Gemini API ключ от настройките (горе вдясно).');
  }

  // Map the tone to Bulgarian instruction
  const toneMap = {
    'professional': 'строго професионален, авторитетен и формален',
    'friendly': 'приятелски, топъл и разговорен',
    'sales': 'силно убедителен, продажбен и фокусиран върху ползите (call to action)'
  };
  const targetTone = toneMap[productData.productTone] || toneMap['professional'];

  const prompt = `
Аз съм маркетинг специалист за онлайн магазин. Имам нужда от висококачествени описания на български език за следния продукт:

Име: ${productData.productName}
Категория: ${productData.productCategory}
Ключови характеристики:
${productData.productFeatures}

Задължително изискване: Тонът на комуникация трябва да бъде ${targetTone}.

Трябва да генерираш следните три компонента:
1. shortDescription: Кратко въвеждащо описание (2-3 изречения), което грабва вниманието.
2. longDescription: Подробно описание (2-3 абзаца), което обяснява ползите и решава проблеми на клиента.
3. keyFeatures: Точно 4-5 ключови акцента, форматирани като валиден HTML списък. Започни с <ul> и сложи всеки акцент в <li> таг. Не слагай Markdown символи за списък (като - или *), използвай само HTML.

Отговори ЗАДЪЛЖИТЕЛНО и САМО със стриктен JSON обект със следните три ключа: "shortDescription", "longDescription", "keyFeatures".
Никакъв друг текст преди или след JSON обекта!
`;

  const requestBody = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    }
  };

  try {
    const response = await fetch(`${API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[api.js] API Error response:', errorData);
      
      if (response.status === 400 && errorData.error?.message?.includes('API key not valid')) {
        throw new Error('Въведеният API ключ е невалиден.');
      }
      throw new Error(errorData.error?.message || `Сървърът върна грешка: ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error('Изкуственият интелект върна празен отговор.');
    }

    const result = JSON.parse(textResponse);
    
    return {
      short: result.shortDescription || 'Липсва кратко описание.',
      long: result.longDescription || 'Липсва подробно описание.',
      bullets: result.keyFeatures || '<ul><li>Липсват акценти</li></ul>'
    };

  } catch (error) {
    console.error('[api.js] Execution error:', error);
    // Rethrow to be caught by the UI module (results.js)
    throw error;
  }
}
