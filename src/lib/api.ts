import type { CoinGeckoMarket } from '@/lib/types';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export async function fetchMarketData(
  perPage = 50,
  page = 1
): Promise<CoinGeckoMarket[]> {
  const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=24h,7d`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
  return res.json();
}

export async function fetchGlobalStats(): Promise<{
  data: {
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    active_cryptocurrencies: number;
    markets: number;
    market_cap_change_percentage_24h_usd: number;
  };
}> {
  const res = await fetch(`${COINGECKO_BASE}/global`);
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
  return res.json();
}

export async function fetchCoinPriceChart(
  coinId: string,
  days = 7
): Promise<{ prices: [number, number][] }> {
  const url = `${COINGECKO_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
  return res.json();
}
