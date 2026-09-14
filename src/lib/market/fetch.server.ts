import type { Candle } from "@/lib/gann/types";
import { findSymbol, type Interval } from "./symbols";
import { generateSynthetic } from "./synthetic";
import { env } from "@/lib/env.server";

const BINANCE_INTERVAL: Record<Interval, string> = { "15m":"15m","1h":"1h","4h":"4h","1d":"1d","1w":"1w" };
const YAHOO_INTERVAL: Record<Interval, {interval:string;range:string}> = {
  "15m":{interval:"15m",range:"1mo"},"1h":{interval:"1h",range:"3mo"},
  "4h":{interval:"1h",range:"6mo"},"1d":{interval:"1d",range:"2y"},"1w":{interval:"1wk",range:"5y"},
};
const FYERS_RESOLUTION: Record<Interval, string> = { "15m":"15","1h":"60","4h":"240","1d":"D","1w":"1W" };

async function fetchJson(url: string, timeoutMs = 8000, headers?: Record<string,string>): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent":"Mozilla/5.0 TTS-Square/1.0", accept:"application/json", ...headers } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally { clearTimeout(timer); }
}

function downsample(candles: Candle[], every: number): Candle[] {
  if (every <= 1) return candles;
  const out: Candle[] = [];
  for (let i = 0; i < candles.length; i += every) {
    const s = candles.slice(i, i+every);
    out.push({ t:s[0].t, o:s[0].o, h:Math.max(...s.map(c=>c.h)), l:Math.min(...s.map(c=>c.l)), c:s[s.length-1].c, v:s.reduce((a,c)=>a+c.v,0) });
  }
  return out;
}
function daysAgo(n:number){ const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); }
function today(){ return new Date().toISOString().slice(0,10); }

async function fromBinance(symbol:string, interval:Interval): Promise<Candle[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${BINANCE_INTERVAL[interval]}&limit=500`;
  const raw = (await fetchJson(url)) as any[];
  if (!Array.isArray(raw) || raw.length < 10) throw new Error("binance empty");
  return raw.map(k => ({ t:+k[0], o:+k[1], h:+k[2], l:+k[3], c:+k[4], v:+k[5] }));
}

async function fromYahoo(symbol:string, interval:Interval): Promise<Candle[]> {
  const {interval:yi, range} = YAHOO_INTERVAL[interval];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${yi}&range=${range}&includePrePost=false`;
  const json = (await fetchJson(url)) as any;
  const r = json.chart?.result?.[0];
  const ts = r?.timestamp ?? [];
  const q = r?.indicators?.quote?.[0];
  if (!ts.length || !q) throw new Error("yahoo empty");
  const candles: Candle[] = [];
  for (let i=0;i<ts.length;i++){
    const o=q.open?.[i], h=q.high?.[i], l=q.low?.[i], c=q.close?.[i];
    if (![o,h,l,c].every(n => typeof n==="number" && Number.isFinite(n))) continue;
    candles.push({ t:ts[i]*1000, o, h, l, c, v:q.volume?.[i]??0 });
  }
  if (interval==="4h") return downsample(candles,4);
  if (candles.length<10) throw new Error("yahoo sparse");
  return candles;
}

async function fromFyers(symbol:string, interval:Interval): Promise<Candle[]> {
  const appId = env("FYERS_APP_ID");
  const token = env("FYERS_ACCESS_TOKEN");
  if (!appId || !token) throw new Error("fyers credentials missing");
  const lookback: Record<Interval,number> = {"15m":14,"1h":60,"4h":120,"1d":500,"1w":1200};
  const params = new URLSearchParams({
    symbol, resolution: FYERS_RESOLUTION[interval], date_format:"1",
    range_from: daysAgo(lookback[interval]??60), range_to: today(), cont_flag:"1",
  });
  const json = (await fetchJson(`https://api-t1.fyers.in/data/history?${params}`, 12000, { Authorization: `${appId}:${token}` })) as any;
  if (json.s !== "ok" || !Array.isArray(json.candles) || json.candles.length < 5)
    throw new Error(`fyers empty: ${json.message ?? json.code}`);
  return json.candles.map((k:number[]) => ({ t:k[0]*1000, o:k[1], h:k[2], l:k[3], c:k[4], v:k[5]??0 }));
}

export async function loadMarket(symbolId:string, interval:Interval): Promise<{candles:Candle[]; source:"binance"|"yahoo"|"fyers"|"synthetic"}> {
  const def = findSymbol(symbolId);
  if (def.fyers && env("FYERS_ACCESS_TOKEN") && env("FYERS_APP_ID")) {
    try { return { candles: await fromFyers(def.fyers, interval), source: "fyers" }; } catch {}
  }
  if (def.binance) {
    try { return { candles: await fromBinance(def.binance, interval), source: "binance" }; } catch {}
  }
  if (def.yahoo) {
    try { return { candles: await fromYahoo(def.yahoo, interval), source: "yahoo" }; } catch {}
  }
  return { candles: generateSynthetic(symbolId, interval), source: "synthetic" };
}
