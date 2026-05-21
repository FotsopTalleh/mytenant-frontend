import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Receipt, Download, ExternalLink, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { receiptsApi } from "@/api";
import type { Receipt as ReceiptType } from "@/api";
import { formatCurrency, formatDate } from "@/utils/format";

export const Route = createFileRoute("/_tenant/tenant/receipts")({
  head: () => ({ meta: [{ title: "Receipts — MyTenant" }] }),
  component: ReceiptsPage,
});

// Track which receipt is being acted on, and what action is running.
type ActiveAction = { id: string; action: "view" | "download" } | null;

function ReceiptsPage() {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<ActiveAction>(null);

  const receiptsQ = useQuery({
    queryKey: ["receipts", "my"],
    queryFn: () => receiptsApi.list({ limit: 100 }),
  });

  const receipts: ReceiptType[] =
    (receiptsQ.data as { data?: ReceiptType[] } | undefined)?.data ?? [];
  const filtered = receipts.filter((r) =>
    r.receiptNumber.toLowerCase().includes(search.toLowerCase())
  );

  // ── View (open in new tab) ─────────────────────────────────────────────────
  // IMPORTANT: window.open() must be called synchronously inside the click
  // handler. receiptsApi.openReceipt() handles this by opening about:blank
  // immediately before any await, then navigating it once the URL is ready.
  const handleView = async (r: ReceiptType) => {
    setActive({ id: r.id, action: "view" });
    try {
      await receiptsApi.openReceipt(r.id);
    } catch {
      toast.error("Could not open receipt. Please try again.");
    } finally {
      setActive(null);
    }
  };

  // ── Download (save to disk) ────────────────────────────────────────────────
  const handleDownload = async (r: ReceiptType) => {
    setActive({ id: r.id, action: "download" });
    try {
      await receiptsApi.downloadReceipt(r.id);
    } catch {
      toast.error("Could not download receipt. Please try again.");
    } finally {
      setActive(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Receipts</h1>
        <p className="text-muted-foreground text-sm mt-1">
          View and download your approved rent receipts.
        </p>
      </div>

      {receipts.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="rounded-xl h-10 pl-9"
            placeholder="Search receipt number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {receiptsQ.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center rounded-2xl border border-dashed border-border">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Receipt className="h-7 w-7" />
          </div>
          <h3 className="font-semibold">
            {receipts.length > 0 ? "No results" : "No receipts yet"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            {receipts.length > 0
              ? "Try a different search term."
              : "Receipts are issued once your landlord approves a payment."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Receipt #</span>
            <span className="text-right">Amount</span>
            <span className="text-right hidden sm:block">Date</span>
            <span />
          </div>

          <ul className="divide-y divide-border">
            {filtered.map((r) => {
              const isViewing   = active?.id === r.id && active.action === "view";
              const isDownloading = active?.id === r.id && active.action === "download";
              const isBusy = active?.id === r.id;

              return (
                <li
                  key={r.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.receiptNumber}</p>
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {formatDate(r.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-right">
                    {formatCurrency(r.amountPaid)}
                  </div>

                  <div className="text-sm text-muted-foreground text-right hidden sm:block">
                    {formatDate(r.createdAt)}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* View in new tab */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => handleView(r)}
                      disabled={isBusy}
                      title="View receipt in new tab"
                    >
                      {isViewing
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <ExternalLink className="h-4 w-4" />
                      }
                    </Button>

                    {/* Download to disk */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => handleDownload(r)}
                      disabled={isBusy}
                      title="Download receipt PDF"
                    >
                      {isDownloading
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Download className="h-4 w-4" />
                      }
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            {filtered.length} receipt{filtered.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </div>
        </div>
      )}
    </div>
  );
}
