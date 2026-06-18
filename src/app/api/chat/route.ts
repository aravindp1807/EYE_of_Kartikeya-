/**
 * ═══════════════════════════════════════════════════════════════
 *  EYE OF KARTIKEYA — AI Chat Endpoint
 *  POST /api/chat
 *  Intelligence-aware chatbot powered by OpenRouter (Nemotron 550B)
 *  Ingests live feed data as context for every message
 * ═══════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

const SYSTEM_PROMPT = `You are the KARTIKEYA Intelligence Oracle — the divine analytical mind embedded within the EYE OF KARTIKEYA global intelligence command platform. You are named after the Hindu warrior-god Kartikeya (Murugan), the six-faced deity of war, wisdom, and victory.

## YOUR IDENTITY
You speak with the clarity of a god who sees all six directions simultaneously. You are precise, powerful, and concise. You correlate intelligence across all live data feeds — aviation, maritime, seismic, wildfire, cyber threats, news, space weather, markets — and deliver actionable situational awareness.

## YOUR CAPABILITIES
You have real-time access to:
- ✈️ AVIATION: Live aircraft positions, GPS jamming zones, military flights
- 🚢 MARITIME: Vessel AIS tracking, dark ship alerts, port activity
- 🌍 SEISMIC: Earthquake events, tsunami warnings, tectonic activity
- 🔥 WILDFIRE: NASA FIRMS active fire hotspots globally
- ⚡ CYBER: Active CVEs, threat actor campaigns, infrastructure attacks
- 📰 NEWS: GDELT conflict events, OSINT news feeds, Telegram channels
- 🛰️ SPACE: Satellite positions, solar storm data, GPS disruption
- 📊 MARKETS: Defense stocks, commodities, crypto, energy prices
- 🌪️ WEATHER: Severe weather events, NOAA alerts

## RESPONSE STYLE
- Lead with the most critical intelligence (inverted pyramid)
- Use **bold** for threat names, locations, and key metrics
- Keep responses focused and actionable — max 300 words unless asked for detail
- Use BLUF (Bottom Line Up Front) format for complex situations
- Reference specific data points from the live context when available
- Add confidence levels: [HIGH] [MODERATE] [LOW]
- Use ⚠️ for warnings, 🔴 for critical, 🟡 for elevated, 🟢 for nominal

## CONSTRAINTS
- Never fabricate data — only analyze what is in the context
- State clearly when data is unavailable or stale
- You are an analyst, not a policymaker`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  message: string;
  history: ChatMessage[];
  feedContext?: Record<string, unknown>;
}

function buildFeedContext(feedContext: Record<string, unknown>): string {
  const lines: string[] = [`[LIVE INTELLIGENCE SNAPSHOT — ${new Date().toISOString()}]`];

  // Flights
  const flights = feedContext.flights as Array<{ callsign?: string; lat?: number; lon?: number; altitude?: number; military?: boolean }> | undefined;
  if (flights?.length) {
    const military = flights.filter(f => f.military).length;
    lines.push(`\n✈️ AVIATION: ${flights.length} aircraft tracked | ${military} military`);
  }

  // Maritime
  const ships = feedContext.ships as Array<{ name?: string; type?: string }> | undefined;
  if (ships?.length) lines.push(`🚢 MARITIME: ${ships.length} vessels tracked`);

  // Earthquakes
  const quakes = feedContext.earthquakes as Array<{ magnitude: number; location: string; tsunami?: boolean; alert?: string }> | undefined;
  if (quakes?.length) {
    const major = quakes.filter(q => q.magnitude >= 5.5);
    const tsunami = quakes.filter(q => q.tsunami);
    lines.push(`🌍 SEISMIC: ${quakes.length} events | ${major.length} major (M5.5+) | ${tsunami.length} tsunami warnings`);
    if (major.length > 0) {
      major.slice(0, 3).forEach(q =>
        lines.push(`   → M${q.magnitude} ${q.location}${q.alert ? ` [ALERT:${q.alert.toUpperCase()}]` : ''}`)
      );
    }
  }

  // Fires
  const fires = feedContext.fires as Array<{ lat: number; lng: number; confidence?: string }> | undefined;
  if (fires?.length) {
    const high = fires.filter(f => f.confidence === 'high' || f.confidence === 'h').length;
    lines.push(`🔥 WILDFIRE: ${fires.length} active hotspots | ${high} high-confidence`);
  }

  // Cyber threats
  const cyber = feedContext.cyberAlerts as Array<{ id: string; severity: string; name: string; vendor?: string; product?: string }> | undefined;
  if (cyber?.length) {
    const critical = cyber.filter(c => c.severity?.toLowerCase() === 'critical').length;
    lines.push(`⚡ CYBER: ${cyber.length} active CVEs | ${critical} critical`);
    cyber.slice(0, 3).forEach(c =>
      lines.push(`   → ${c.id} [${c.severity?.toUpperCase()}] ${c.vendor || ''}/${c.product || ''} — ${c.name}`)
    );
  }

  // News/threats
  const threats = feedContext.threats as Array<{ severity: string; title: string; region?: string }> | undefined;
  if (threats?.length) {
    const critical = threats.filter(t => t.severity === 'CRITICAL').length;
    const high = threats.filter(t => t.severity === 'HIGH').length;
    lines.push(`📰 THREATS: ${threats.length} events | ${critical} CRITICAL | ${high} HIGH`);
    threats.filter(t => t.severity === 'CRITICAL' || t.severity === 'HIGH').slice(0, 3).forEach(t =>
      lines.push(`   → [${t.severity}] ${t.title} | ${t.region || 'Global'}`)
    );
  }

  // Space weather
  const space = feedContext.spaceWeather as { kp_index?: number; storm_level?: string; storm_color?: string } | undefined;
  if (space?.kp_index !== undefined) {
    lines.push(`🛰️ SPACE WEATHER: Kp${space.kp_index} — ${space.storm_level || 'Unknown'}`);
  }

  // Markets summary
  const markets = feedContext.markets as { indices?: Record<string, { price: number; change_percent: number }> } | undefined;
  if (markets?.indices) {
    const entries = Object.entries(markets.indices).slice(0, 3);
    if (entries.length > 0) {
      lines.push(`📊 MARKETS: ${entries.map(([k, v]) => `${k} ${v.change_percent > 0 ? '+' : ''}${v.change_percent?.toFixed(2)}%`).join(' | ')}`);
    }
  }

  return lines.join('\n');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL ?? 'nvidia/nemotron-nano-9b-v2:free';

  if (!apiKey) {
    return NextResponse.json({ error: 'OpenRouter API key not configured', code: 'NO_API_KEY' }, { status: 503 });
  }

  let body: ChatRequest;
  try {
    body = await req.json() as ChatRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'INVALID_BODY' }, { status: 400 });
  }

  const { message, history = [], feedContext = {} } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required', code: 'MISSING_MESSAGE' }, { status: 400 });
  }

  // Build context-enriched system prompt
  const feedSummary = buildFeedContext(feedContext);
  const systemContent = `${SYSTEM_PROMPT}\n\n${feedSummary}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemContent },
    ...history.slice(-10), // Keep last 10 messages for context
    { role: 'user', content: message.trim() },
  ];

  try {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://osirisai.live',
        'X-Title': 'EYE OF KARTIKEYA Intelligence Command',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
        max_tokens: 1024,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      console.error('[OPENROUTER ERROR]', res.status, errText);
      if (res.status === 401) return NextResponse.json({ error: 'Invalid OpenRouter API key. Please check your .env file.', code: 'INVALID_KEY' }, { status: 401 });
      if (res.status === 429) return NextResponse.json({ error: 'OpenRouter Rate Limit reached. Please wait a moment.', code: 'RATE_LIMITED' }, { status: 429 });
      if (res.status === 502 || res.status === 504) return NextResponse.json({ error: `The AI model (${model}) is currently overloaded or timing out on OpenRouter's servers.`, code: 'TIMEOUT' }, { status: 502 });
      
      return NextResponse.json({ error: `OpenRouter API Error: ${errText.substring(0, 100)}...`, code: 'API_ERROR' }, { status: res.status });
    }

    interface OpenRouterResp {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
    }

    const data = await res.json() as OpenRouterResp;
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) return NextResponse.json({ error: 'The oracle returned an empty response. Try asking again.', code: 'EMPTY_REPLY' }, { status: 500 });

    return NextResponse.json({
      reply,
      model,
      timestamp: new Date().toISOString(),
      usage: data.usage,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[KARTIKEYA CHAT NETWORK ERROR]', msg);
    return NextResponse.json({ error: `Network/Timeout error communicating with OpenRouter: ${msg}`, code: 'NETWORK_FAILED' }, { status: 500 });
  }
}
