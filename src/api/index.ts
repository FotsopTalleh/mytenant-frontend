// src/api/index.ts — Central export for all API modules
export { authApi } from "./auth.api";
export { propertiesApi } from "./properties.api";
export { tenantsApi } from "./tenants.api";
export { paymentsApi } from "./payments.api";
export { receiptsApi } from "./receipts.api";
export { notificationsApi } from "./notifications.api";
export { axiosClient } from "./axiosClient";

// Re-export types
export type { LoginResponse, InvitePreview } from "./auth.api";
export type { Property, PaginatedResponse, CreatePropertyBody } from "./properties.api";
export type { Tenant, InviteBody, InviteResult } from "./tenants.api";
export type { Payment, SubmitPaymentBody } from "./payments.api";
export type { Receipt, ManualReceiptBody } from "./receipts.api";
export type { AppNotification } from "./notifications.api";
