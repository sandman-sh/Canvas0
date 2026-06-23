import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenRouter API key is not configured on the server.' },
        { status: 500 }
      );
    }

    const { prompt, type } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    let systemPrompt = '';
    let userPrompt = prompt;

    if (type === 'text') {
      systemPrompt = `You are a high-performance marketing copywriter. Generate professional, catchy, and high-converting marketing copy, asset descriptions, or taglines. 
Keep it punchy, short (under 60 words), and highly engaging. 
Format the response cleanly. Do not include quotes unless part of the copy. Output only the copy.`;
    } else if (type === 'image') {
      systemPrompt = `You are a professional, high-performance UI/UX designer and vector illustrator.
Generate a valid, raw, responsive inline SVG XML string for a graphic, illustration, badge, or icon matching the user prompt.
Requirements:
1. ONLY return the raw SVG code. Starting with "<svg" and ending with "</svg>".
2. DO NOT wrap it in markdown block quotes (do not use \`\`\`xml or \`\`\`svg).
3. Use a vibrant, modern palette: Purple (#9D4EDD), Green (#39FF14), Yellow (#FFD60A), Pink (#FF007F), styled as clean, flat vector elements with no unnecessary thick outlines or hard shadows.
4. Make sure it is fully responsive with viewBox and width="100%" height="100%".
5. Do not include any text outside the SVG code.`;
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://canvas0.dev',
        'X-Title': 'Canvas0',
      },
      body: JSON.stringify({
        model: 'google/gemma-2-9b-it:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenRouter API returned error:', err);
      return NextResponse.json({ error: `AI generation failed: ${err}` }, { status: response.status });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';

    // Clean up content (sometimes models still put code fences despite system prompt)
    if (type === 'image') {
      content = content.trim();
      if (content.includes('```xml')) {
        content = content.split('```xml')[1].split('```')[0].trim();
      } else if (content.includes('```html')) {
        content = content.split('```html')[1].split('```')[0].trim();
      } else if (content.includes('```svg')) {
        content = content.split('```svg')[1].split('```')[0].trim();
      } else if (content.includes('```')) {
        content = content.split('```')[1].split('```')[0].trim();
      }

      // If the result doesn't look like an SVG, fallback to dynamic Pollinations AI image
      if (!content.startsWith('<svg') && !content.includes('<svg')) {
        const query = encodeURIComponent(prompt);
        content = `<img src="https://image.pollinations.ai/p/${query}?width=400&height=400&nologo=true" alt="${prompt.replace(/"/g, '&quot;')}" class="w-full h-full object-cover rounded-lg shadow-sm" />`;
      }
    }

    return NextResponse.json({ content, type });
  } catch (error: any) {
    console.error('Error in AI Route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
