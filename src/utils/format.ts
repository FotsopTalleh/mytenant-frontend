export const formatCurrency = (amount: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

export const formatDate = (d: string | Date) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(d));
