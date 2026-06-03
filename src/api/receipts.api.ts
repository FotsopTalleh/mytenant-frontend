import { axiosClient } from "./axiosClient";
import type { PaginatedResponse } from "./properties.api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Receipt {
  id: string;
  paymentId: string;
  tenantId: string;
  landlordId: string;
  propertyId: string;
  receiptNumber: string;
  amountPaid: number;
  paymentDate: string;
  pdfUrl: string;
  createdAt: string;
  isManual?: boolean;
  status?: "draft" | "disbursed";
  tenantName?: string;
  landlordName?: string;
  propertyName?: string;
  propertyAddress?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  periodLabel?: string;
}

export interface ManualReceiptBody {
  tenantId: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: "cash" | "mobile_money" | "bank_transfer" | "other";
  referenceNumber?: string;
  notes?: string;
}

export interface DisburseReceiptBody {
  tenantName?: string;
  amountPaid?: number;
  paymentDate?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  periodLabel?: string;
}

// ── Receipts API ──────────────────────────────────────────────────────────────

export const receiptsApi = {

  async list(params?: {
    page?: number;
    limit?: number;
    propertyId?: string;
  }): Promise<PaginatedResponse<Receipt>> {
    const { data } = await axiosClient.get<PaginatedResponse<Receipt>>("/receipts", { params });
    return data;
  },

  async get(id: string): Promise<Receipt> {
    const { data } = await axiosClient.get<{ data: Receipt }>(`/receipts/${id}`);
    return data.data;
  },

  /**
   * Open the receipt in a new browser tab.
   *
   * FIX: window.open() must be called synchronously within the user-gesture
   * call stack, or browsers will block it as a popup. We open the window
   * immediately (about:blank), then navigate it to the receipt content once
   * we have the URL / blob ready.
   *
   * Strategy:
   *   1. Open a blank tab immediately (synchronous — inside the click handler).
   *   2. Call /receipts/<id>/download — if pdfUrl is set (Cloudinary PDF),
   *      navigate the tab to the PDF URL directly.
   *   3. If pdfUrl is empty (WeasyPrint/GTK unavailable in dev), fetch the
   *      HTML preview via /receipts/<id>/preview (auth header attached by
   *      axiosClient), build a Blob URL, and navigate the tab to it.
   *      The user can then Ctrl+P → "Save as PDF" from the browser.
   */
  async openReceipt(id: string): Promise<void> {
    // ── Step 1: Open the tab NOW (synchronous, inside the user-gesture). ──────
    // This must happen before any await, or the browser treats it as a popup.
    const newTab = window.open("about:blank", "_blank", "noreferrer");

    try {
      // ── Step 2: Fetch the download metadata. ─────────────────────────────
      const { data } = await axiosClient.get<{
        data: { pdfUrl: string; hasPreview: boolean };
      }>(`/receipts/${id}/download`);

      const { pdfUrl, hasPreview } = data.data;

      if (pdfUrl) {
        // Cloudinary PDF — navigate the already-open tab to it.
        if (newTab) {
          newTab.location.href = pdfUrl;
        } else {
          // Fallback: popup was blocked before we could control it.
          window.open(pdfUrl, "_blank", "noreferrer");
        }
        return;
      }

      if (hasPreview) {
        // ── Step 3: Fetch the rendered HTML with auth header. ──────────────
        const htmlResp = await axiosClient.get<Blob>(`/receipts/${id}/preview`, {
          responseType: "blob",
        });
        const blobUrl = URL.createObjectURL(
          new Blob([htmlResp.data], { type: "text/html; charset=utf-8" })
        );

        if (newTab) {
          newTab.location.href = blobUrl;
          // Revoke the object URL after the tab has had time to load it.
          setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
        } else {
          // Fallback: try opening directly (may be blocked).
          const fallbackTab = window.open(blobUrl, "_blank", "noreferrer");
          if (fallbackTab) setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
        }
        return;
      }

      // No content — close the blank tab we opened and throw.
      newTab?.close();
      throw new Error("No receipt content available.");
    } catch (err) {
      // Close the blank tab so it doesn't linger on error.
      try { newTab?.close(); } catch { /* ignore */ }
      throw err;
    }
  },

  /**
   * Download the receipt PDF directly to the user's device.
   *
   * If a Cloudinary PDF URL exists: creates a hidden <a download> and clicks
   * it — the browser will download the file without opening a new tab.
   *
   * If no PDF (dev/WeasyPrint unavailable): falls back to openReceipt() so
   * the user still gets the HTML preview they can print-to-PDF from the
   * browser.
   */
  async downloadReceipt(id: string): Promise<void> {
    const { data } = await axiosClient.get<{
      data: { pdfUrl: string; hasPreview: boolean };
    }>(`/receipts/${id}/download`);

    const { pdfUrl, hasPreview } = data.data;

    if (pdfUrl) {
      // Fetch the PDF as a blob so the browser triggers a real download
      // instead of navigating to the Cloudinary URL in a new tab.
      const pdfResp = await axiosClient.get<Blob>(pdfUrl, {
        responseType: "blob",
        // Don't pass auth headers to Cloudinary — the URL is already signed.
        // Override baseURL so axiosClient doesn't prepend the API base.
        baseURL: "",
      });
      const blobUrl = URL.createObjectURL(
        new Blob([pdfResp.data], { type: "application/pdf" })
      );
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = `receipt-${id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
      return;
    }

    // No PDF available — open the HTML preview instead (same as openReceipt).
    if (hasPreview) {
      await receiptsApi.openReceipt(id);
    }
  },

  /**
   * Landlord creates a receipt for a hand/cash payment without requiring the
   * tenant to upload a proof image.  The backend creates an approved payment
   * record (isManual=true) and then generates the receipt document.
   */
  async createManual(body: ManualReceiptBody): Promise<Receipt> {
    const { data } = await axiosClient.post<{ data: Receipt }>("/receipts/manual", body);
    return data.data;
  },

  /** Fetch draft receipt data for the landlord edit form. */
  async getDraft(receiptId: string): Promise<Receipt> {
    const { data } = await axiosClient.get<{ data: Receipt }>(`/receipts/${receiptId}/draft`);
    return data.data;
  },

  /** Landlord finalises the draft receipt (with optional edits) and disburses it to the tenant. */
  async disburse(receiptId: string, body: DisburseReceiptBody): Promise<Receipt> {
    const { data } = await axiosClient.patch<{ data: Receipt }>(`/receipts/${receiptId}/disburse`, body);
    return data.data;
  },

  /** @deprecated Use openReceipt() instead — kept for backward compat */
  async getDownloadUrl(id: string): Promise<string> {
    const { data } = await axiosClient.get<{ data: { pdfUrl: string } }>(`/receipts/${id}/download`);
    return data.data.pdfUrl;
  },
};
