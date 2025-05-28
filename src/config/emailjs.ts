import emailjs from '@emailjs/browser';

// Initialize EmailJS with user's public key
// Will be replaced with the actual value provided by the user
export const initEmailJS = () => {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_EMAILJS_PUBLIC_KEY';
  emailjs.init(publicKey);
};

// Function to send reminder emails
export const sendReminderEmail = async (
  templateId: string,
  templateParams: Record<string, unknown>,
  serviceId: string
) => {
  try {
    const response = await emailjs.send(serviceId, templateId, templateParams);
    return { success: true, response };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
};