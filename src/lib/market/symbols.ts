export type MarketSource = "binance" | "yahoo" | "fyers" | "synthetic";
export type Interval = "15m" | "1h" | "4h" | "1d" | "1w";
export type SymbolDef = {
  id: string;
  label: string;
  yahoo?: string;
  binance?: string;
  fyers?: string;
  kind: "crypto" | "index" | "fx" | "commodity" | "equity";
};

export const SYMBOLS: SymbolDef[] = [
  { id: "BTCUSDT", label: "BTC / USDT", binance: "BTCUSDT", yahoo: "BTC-USD", kind: "crypto" },
  { id: "ETHUSDT", label: "ETH / USDT", binance: "ETHUSDT", yahoo: "ETH-USD", kind: "crypto" },
  { id: "SOLUSDT", label: "SOL / USDT", binance: "SOLUSDT", yahoo: "SOL-USD", kind: "crypto" },
  { id: "NIFTY", label: "NIFTY 50", fyers: "NSE:NIFTY50-INDEX", yahoo: "^NSEI", kind: "index" },
  { id: "BANKNIFTY", label: "BANK NIFTY", fyers: "NSE:NIFTYBANK-INDEX", yahoo: "^NSEBANK", kind: "index" },
  { id: "GIFTNIFTY", label: "GIFT NIFTY (proxy)", fyers: "NSE:NIFTY50-INDEX", yahoo: "^NSEI", kind: "index" },
  { id: "CRUDEOIL", label: "MCX CRUDE OIL", fyers: "MCX:CRUDEOIL26SEPFUT", yahoo: "CL=F", kind: "commodity" },
  { id: "GOLD", label: "MCX GOLD", fyers: "MCX:GOLD26OCTFUT", yahoo: "GC=F", kind: "commodity" },
  { id: "USOIL", label: "USOIL (WTI)", yahoo: "CL=F", kind: "commodity" },
  { id: "XAUUSDT", label: "Gold / USDT", binance: "PAXGUSDT", yahoo: "GC=F", kind: "commodity" },
  { id: "RELIANCE", label: "RELIANCE", fyers: "NSE:RELIANCE-EQ", yahoo: "RELIANCE.NS", kind: "equity" },
  { id: "TCS", label: "TCS", fyers: "NSE:TCS-EQ", yahoo: "TCS.NS", kind: "equity" },
  { id: "HDFCBANK", label: "HDFC BANK", fyers: "NSE:HDFCBANK-EQ", yahoo: "HDFCBANK.NS", kind: "equity" },
  { id: "INFY", label: "INFOSYS", fyers: "NSE:INFY-EQ", yahoo: "INFY.NS", kind: "equity" },
  { id: "ICICIBANK", label: "ICICI BANK", fyers: "NSE:ICICIBANK-EQ", yahoo: "ICICIBANK.NS", kind: "equity" },
  { id: "SBIN", label: "SBI", fyers: "NSE:SBIN-EQ", yahoo: "SBIN.NS", kind: "equity" },
  { id: "BHARTIARTL", label: "BHARTI AIRTEL", fyers: "NSE:BHARTIARTL-EQ", yahoo: "BHARTIARTL.NS", kind: "equity" },
  { id: "ITC", label: "ITC", fyers: "NSE:ITC-EQ", yahoo: "ITC.NS", kind: "equity" },
  { id: "LT", label: "LARSEN & TOUBRO", fyers: "NSE:LT-EQ", yahoo: "LT.NS", kind: "equity" },
  { id: "AXISBANK", label: "AXIS BANK", fyers: "NSE:AXISBANK-EQ", yahoo: "AXISBANK.NS", kind: "equity" },
  { id: "KOTAKBANK", label: "KOTAK BANK", fyers: "NSE:KOTAKBANK-EQ", yahoo: "KOTAKBANK.NS", kind: "equity" },
  { id: "SPX", label: "S&P 500", yahoo: "^GSPC", kind: "index" },
  { id: "EURUSD", label: "EUR / USD", yahoo: "EURUSD=X", kind: "fx" },
];

export const INTERVALS: { id: Interval; label: string }[] = [
  { id: "15m", label: "15m" }, { id: "1h", label: "1H" }, { id: "4h", label: "4H" },
  { id: "1d", label: "1D" }, { id: "1w", label: "1W" },
];

export function findSymbol(id: string): SymbolDef {
  return SYMBOLS.find((s) => s.id === id) ?? SYMBOLS[0];
}
