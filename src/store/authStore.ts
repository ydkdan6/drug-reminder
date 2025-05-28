import { create } from 'zustand';
import { supabase } from '../config/supabase';
import type { User, LoginCredentials, RegisterCredentials } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  getUser: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        set({
          user: {
            id: data.user.id,
            email: data.user.email!,
            full_name: profileData?.full_name,
            avatar_url: profileData?.avatar_url,
            created_at: data.user.created_at,
          },
          isAuthenticated: true,
        });
        return { success: true };
      }
      return { success: false, error: 'No user data returned' };
    } catch (error: any) {
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      if (data.user) {
        // Check if profile already exists before creating
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (!existingProfile) {
          // Only create profile if it doesn't exist
          const { error: profileError } = await supabase.from('profiles').insert([
            {
              id: data.user.id,
              full_name: credentials.full_name,
              email: credentials.email,
            },
          ]);

          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Don't throw error if it's a duplicate key constraint
            if (!profileError.message.includes('duplicate key')) {
              throw profileError;
            }
          }
        }

        // Fetch the profile data (whether it existed or was just created)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        set({
          user: {
            id: data.user.id,
            email: data.user.email!,
            full_name: profileData?.full_name || credentials.full_name,
            avatar_url: profileData?.avatar_url,
            created_at: data.user.created_at,
          },
          isAuthenticated: true,
        });
        return { success: true };
      }
      return { success: false, error: 'No user data returned' };
    } catch (error: any) {
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  getUser: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        set({ isAuthenticated: false, user: null });
        return;
      }

      if (data.user) {
        // Check if profile exists, create if it doesn't
        let { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!profileData) {
          // Create profile if it doesn't exist
          const { error: createError } = await supabase.from('profiles').insert([
            {
              id: data.user.id,
              email: data.user.email!,
              full_name: null,
              avatar_url: null,
            },
          ]);

          if (createError && !createError.message.includes('duplicate key')) {
            console.error('Error creating profile:', createError);
          }

          // Fetch the profile again
          const { data: newProfileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          profileData = newProfileData;
        }

        set({
          user: {
            id: data.user.id,
            email: data.user.email!,
            full_name: profileData?.full_name,
            avatar_url: profileData?.avatar_url,
            created_at: data.user.created_at,
          },
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.error('Error getting user:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    const user = get().user;
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      set({ user: { ...user, ...updates } });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
}));