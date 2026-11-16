import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { CURRENCIES, DEFAULT_EXCHANGE_RATES, type CurrencyInfo } from '../data/studioData';

const RATES_CACHE_KEY = 'mushaf_exchange_rates_cache';
const SELECTED_CURRENCY_KEY = 'mushaf_selected_currency';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CurrencyContextValue {
  currency: string;
  setCurrency: (code: string) => void;
  rates: Record<string, number>;
  activeCurrencyInfo: CurrencyInfo;
  formatFromUSD: (usdAmount: number, options?: { prefix?: string }) => string;
  formatUSD: (usdAmount: number, options?: { prefix?: string }) => string;
  formatUSDRange: (minUSD: number, maxUSD: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function roundNiceAmount(amount: number): number {
  const digits = Math.round(amount).toString().length;
  const factor = Math.pow(10, Math.max(0, digits - 2));
  return Math.round(amount / factor) * factor;
}

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(SELECTED_CURRENCY_KEY);
      if (saved && CURRENCIES.some((c) => c.code === saved)) return saved;
    } catch {}
    return 'USD';
  });

  const [rates, setRates] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(RATES_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.rates) {
          return { ...DEFAULT_EXCHANGE_RATES, ...parsed.rates };
        }
      }
    } catch {}
    return DEFAULT_EXCHANGE_RATES;
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = localStorage.getItem(RATES_CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.rates) {
            return;
          }
        }
      } catch {}

      try {
        const res = await fetch('https://api.frankfurter.app/latest?from=USD');
        if (!res.ok) return;
        const json = await res.json();
        if (json?.rates && active) {
          const merged = {
            ...DEFAULT_EXCHANGE_RATES,
            USD: 1,
            ...json.rates,
          };
          setRates(merged);
          try {
            localStorage.setItem(
              RATES_CACHE_KEY,
              JSON.stringify({ timestamp: Date.now(), rates: merged })
            );
          } catch {}
        }
      } catch {
        // Silent static fallback
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setCurrency = useCallback((code: string) => {
    if (CURRENCIES.some((c) => c.code === code)) {
      setCurrencyState(code);
      try {
        localStorage.setItem(SELECTED_CURRENCY_KEY, code);
      } catch {}
    }
  }, []);

  const activeCurrencyInfo = useMemo(
    () => CURRENCIES.find((c) => c.code === currency) || CURRENCIES[1],
    [currency]
  );

  const formatFromUSD = useCallback(
    (usdAmount: number, options?: { prefix?: string }) => {
      const rate = rates[currency] || activeCurrencyInfo.defaultRateToUSD || 1;
      const converted = currency === 'USD' ? usdAmount : roundNiceAmount(usdAmount * rate);
      return `${options?.prefix ?? ''}${activeCurrencyInfo.symbol}${converted.toLocaleString('en-US')}`;
    },
    [currency, rates, activeCurrencyInfo]
  );

  const formatUSDRange = useCallback(
    (minUSD: number, maxUSD: number) =>
      `${formatFromUSD(minUSD)} - ${formatFromUSD(maxUSD)}`,
    [formatFromUSD]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        rates,
        activeCurrencyInfo,
        formatFromUSD,
        formatUSD: formatFromUSD,
        formatUSDRange,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return ctx;
}
