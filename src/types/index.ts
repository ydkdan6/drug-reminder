// User related types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
}

// Medication related types
export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  description: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

// Reminder related types
export interface Reminder {
  id: string;
  medication_id: string;
  time: string; // Format: HH:MM
  period: 'AM' | 'PM';
  sound_id?: string;
  is_active: boolean;
  created_at: string;
}

// Sound related types
export interface ReminderSound {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_size: number; // in bytes
  created_at: string;
}

// Auth related types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  full_name: string;
}

// Form related types
export interface MedicationFormData {
  name: string;
  dosage: string;
  description: string;
  start_date: string;
  end_date: string;
  time: string;
  period: 'AM' | 'PM';
  sound_id?: string;
  id?: string;
  user_id?: string;
}