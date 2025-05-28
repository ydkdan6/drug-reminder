import { create } from 'zustand';
import { supabase } from '../config/supabase';
import type { Medication, MedicationFormData, Reminder } from '../types';

interface MedicationState {
  medications: Medication[];
  reminders: Reminder[];
  isLoading: boolean;
  error: string | null;
  fetchMedications: () => Promise<void>;
  fetchReminders: (medicationId?: string) => Promise<void>;
  addMedication: (data: MedicationFormData) => Promise<{ success: boolean; id?: string; error?: string }>;
  updateMedication: (id: string, data: Partial<MedicationFormData>) => Promise<{ success: boolean; error?: string }>;
  deleteMedication: (id: string) => Promise<{ success: boolean; error?: string }>;
  getMedicationById: (id: string) => Medication | undefined;
}

export const useMedicationStore = create<MedicationState>((set, get) => ({
  medications: [],
  reminders: [],
  isLoading: false,
  error: null,

  // RLS will automatically filter by user - no need for manual user_id filtering
  fetchMedications: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ medications: data || [] });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // RLS will automatically filter by user - no need for manual user_id filtering
  fetchReminders: async (medicationId) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase.from('reminders').select('*');
      
      if (medicationId) {
        query = query.eq('medication_id', medicationId);
      }
      
      const { data, error } = await query.order('time', { ascending: true });

      if (error) throw error;
      set({ reminders: data || [] });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addMedication: async (data) => {
    try {
      console.log('addMedication received data:', data);

      // Validate user_id before proceeding
      if (!data.user_id || data.user_id.trim() === '') {
        throw new Error('user_id is required and cannot be empty');
      }

      // Prepare the medication data
      const insertData = {
        user_id: data.user_id.toString().trim(),
        name: data.name?.toString().trim(),
        dosage: data.dosage?.toString().trim(),
        description: data.description?.toString().trim() || null,
        start_date: data.start_date?.toString(),
        end_date: data.end_date?.toString(),
      };

      console.log('About to insert medication with data:', insertData);

      const { data: medicationData, error: medicationError } = await supabase
        .from('medications')
        .insert([insertData])
        .select('id')
        .single();

      if (medicationError) {
        console.error('Medication insert error:', medicationError);
        throw medicationError;
      }

      console.log('Successfully inserted medication:', medicationData);

      // Add the reminder with user_id
      const { error: reminderError } = await supabase
        .from('reminders')
        .insert([
          {
            medication_id: medicationData.id,
            user_id: data.user_id.toString().trim(), // Add user_id to reminder
            time: data.time,
            period: data.period,
            sound_id: data.sound_id,
            is_active: true,
          },
        ]);

      if (reminderError) throw reminderError;

      // Refresh the medications list
      await get().fetchMedications();
      
      return { success: true, id: medicationData.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  updateMedication: async (id, data) => {
    try {
      // Update medication
      const { error: medicationError } = await supabase
        .from('medications')
        .update({
          name: data.name,
          dosage: data.dosage,
          description: data.description,
          start_date: data.start_date,
          end_date: data.end_date,
        })
        .eq('id', id);

      if (medicationError) throw medicationError;

      // If time or period is provided, update the reminder
      if (data.time || data.period || data.sound_id !== undefined) {
        const updates: any = {};
        if (data.time) updates.time = data.time;
        if (data.period) updates.period = data.period;
        if (data.sound_id !== undefined) updates.sound_id = data.sound_id;

        const { error: reminderError } = await supabase
          .from('reminders')
          .update(updates)
          .eq('medication_id', id);

        if (reminderError) throw reminderError;
      }

      // Refresh the medications list
      await get().fetchMedications();
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  deleteMedication: async (id) => {
    try {
      // Delete reminders first (foreign key constraint)
      const { error: reminderError } = await supabase
        .from('reminders')
        .delete()
        .eq('medication_id', id);

      if (reminderError) throw reminderError;

      // Then delete the medication
      const { error: medicationError } = await supabase
        .from('medications')
        .delete()
        .eq('id', id);

      if (medicationError) throw medicationError;

      // Update the state
      set(state => ({
        medications: state.medications.filter(med => med.id !== id),
        reminders: state.reminders.filter(rem => rem.medication_id !== id)
      }));
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getMedicationById: (id) => {
    return get().medications.find(med => med.id === id);
  },
}));