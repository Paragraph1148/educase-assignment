// ─── Domain Types ────────────────────────────────────────────────────────────

export interface School {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface CreateSchoolDTO {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface SchoolWithDistance extends School {
  distance_km: number;
}

// ─── API Response Shape ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}
