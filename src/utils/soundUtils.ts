// utils/soundUtils.ts

// Public folder sound mappings (update these to match your actual files)
const PUBLIC_FOLDER_SOUNDS = {
  'notification-sound': '/sound/notification-sound.wav',
  'notificaton-sound-1': '/sound/notification-1.wav',
  'notificaton-sound-2': '/sound/notification-2.wav',
};

interface PlaySoundOptions {
  volume?: number;
  loop?: boolean;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Play a notification sound by ID
 * @param soundId - The ID of the sound to play
 * @param customSounds - Array of custom sounds from your Supabase store
 * @param getSoundUrl - Function to get Supabase sound URLs
 * @param options - Additional options for playing the sound
 * @returns Promise that resolves when sound starts playing
 */
export const playNotificationSound = async (
  soundId: string, 
  customSounds: Array<{ id: string; file_path: string; name: string }> = [],
  getSoundUrl?: (filePath: string) => Promise<string>,
  options: PlaySoundOptions = {}
): Promise<HTMLAudioElement | null> => {
  const { volume = 0.8, loop = false, onEnd, onError } = options;

  if (!soundId || soundId === '') {
    return null; // No sound selected
  }

  try {
    let soundPath = '';

    // Check public folder sounds first
    if (PUBLIC_FOLDER_SOUNDS[soundId as keyof typeof PUBLIC_FOLDER_SOUNDS]) {
      soundPath = PUBLIC_FOLDER_SOUNDS[soundId as keyof typeof PUBLIC_FOLDER_SOUNDS];
    } else {
      // Check Supabase sounds
      const supabaseSound = customSounds.find(sound => sound.id === soundId);
      if (supabaseSound && getSoundUrl) {
        soundPath = await getSoundUrl(supabaseSound.file_path);
      }
    }

    if (!soundPath) {
      throw new Error(`Sound with ID "${soundId}" not found`);
    }

    const audio = new Audio(soundPath);
    audio.volume = volume;
    audio.loop = loop;

    // Set up event listeners
    if (onEnd) {
      audio.addEventListener('ended', onEnd);
    }

    if (onError) {
      audio.addEventListener('error', () => {
        onError(new Error(`Failed to load sound: ${soundPath}`));
      });
    }

    // Play the sound
    await audio.play();
    return audio;

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error playing sound';
    console.error('Error playing notification sound:', errorMsg);
    
    if (options.onError) {
      options.onError(new Error(errorMsg));
    }
    
    return null;
  }
};

/**
 * Play reminder notification with potential repetition
 * @param soundId - The ID of the sound to play
 * @param customSounds - Array of custom sounds from your Supabase store
 * @param getSoundUrl - Function to get Supabase sound URLs
 * @param repeatCount - Number of times to repeat the sound (default: 3)
 * @param repeatInterval - Interval between repeats in milliseconds (default: 2000)
 */
export const playReminderNotification = async (
  soundId: string,
  customSounds: Array<{ id: string; file_path: string; name: string }> = [],
  getSoundUrl?: (filePath: string) => Promise<string>,
  repeatCount: number = 3,
  repeatInterval: number = 2000
): Promise<void> => {
  let playCount = 0;

  const playNext = async () => {
    if (playCount >= repeatCount) return;

    try {
      await playNotificationSound(soundId, customSounds, getSoundUrl, {
        volume: 0.8,
        onEnd: () => {
          playCount++;
          if (playCount < repeatCount) {
            setTimeout(playNext, repeatInterval);
          }
        },
        onError: (error) => {
          console.error('Error in reminder notification:', error);
        }
      });
    } catch (error) {
      console.error('Failed to play reminder notification:', error);
    }
  };

  await playNext();
};

/**
 * Get all available sound options for dropdowns
 * @param customSounds - Array of custom sounds from your Supabase store
 * @returns Array of sound options for select components
 */
export const getSoundOptions = (
  customSounds: Array<{ id: string; file_path: string; name: string }> = []
) => {
  const publicOptions = Object.entries(PUBLIC_FOLDER_SOUNDS).map(([id, path]) => {
    // Convert ID to display name
    const name = id.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    return { value: id, label: name };
  });

  const supabaseOptions = customSounds.map(sound => ({
    value: sound.id,
    label: sound.name
  }));

  return [
    { value: '', label: 'No Sound' },
    { value: 'public_header', label: '--- Public Sounds ---', disabled: true },
    ...publicOptions,
    ...(supabaseOptions.length > 0 ? [
      { value: 'supabase_header', label: '--- Uploaded Sounds ---', disabled: true },
      ...supabaseOptions
    ] : [])
  ];
};

/**
 * Preload sounds for better performance
 * @param soundIds - Array of sound IDs to preload
 * @param customSounds - Array of custom sounds from your Supabase store
 * @param getSoundUrl - Function to get Supabase sound URLs
 */
export const preloadSounds = async (
  soundIds: string[],
  customSounds: Array<{ id: string; file_path: string; name: string }> = [],
  getSoundUrl?: (filePath: string) => Promise<string>
): Promise<void> => {
  const preloadPromises = soundIds.map(async (soundId) => {
    if (!soundId || soundId === '') return;

    try {
      let soundPath = '';

      if (PUBLIC_FOLDER_SOUNDS[soundId as keyof typeof PUBLIC_FOLDER_SOUNDS]) {
        soundPath = PUBLIC_FOLDER_SOUNDS[soundId as keyof typeof PUBLIC_FOLDER_SOUNDS];
      } else {
        const supabaseSound = customSounds.find(sound => sound.id === soundId);
        if (supabaseSound && getSoundUrl) {
          soundPath = await getSoundUrl(supabaseSound.file_path);
        }
      }

      if (soundPath) {
        const audio = new Audio(soundPath);
        audio.preload = 'auto';
        // Don't actually play, just load
        audio.load();
      }
    } catch (error) {
      console.warn(`Failed to preload sound: ${soundId}`, error);
    }
  });

  await Promise.allSettled(preloadPromises);
};