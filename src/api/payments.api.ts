import { axiosClient } from "./axiosClient";
import type { PaginatedResponse } from "./properties.api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  tenantId: string;
  userId: string;
  landlordId: string;
  propertyId: string;
  amountClaimed: number;
  amountVerified?: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  proofImageUrl: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  landlordNote?: string;
  submittedAt: string;
  reviewedAt?: string;
  ocrExtractedAmount?: number;
}

export interface SubmitPaymentBody {
  amountClaimed: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  proofFile: File;
}

// ── Payments API ──────────────────────────────────────────────────────────────

export const paymentsApi = {

  async list(params?: {
    page?: number;
    limit?: number;
    status?: string;
    propertyId?: string;
  }): Promise<PaginatedResponse<Payment>> {
    const { data } = await axiosClient.get<PaginatedResponse<Payment>>("/payments", { params });
    return data;
  },

  async get(id: string): Promise<Payment> {
    const { data } = await axiosClient.get<{ data: Payment }>(`/payments/${id}`);
    return data.data;
  },

  /** Tenant submits proof — uses multipart/form-data */
  async submit(body: SubmitPaymentBody): Promise<{ paymentId: string; proofImageUrl: string }> {
    const form = new FormData();
    form.append("amountClaimed", String(body.amountClaimed));
    form.append("paymentDate", body.paymentDate);
    form.append("paymentMethod", body.paymentMethod);
    if (body.referenceNumber) form.append("referenceNumber", body.referenceNumber);
    if (body.notes) form.append("notes", body.notes);
    form.append("proofFile", body.proofFile);

    const { data } = await axiosClient.post<{ data: { paymentId: string; proofImageUrl: string } }>(
      "/payments",
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data.data;
  },

  /** Landlord approves a pending payment */
  async approve(id: string, note?: string): Promise<void> {
    await axiosClient.patch(`/payments/${id}/approve`, { note });
  },

  /** Landlord rejects a pending payment */
  async reject(id: string, rejectionReason: string): Promise<void> {
    await axiosClient.patch(`/payments/${id}/reject`, { rejectionReason });
  },
};
