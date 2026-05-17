export interface AiDebrief {
  behavioral: string;
  emotional: string;
  discipline: string;
  question: string;
}

export interface DebriefInput {
  pair: string;
  direction: 'long' | 'short';
  entryPrice: string;
  exitPrice: string;
  rrRatio: string;
  session: string;
  setupType: string;
  preEmotion: string;
  preIntensity: number;
  postEmotion: string;
  postIntensity: number;
  mistakes: string[];
  reflection: string;
  rules: string[];
}

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

function computeOutcome(
  direction: 'long' | 'short',
  entry: string,
  exit: string
): string {
  const e = parseFloat(entry);
  const x = parseFloat(exit);
  if (!exit || isNaN(e) || isNaN(x)) return 'open / not yet closed';
  if (e === x) return 'breakeven';
  const win = direction === 'long' ? x > e : x < e;
  return win ? 'WIN' : 'LOSS';
}

function buildPrompt(d: DebriefInput): string {
  const outcome = computeOutcome(d.direction, d.entryPrice, d.exitPrice);
  const mistakeText = d.mistakes.length > 0 ? d.mistakes.join(', ') : 'none identified';
  const rulesText = d.rules.length > 0 ? d.rules.join('; ') : 'not yet defined';

  return `You are Kario — an elite trading psychology coach. Analyse this trade log and return ONLY a JSON object.

TRADE DATA:
- Instrument: ${d.pair} | Direction: ${d.direction.toUpperCase()} | Outcome: ${outcome}
- Entry: ${d.entryPrice || '—'} | Exit: ${d.exitPrice || '—'} | R:R: ${d.rrRatio || '—'}
- Session: ${d.session || '—'} | Setup: ${d.setupType || 'not specified'}

PSYCHOLOGY:
- Pre-trade emotion: ${d.preEmotion} (intensity ${d.preIntensity}/5)
- Post-trade emotion: ${d.postEmotion} (intensity ${d.postIntensity}/5)
- Mistakes: ${mistakeText}

TRADER'S PERSONAL RULES: ${rulesText}

TRADER'S OWN REFLECTION: "${d.reflection}"

Return ONLY valid JSON — no markdown, no prose, no extra keys:
{
  "behavioral": "2–3 sentences. Specific behavioural observation about this trade and what it reveals.",
  "emotional": "2–3 sentences. Honest emotional pattern analysis — how emotion shaped execution.",
  "discipline": "2–3 sentences. Direct assessment of rule adherence. Reference their actual rules if provided.",
  "question": "One sharp reflective question that deepens self-awareness. No preamble."
}`;
}

function fallbackDebrief(d: DebriefInput): AiDebrief {
  const outcome = computeOutcome(d.direction, d.entryPrice, d.exitPrice);
  return {
    behavioral: `You entered this ${d.direction} on ${d.pair} feeling ${d.preEmotion}. The trade resulted in a ${outcome.toLowerCase()} and left you feeling ${d.postEmotion} — a shift worth examining closely.`,
    emotional: `Moving from ${d.preEmotion} (${d.preIntensity}/5) to ${d.postEmotion} (${d.postIntensity}/5) suggests your emotional state was actively influencing your decisions. Notice whether those feelings were present before the setup appeared, or emerged as a response to price action.`,
    discipline: d.mistakes.length > 0
      ? `You identified ${d.mistakes.length} mistake${d.mistakes.length > 1 ? 's' : ''} in this trade: ${d.mistakes.join(', ')}. Each one is data, not judgement. The goal is pattern awareness — if these repeat, they reveal where your edge is being leaked.`
      : `No mistakes were flagged in this trade. Focus on whether your process was sound regardless of outcome — a losing trade executed with discipline is more valuable than a winning trade taken impulsively.`,
    question: d.reflection.length > 20
      ? 'If this exact setup appeared tomorrow with the same emotions, what would you do differently?'
      : 'What does this trade reveal about the gap between the trader you are and the trader you want to become?',
  };
}

export async function generateDebrief(input: DebriefInput): Promise<AiDebrief> {
  if (!API_KEY) return fallbackDebrief(input);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'x-api-key': API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: buildPrompt(input) }],
      }),
    });

    if (!res.ok) return fallbackDebrief(input);

    const json = await res.json();
    const text: string = json?.content?.[0]?.text ?? '';
    const parsed = JSON.parse(text) as AiDebrief;

    if (parsed.behavioral && parsed.emotional && parsed.discipline && parsed.question) {
      return parsed;
    }
    return fallbackDebrief(input);
  } catch {
    return fallbackDebrief(input);
  }
}
