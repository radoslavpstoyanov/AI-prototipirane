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

  // Map the tone to instruction based on language
  const toneMapBG = {
    'professional': 'строго професионален, авторитетен и формален',
    'friendly': 'приятелски, топъл и разговорен',
    'sales': 'силно убедителен, продажбен и фокусиран върху ползите (call to action)'
  };
  const toneMapEN = {
    'professional': 'strictly professional, authoritative and formal',
    'friendly': 'friendly, warm and conversational',
    'sales': 'highly persuasive, sales-focused and benefit-driven (call to action)'
  };

  const isEnglish = productData.productLanguage === 'en';
  const toneMap = isEnglish ? toneMapEN : toneMapBG;
  const targetTone = toneMap[productData.productTone] || toneMap['professional'];

  const langInstruction = isEnglish
    ? 'You MUST write ALL output text exclusively in English. This is mandatory, regardless of the language of the input data.'
    : 'Трябва да пишеш ЦЕЛИЯ изходен текст изключително на БЪЛГАРСКИ ЕЗИК. Входните данни могат да са на различен език, но изходът задължително е на български.';

  const prompt = `
${langInstruction}

You are a marketing specialist for an online store. Generate high-quality product descriptions for the following product:

Product name: ${productData.productName}
Category: ${productData.productCategory}
Key features:
${productData.productFeatures}

Mandatory requirement: The communication tone must be ${targetTone}.

Generate the following three components:
1. shortDescription: A very short introductory description (maximum 2 short sentences) that grabs attention.
2. longDescription: A detailed and engaging description (2-3 paragraphs) that explains the benefits and solves customer problems.
3. keyFeatures: Exactly 3 to 4 short key highlights, formatted as valid HTML list. Start with <ul> and put each highlight in a <li> tag. Do not use Markdown list symbols (like - or *), use only HTML.

Respond ONLY with a strict JSON object with these three keys: "shortDescription", "longDescription", "keyFeatures".
No other text before or after the JSON object!
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
