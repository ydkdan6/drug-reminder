import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useSoundStore } from '../store/soundStore';
import { sendReminderEmail } from '../config/emailjs';
import { format } from 'date-fns';

export const checkAndSendReminders = async () => {
  // This is now handled by useReminderService hook
  console.log('Use useReminderService hook instead');
};

export const useReminderService = () => {
  const intervalRef = useRef<NodeJS.Timeout>();
  const { getSoundUrl } = useSoundStore();
  const lastCheckedRef = useRef<string>('');
  const isServiceRunningRef = useRef<boolean>(false);

  // Enhanced function to get sound URL with fallback
  const getSoundUrlWithFallback = useCallback(async (filePath?: string): Promise<string> => {
    try {
      if (!filePath) {
        console.log('No file path provided, using default sound');
        return '/sound/notification-sound.wav';
      }

      console.log('Getting sound URL for path:', filePath);
      
      // Try to get from Supabase storage first
      const soundUrl = await getSoundUrl(filePath);
      
      if (soundUrl) {
        console.log('Successfully got sound URL from storage:', soundUrl);
        return soundUrl;
      } else {
        console.log('No URL returned from storage, using fallback');
        return getFallbackSoundUrl(filePath);
      }
    } catch (error) {
      console.error('Error getting sound URL:', error);
      return getFallbackSoundUrl(filePath);
    }
  }, [getSoundUrl]);

  // Fallback function to use sounds from public folder
  const getFallbackSoundUrl = (soundPath: string): string => {
    // Extract just the filename from the full path
    const filename = soundPath.split('/').pop() || '';
    
    // Define your fallback sounds in public folder
    const fallbackSounds: Record<string, string> = {
      'mixkit-urgent-simple-tone-loop-2976.wav': '/sound/urgent-tone.wav',
      'notification-sound.wav': '/sound/notification-sound.wav',
      'default': '/sound/notification-sound.wav'
    };

    // Check if we have a specific fallback for this sound
    const fallbackUrl = fallbackSounds[filename] || fallbackSounds.default;

    console.log(`Falling back to public sound: ${fallbackUrl}`);
    return fallbackUrl;
  };

  // Function to play sound notification
  const playSoundNotification = useCallback(async (filePath?: string) => {
    try {
      console.log('playSoundNotification called with:', filePath);
      
      // Get the sound URL with fallback handling
      const audioUrl = await getSoundUrlWithFallback(filePath);
      
      console.log('Attempting to play sound:', audioUrl);
      
      const audio = new Audio(audioUrl);
      audio.volume = 0.8; // Set volume to 80%
      
      // Add event listeners for debugging
      audio.addEventListener('canplaythrough', () => {
        console.log('Audio can play through');
      });
      
      audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        // Try one more fallback
        tryFallbackSound();
      });
      
      // Function to try a simple fallback sound
      const tryFallbackSound = async () => {
        try {
          console.log('Trying fallback sound...');
          const fallbackAudio = new Audio('/sound/notification-sound.wav');
          fallbackAudio.volume = 0.8;
          await fallbackAudio.play();
          console.log('Fallback sound played successfully');
        } catch (fallbackError) {
          console.error('Fallback sound also failed:', fallbackError);
        }
      };
      
      await audio.play();
      console.log('Audio played successfully');
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('Medication Reminder', {
          body: 'Time to take your medication!',
          icon: '/favicon.ico'
        });
        console.log('Browser notification shown');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error playing sound notification:', error);
      
      // Try one final fallback
      try {
        console.log('Trying final fallback sound...');
        const finalFallback = new Audio('/sound/notification-sound.wav');
        finalFallback.volume = 0.8;
        await finalFallback.play();
        return { success: true };
      } catch (finalError) {
        console.error('All sound attempts failed:', finalError);
        return { success: false, error: finalError };
      }
    }
  }, [getSoundUrlWithFallback]);

  // Function to send email reminder using EmailJS
  const sendEmailReminder = useCallback(async (
    email: string,
    name: string,
    medicationName: string,
    dosage: string,
    time: string,
    period: string
  ) => {
    try {
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      
      console.log('Email config:', { templateId, serviceId });
      
      if (!templateId || !serviceId) {
        console.error('EmailJS configuration missing');
        return { success: false, error: 'Email configuration missing' };
      }

      // Validate email before sending
      if (!email || email.trim() === '') {
        console.error('Recipient email address is empty');
        return { success: false, error: 'Recipient email address is empty' };
      }
      
      const templateParams = {
        email: email,
        email: email, // Alternative field name for EmailJS
        user_email: email, // Another alternative field name
        to_name: name,
        user_name: name,
        medication_name: medicationName,
        dosage,
        time: `${time} ${period}`,
        date: format(new Date(), 'MMMM dd, yyyy'),
      };
      
      console.log('Sending email with params:', templateParams);
      
      const result = await sendReminderEmail(templateId, templateParams, serviceId);
      console.log('Email send result:', result);
      
      return result;
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error };
    }
  }, []);

  // Main function to check and process reminders
  const processReminders = useCallback(async () => {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Create a unique identifier for this minute to avoid duplicate processing
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      const period = currentHour >= 12 ? 'PM' : 'AM';
      const currentCheck = `${format(now, 'yyyy-MM-dd')}-${timeString}-${period}`;
      
      // Skip if we already processed this exact time
      if (lastCheckedRef.current === currentCheck) {
        console.log('Already processed this time:', currentCheck);
        return { success: true, message: 'Already processed' };
      }
      
      lastCheckedRef.current = currentCheck;
      
      // Get current date in ISO format
      const currentDate = format(now, 'yyyy-MM-dd');
      
      console.log(`Checking reminders for ${currentDate} at ${timeString} ${period}`);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user');
        return { success: false, error: 'No authenticated user' };
      }
      
      // Query for active reminders that match the current time and belong to current user
      const { data: reminders, error } = await supabase
        .from('reminders')
        .select(`
          *,
          medications!inner (
            id,
            name,
            dosage,
            description,
            user_id,
            start_date,
            end_date
          ),
          reminder_sounds (
            id,
            file_path
          )
        `)
        .eq('time', timeString)
        .eq('period', period)
        .eq('is_active', true)
        .eq('medications.user_id', user.id);
      
      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log(`Found ${reminders?.length || 0} reminders to process`);
      console.log('Reminders data:', reminders);
      
      // Process each reminder
      for (const reminder of reminders || []) {
        const medication = reminder.medications;
        
        // Check if the medication is within its date range
        if (
          medication &&
          medication.start_date <= currentDate &&
          medication.end_date >= currentDate
        ) {
          console.log(`Processing reminder for ${medication.name}`);
          console.log(`Date range: ${medication.start_date} to ${medication.end_date}, current: ${currentDate}`);
          
          // Get user profile for email
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', user.id)
            .single();
          
          console.log('User data:', userData);
          
          // Send email reminder (don't block on email errors)
          if (userData?.email && !userError) {
            try {
              const emailResult = await sendEmailReminder(
                userData.email,
                userData.full_name || 'User',
                medication.name,
                medication.dosage || '',
                timeString,
                period
              );
              console.log(`Email result for ${medication.name}:`, emailResult);
            } catch (emailError) {
              console.error('Email sending failed:', emailError);
            }
          } else {
            console.log('No email or user error:', userError);
          }
          
          // Play sound notification - FIXED: Use correct function name and property
          try {
            const soundFilePath = reminder.reminder_sounds?.file_path;
            console.log('Sound file path:', soundFilePath);
            const soundResult = await playSoundNotification(soundFilePath); // Fixed: was playReminderSound
            console.log(`Sound result for ${medication.name}:`, soundResult);
          } catch (soundError) {
            console.error('Sound playing failed:', soundError);
          }
        } else {
          console.log(`Medication ${medication?.name} is outside date range or invalid`);
        }
      }
      
      return { success: true, processed: reminders?.length || 0 };
    } catch (error) {
      console.error('Error checking reminders:', error);
      return { success: false, error };
    }
  }, [sendEmailReminder, playSoundNotification]);

  // Start the reminder service
  const startReminderService = useCallback(() => {
    // Prevent multiple instances
    if (isServiceRunningRef.current) {
      console.log('Service already running, skipping start');
      return;
    }
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    isServiceRunningRef.current = true;
    
    // Check every 30 seconds (you can adjust this)
    intervalRef.current = setInterval(() => {
      processReminders(); // Fixed: was calling checkAndSendReminders instead of processReminders
    }, 30000);
    
    // Also check immediately
    processReminders();
    
    console.log('Reminder service started');
  }, [processReminders]); // Fixed: added processReminders to dependencies

  // Stop the reminder service
  const stopReminderService = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    isServiceRunningRef.current = false;
    console.log('Reminder service stopped');
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // Auto-start service when component mounts and user is authenticated
  useEffect(() => {
    const checkAuthAndStart = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('User authenticated, starting service');
        await requestNotificationPermission();
        startReminderService();
      }
    };

    checkAuthAndStart();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN' && session) {
        requestNotificationPermission();
        startReminderService();
      } else if (event === 'SIGNED_OUT') {
        stopReminderService();
      }
    });

    // Cleanup on unmount
    return () => {
      stopReminderService();
      subscription.unsubscribe();
    };
  }, [startReminderService, stopReminderService, requestNotificationPermission]);

  return {
    startReminderService,
    stopReminderService,
    processReminders,
    requestNotificationPermission
  };
};