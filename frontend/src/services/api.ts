import axios from 'axios';
import type { 
  User, 
  Vehicle, 
  ParkingTransaction, 
  ScanValidationResult, 
  ScanEvent, 
  Incident, 
  Department, 
  ParkingArea, 
  AuditLog, 
  DashboardStats, 
  PrintableCardData 
} from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attach JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('parkguard_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Unified error interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('parkguard_token');
      localStorage.removeItem('parkguard_user');
      window.dispatchEvent(new Event('parkguard_auth_change'));
    }
    return Promise.reject(error);
  }
);

// Typed API services
export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return res.data;
  },

  // Vehicles
  getVehicles: async (params?: { search?: string; status?: string; vehicle_type?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get<{ total: number; page: number; limit: number; items: Vehicle[] }>('/vehicles', { params });
    return res.data;
  },
  createVehicle: async (payload: any): Promise<Vehicle> => {
    const res = await apiClient.post<Vehicle>('/vehicles', payload);
    return res.data;
  },
  getVehicleDetails: async (id: number): Promise<Vehicle> => {
    const res = await apiClient.get<Vehicle>(`/vehicles/${id}`);
    return res.data;
  },
  updateVehicle: async (id: number, payload: any): Promise<Vehicle> => {
    const res = await apiClient.put<Vehicle>(`/vehicles/${id}`, payload);
    return res.data;
  },
  deactivateVehicle: async (id: number): Promise<Vehicle> => {
    const res = await apiClient.patch<Vehicle>(`/vehicles/${id}/deactivate`);
    return res.data;
  },
  regenerateTokens: async (id: number): Promise<Vehicle> => {
    const res = await apiClient.post<Vehicle>(`/vehicles/${id}/regenerate-tokens`);
    return res.data;
  },
  getPrintableCard: async (id: number): Promise<PrintableCardData> => {
    const res = await apiClient.get<PrintableCardData>(`/vehicles/${id}/card`);
    return res.data;
  },

  // Parking Operations
  recordEntry: async (payload: { vehicle_identifier: string; entry_method: string; parking_area_id?: number; notes?: string }): Promise<ParkingTransaction> => {
    const res = await apiClient.post<ParkingTransaction>('/parking/entry', payload);
    return res.data;
  },
  recordExit: async (payload: { vehicle_identifier: string; exit_method: string; notes?: string }): Promise<ParkingTransaction> => {
    const res = await apiClient.post<ParkingTransaction>('/parking/exit', payload);
    return res.data;
  },
  getCurrentlyParked: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await apiClient.get<{ total: number; page: number; limit: number; items: ParkingTransaction[] }>('/parking/parked', { params });
    return res.data;
  },
  getTransactions: async (params?: { page?: number; limit?: number; search?: string; status?: string; vehicle_type?: string }) => {
    const res = await apiClient.get<{ total: number; page: number; limit: number; items: ParkingTransaction[] }>('/parking/transactions', { params });
    return res.data;
  },

  // Scanner
  validateScan: async (token: string, scanType: string = 'qr'): Promise<ScanValidationResult> => {
    const res = await apiClient.post<ScanValidationResult>('/scanner/validate', { token, scan_type: scanType });
    return res.data;
  },
  getScanHistory: async (params?: { limit?: number; result?: string }) => {
    const res = await apiClient.get<{ total: number; items: ScanEvent[] }>('/scanner/history', { params });
    return res.data;
  },

  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<DashboardStats>('/dashboard/stats');
    return res.data;
  },

  // Incidents
  getIncidents: async (params?: { status?: string; category?: string }) => {
    const res = await apiClient.get<{ total: number; items: Incident[] }>('/incidents', { params });
    return res.data;
  },
  createIncident: async (payload: { category: string; location: string; description: string; vehicle_identifier?: string }): Promise<Incident> => {
    const res = await apiClient.post<Incident>('/incidents', payload);
    return res.data;
  },
  updateIncident: async (id: number, payload: { status?: string; resolution_notes?: string }): Promise<Incident> => {
    const res = await apiClient.put<Incident>(`/incidents/${id}`, payload);
    return res.data;
  },

  // Departments & Areas
  getDepartments: async (): Promise<Department[]> => {
    const res = await apiClient.get<Department[]>('/departments');
    return res.data;
  },
  createDepartment: async (payload: { name: string; code: string; description?: string }): Promise<Department> => {
    const res = await apiClient.post<Department>('/departments', payload);
    return res.data;
  },
  getParkingAreas: async (): Promise<ParkingArea[]> => {
    const res = await apiClient.get<ParkingArea[]>('/parking-areas');
    return res.data;
  },
  createParkingArea: async (payload: { name: string; code: string; total_capacity: number }): Promise<ParkingArea> => {
    const res = await apiClient.post<ParkingArea>('/parking-areas', payload);
    return res.data;
  },

  // Staff Management (Super Admin)
  getUsers: async (params?: { role?: string; skip?: number; limit?: number }) => {
    const res = await apiClient.get<{ total: number; items: User[] }>('/users', { params });
    return res.data;
  },
  createUser: async (payload: any): Promise<User> => {
    const res = await apiClient.post<User>('/users', payload);
    return res.data;
  },
  updateUser: async (id: number, payload: any): Promise<User> => {
    const res = await apiClient.put<User>(`/users/${id}`, payload);
    return res.data;
  },

  // Audit Logs (Super Admin)
  getAuditLogs: async (params?: { page?: number; limit?: number; action?: string; resource_type?: string }) => {
    const res = await apiClient.get<{ total: number; items: AuditLog[] }>('/audit', { params });
    return res.data;
  },

  // Export CSV
  getExportUrl: (reportType: 'vehicles' | 'transactions' | 'incidents' | 'scans') => {
    const token = localStorage.getItem('parkguard_token');
    return `${API_BASE_URL}/reports/export-csv?report_type=${reportType}&token=${token || ''}`;
  },
  downloadCsv: async (reportType: 'vehicles' | 'transactions' | 'incidents' | 'scans') => {
    const res = await apiClient.get(`/reports/export-csv?report_type=${reportType}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `parkguard_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // System Settings (Super Admin)
  getSettings: async (): Promise<{ settings: Record<string, string>; metadata: any }> => {
    const res = await apiClient.get('/settings');
    return res.data;
  },
  updateSettings: async (settings: Record<string, string>) => {
    const res = await apiClient.patch('/settings', { settings });
    return res.data;
  }
};

export default apiClient;
