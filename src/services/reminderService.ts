import { sendReminderEmail } from '../config/emailjs';
import { supabase } from '../config/supabase';
import { format } from 'date-fns';

// This function will check for medications that need reminders and trigger them
export const checkAndSendReminders = async () => {
  try {
    // Get current time
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Format time for comparison
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    const period = currentHour >= 12 ? 'PM' : 'AM';
    
    // Get current date in ISO format
    const currentDate = format(now, 'yyyy-MM-dd');
    
    // Query for active reminders that match the current time
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select(`
        *,
        medications (
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
      .eq('is_active', true);
    
    if (error) throw error;
    
    // Process each reminder
    for (const reminder of reminders || []) {
      const medication = reminder.medications;
      
      // Check if the medication is within its date range
      if (
        medication &&
        medication.start_date <= currentDate &&
        medication.end_date >= currentDate
      ) {
        // Get the user's email
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', medication.user_id)
          .single();
        
        if (userError) {
          console.error('Error getting user data:', userError);
          continue;
        }
        
        // Send email reminder
        if (userData?.email) {
          await sendEmailReminder(
            userData.email,
            userData.full_name || 'User',
            medication.name,
            medication.dosage,
            timeString,
            period
          );
        }
        
        // Play sound notification if the user is online
        // This will be handled by the client-side code
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error checking reminders:', error);
    return { success: false, error };
  }
};

// Function to send email reminder using EmailJS
export const sendEmailReminder = async (
  email: string,
  name: string,
  medicationName: string,
  dosage: string,
  time: string,
  period: string
) => {
  // These values will be provided by the user
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID';
  
  const templateParams = {
    to_email: email,
    to_name: name,
    medication_name: medicationName,
    dosage,
    time: `${time} ${period}`,
    date: format(new Date(), 'MMMM dd, yyyy'),
  };
  
  return sendReminderEmail(templateId, templateParams, serviceId);
};

// Function to play sound notification
export const playSoundNotification = async (soundUrl?: string) => {
  try {
    // Use the provided sound URL or fall back to a default sound
    const url = soundUrl || '/sounds/default-notification.mp3';
    const audio = new Audio(url);
    await audio.play();
    return { success: true };
  } catch (error) {
    console.error('Error playing sound notification:', error);
    return { success: false, error };
  }
};