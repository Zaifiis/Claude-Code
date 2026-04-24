const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_GENERATOR =
  'You are a viral content creator for Snaplyr, an AI automation agency targeting appointment-based businesses like medspas, salons, clinics, dental offices, law firms, coaches and real estate agents. Brand voice: confident, peer-to-peer, direct, no corporate speak. Always include a CTA of DM me DISCOVER at the end of scripts.';

function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return { raw: text };
      }
    }
    return { raw: text };
  }
}

async function run(topic, pipeline, platform, onProgress) {
  onProgress('generating', { stage: 1, message: 'Generating draft...' });

  const round1Res = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_GENERATOR },
      {
        role: 'user',
        content: `Topic: ${topic}
Pipeline: ${pipeline}
Platform context: ${platform}

Generate:
1. Three scroll-stopper hooks (under 10 words each, for Instagram Reels and TikTok)
2. One 60-90 second Reel script (hook + body + CTA)
3. One LinkedIn post version (professional but direct, under 200 words)

Respond in this exact JSON format:
{
  "hooks": ["hook1", "hook2", "hook3"],
  "reelScript": "string",
  "linkedinPost": "string"
}`
      }
    ],
    temperature: 0.9,
    max_tokens: 1500
  });

  const round1 = parseJSON(round1Res.choices[0].message.content);

  onProgress('critiquing', { stage: 2, message: 'Self-critiquing...' });

  const round2Res = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: 'You are a brutal content critic. Be short. Only bullet points.' },
      {
        role: 'user',
        content: `Review this content for a Pakistani AI agency founder targeting US appointment-based businesses. Score each hook 1-10. Identify exactly what is generic, weak or off-brand. Be harsh. Max 150 words total.

Content to review:
${JSON.stringify(round1)}

Respond as JSON:
{
  "hookScores": [score1, score2, score3],
  "weaknesses": ["bullet1", "bullet2", "bullet3"],
  "lowestScoringHook": number
}`
      }
    ],
    temperature: 0.7,
    max_tokens: 600
  });

  const round2 = parseJSON(round2Res.choices[0].message.content);

  onProgress('refining', { stage: 3, message: 'Refining...' });

  const round3Res = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are a senior copywriter. Fix only what is broken. Keep what works.'
      },
      {
        role: 'user',
        content: `Original content: ${JSON.stringify(round1)}
Critique: ${JSON.stringify(round2)}

Rewrite only the hooks that scored below 7 and fix the specific weaknesses identified. Keep everything else exactly the same.
Return same JSON structure as original:
{
  "hooks": ["hook1", "hook2", "hook3"],
  "reelScript": "string",
  "linkedinPost": "string",
  "whyTrending": "one sentence explanation of why this topic is viral right now"
}`
      }
    ],
    temperature: 0.8,
    max_tokens: 1500
  });

  const round3 = parseJSON(round3Res.choices[0].message.content);

  onProgress('complete', {
    stage: 4,
    message: 'Complete',
    result: round3,
    critique: round2
  });
}

module.exports = { run };
