import { create } from 'zustand';
import { supabase } from '../config/supabase';
import type { ReminderSound } from '../types';

interface SoundState {
  sounds: ReminderSound[];
  isLoading: boolean;
  error: string | null;
  fetchSounds: () => Promise<void>;
  uploadSound: (file: File, name: string) => Promise<{ success: boolean; id?: string; error?: string }>;
  deleteSound: (id: string) => Promise<{ success: boolean; error?: string }>;
  getSoundById: (id: string) => ReminderSound | undefined;
  getSoundUrl: (filePath: string) => Promise<string>;
}

export const useSoundStore = create<SoundState>((set, get) => ({
  sounds: [],
  isLoading: false,
  error: null,

  fetchSounds: async () => {
  set({ isLoading: true, error: null });
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      set({ error: 'User not authenticated' });
      return;
    }

    const { data, error } = await supabase
      .from('reminder_sounds')
      .select('*')
      .eq('user_id', user.id) // Filter by current user
      .order('created_at', { ascending: false });

    if (error) throw error;
    set({ sounds: data || [] });
  } catch (error: any) {
    set({ error: error.message });
  } finally {
    set({ isLoading: false });
  }
},

  uploadSound: async (file, name) => {
  // Check file size (5MB max)
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > MAX_SIZE) {
    return { 
      success: false, 
      error: 'File size exceeds the maximum limit of 5MB' 
    };
  }

    try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Use a simpler path structure
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('sounds')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Add record to the database with user_id
    const { data, error: dbError } = await supabase
      .from('reminder_sounds')
      .insert([
        {
          name,
          file_path: filePath,
          file_size: file.size,
          user_id: user.id, // This is the key addition
        },
      ])
      .select('id')
      .single();

    if (dbError) throw dbError;

    // Refresh the sounds list
    await get().fetchSounds();
    
    return { success: true, id: data.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
},

  deleteSound: async (id) => {
    try {
      // Get the file path first
      const sound = get().getSoundById(id);
      if (!sound) {
        return { success: false, error: 'Sound not found' };
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('sounds')
        .remove([sound.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('reminder_sounds')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // Update the state
      set(state => ({
        sounds: state.sounds.filter(s => s.id !== id)
      }));
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getSoundById: (id) => {
    return get().sounds.find(sound => sound.id === id);
  },

  // Update your getSoundUrl function in soundStore.ts
getSoundUrl: async (filePath) => {
  try {
    console.log('Getting sound URL for path:', filePath);
    
    const { data, error } = await supabase.storage
      .from('sounds')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error('Storage error:', error);
      throw error;
    }
    
    console.log('Generated signed URL:', data.signedUrl);
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting sound URL:', error);
    // Return empty string to fall back to default sound
    return '';
  }
},
}));