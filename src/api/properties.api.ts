import { axiosClient } from "./axiosClient";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Property {
  id: string;
  landlordId: string;
  name: string;
  address: string;
  propertyType: string;
  monthlyRent: number;
  description?: string;
  tenantCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

export interface CreatePropertyBody {
  name: string;
  address: string;
  propertyType: string;
  monthlyRent: number;
  description?: string;
}

// ── Properties API ────────────────────────────────────────────────────────────

export const propertiesApi = {

  async list(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Property>> {
    const { data } = await axiosClient.get<PaginatedResponse<Property>>("/properties", { params });
    return data;
  },

  async get(id: string): Promise<Property> {
    const { data } = await axiosClient.get<{ data: Property }>(`/properties/${id}`);
    return data.data;
  },

  async create(body: CreatePropertyBody): Promise<Property> {
    const { data } = await axiosClient.post<{ data: Property }>("/properties", body);
    return data.data;
  },

  async update(id: string, body: Partial<CreatePropertyBody>): Promise<Property> {
    const { data } = await axiosClient.put<{ data: Property }>(`/properties/${id}`, body);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await axiosClient.delete(`/properties/${id}`);
  },
};
