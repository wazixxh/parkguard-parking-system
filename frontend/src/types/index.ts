export type UserRole = 'super_admin' | 'staff';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  department?: string;
  created_at?: string;
  updated_at?: string;
}

export type VehicleType = 'car' | 'motorcycle' | 'van' | 'truck' | 'suv' | 'other';
export type VehicleStatus = 'active' | 'inactive' | 'blocked';

export interface Vehicle {
  id: number;
  vehicle_id: string;
  plate_number: string;
  vehicle_type: VehicleType;
  make: string;
  model: string;
  color?: string;
  owner_name: string;
  owner_phone?: string;
  department_id?: number;
  parking_area_id?: number;
  status: VehicleStatus;
  notes?: string;
  qr_token: string;
  barcode_token: string;
  created_at: string;
  updated_at: string;
  is_parked?: boolean;
  current_transaction_id?: string;
}

export interface ParkingTransaction {
  id: number;
  transaction_id: string;
  vehicle_id: number;
  plate_number: string;
  vehicle_type: string;
  owner_name: string;
  make: string;
  model: string;
  entry_time: string;
  exit_time?: string;
  duration_minutes?: number;
  entry_method: string;
  exit_method?: string;
  parking_area_name?: string;
  status: 'parked' | 'exited';
  notes?: string;
  entry_staff_name?: string;
  exit_staff_name?: string;
}

export interface ScanValidationResult {
  valid: boolean;
  result: 'success' | 'not_found' | 'blocked' | 'inactive';
  message: string;
  vehicle?: Vehicle;
  is_parked: boolean;
  active_transaction_id?: string;
  parked_duration_minutes?: number;
}

export interface ScanEvent {
  id: number;
  scanned_token: string;
  scan_type: string;
  result: string;
  message?: string;
  vehicle_id?: number;
  plate_number?: string;
  staff_name?: string;
  scanned_at: string;
}

export interface Incident {
  id: number;
  incident_id: string;
  category: 'wrong_parking' | 'blocked_access' | 'unauthorized_parking' | 'security_followup' | 'other';
  location: string;
  description: string;
  status: 'open' | 'under_review' | 'resolved' | 'dismissed';
  resolution_notes?: string;
  vehicle_id?: number;
  plate_number?: string;
  owner_name?: string;
  owner_phone?: string;
  reporter_id: number;
  reporter_name?: string;
  resolved_by_name?: string;
  resolved_at?: string;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface ParkingArea {
  id: number;
  name: string;
  code: string;
  total_capacity: number;
  occupied_count: number;
  is_active: boolean;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor_id?: number;
  actor_email?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  outcome: string;
  ip_address?: string;
  details?: string;
  created_at: string;
}

export interface DashboardStats {
  total_vehicles: number;
  currently_parked: number;
  entered_today: number;
  exited_today: number;
  active_staff_count: number;
  blocked_vehicles_count: number;
  open_incidents_count: number;
  occupancy_rate_percent: number;
  vehicle_type_distribution: { type: string; count: number }[];
  daily_activity_trends: { date: string; entries: number; exits: number }[];
  recent_transactions: ParkingTransaction[];
  recent_scans: ScanEvent[];
}

export interface PrintableCardData {
  vehicle_id: string;
  plate_number: string;
  vehicle_type: string;
  make_model: string;
  owner_name: string;
  department_name?: string;
  parking_area_name?: string;
  qr_token: string;
  barcode_token: string;
  qr_image_data_uri: string;
  registration_date: string;
}
