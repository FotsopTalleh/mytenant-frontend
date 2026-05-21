/** Format an amount in FCFA (XAF). Renders as "150 000 FCFA" in fr-CM style. */
export const formatCurrency = (amount: number, currency = "XAF") =>
  new Intl.NumberFormat("fr-CM", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

export const formatDate = (d: string | Date) =>
  new Intl.DateTimeFormat("fr-CM", { dateStyle: "medium" }).format(new Date(d));
