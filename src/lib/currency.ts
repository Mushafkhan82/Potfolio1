import type { CurrencyCode } from '../types/store';

export const CURRENCY_META: Record<
  CurrencyCode,
  { symbol: string; label: string; decimals: number }
> = {
  PKR: { symbol: 'Rs ', label: 'PKR (Rs)', decimals: 0 },
  USD: { symbol: '$', label: 'USD ($)', decimals: 2 },
  AED: { symbol: 'AED ', label: 'AED', decimals: 0 },
  GBP: { symbol: '£', label: 'GBP (£)', decimals: 2 },
  EUR: { symbol: '€', label: 'EUR (€)', decimals: 2 },
};

export const DEFAULT_EXCHANGE_RATES: Record<CurrencyCode, number> = {
  PKR: 1,
  USD: 0.0036, // ~278 PKR per USD
  AED: 0.0132,
  GBP: 0.0028,
  EUR: 0.0033,
};

export function convertFromPKR(
  amountPKR: number,
  target: CurrencyCode,
  rates: Record<CurrencyCode, number> = DEFAULT_EXCHANGE_RATES
): number {
  const rate = rates[target] ?? DEFAULT_EXCHANGE_RATES[target] ?? 1;
  return amountPKR * rate;
}

export function formatMoney(
  amountPKR: number,
  currency: CurrencyCode = 'PKR',
  rates: Record<CurrencyCode, number> = DEFAULT_EXCHANGE_RATES
): string {
  const meta = CURRENCY_META[currency] || CURRENCY_META.PKR;
  const converted = convertFromPKR(Number(amountPKR || 0), currency, rates);
  if (meta.decimals === 0) {
    return `${meta.symbol}${Math.round(converted).toLocaleString('en-US')}`;
  }
  return `${meta.symbol}${converted.toLocaleString('en-US', {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  })}`;
}
