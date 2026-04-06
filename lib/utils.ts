export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function formatAmount(value: string | number | bigint) {
  const num = Number(value);
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(num);
}
