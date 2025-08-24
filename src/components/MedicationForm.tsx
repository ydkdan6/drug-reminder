import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Button from './ui/Button';
import Input from './ui/Input';
import TextArea from './ui/TextArea';
import Select from './ui/Select';
import { useSoundStore } from '../store/soundStore';
import { getSoundOptions, playNotificationSound } from '../utils/soundUtils';
import { MedicationFormData } from '../types';

interface MedicationFormProps {
  onSubmit: (data: MedicationFormData) => void;
  defaultValues?: Partial<MedicationFormData>;
  isLoading?: boolean;
}

// Built-in sound options from public folder
const PUBLIC_FOLDER_SOUNDS = [
  { id: 'notification-sound', name: 'Notification Sound', path: '/sound/notification-sound.wav' },
  { id: 'urgent-tone', name: 'Urgent Tone', path: '/sound/notificaton-1.wav' },
  { id: 'mixkit-urgent', name: 'Urgent Simple Tone', path: '/sound/notificaton-2.wav' },
  // Add more sounds from your public/sound folder here
];

const MedicationForm: React.FC<MedicationFormProps> = ({
  onSubmit,
  defaultValues,
  isLoading = false
}) => {
  const { sounds, fetchSounds, getSoundUrl } = useSoundStore();
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<MedicationFormData>({
    defaultValues: {
      name: '',
      dosage: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '08:00',
      period: 'AM',
      sound_id: 'notification-sound', // Default to one of your public sounds
      ...defaultValues,
    }
  });

  const selectedSoundId = watch('sound_id');

  useEffect(() => {
    const loadSounds = async () => {
      await fetchSounds();
      console.log('Fetched sounds:', sounds);
    };
    loadSounds();
  }, [fetchSounds]);

  // Debug log to see what sounds we have
  useEffect(() => {
    console.log('Current sounds from store:', sounds);
    const options = getSoundOptions(sounds);
    console.log('Generated sound options:', options);
    console.log('Selected sound ID:', selectedSoundId);
  }, [sounds, selectedSoundId]);

  // Function to play selected sound
  const playSound = async (soundId: string) => {
    if (isPlaying) return; // Prevent multiple sounds playing at once

    setIsPlaying(soundId);

    try {
      console.log('Playing sound:', soundId);
      console.log('Available sounds:', sounds);
      
      const audio = await playNotificationSound(soundId, sounds, getSoundUrl, {
        volume: 0.7,
        onEnd: () => {
          setIsPlaying(null);
        },
        onError: (error) => {
          console.error(`Failed to play sound: ${soundId}`, error);
          setIsPlaying(null);
        }
      });

      if (!audio) {
        console.warn('No audio returned, sound may not exist');
        setIsPlaying(null);
      }
    } catch (error) {
      console.error('Error playing sound:', error);
      setIsPlaying(null);
    }
  };

  // Function to handle form submission with sound test
  const handleFormSubmit = (data: MedicationFormData) => {
    onSubmit(data);
    
    // Play the selected sound as confirmation
    if (data.sound_id) {
      setTimeout(() => playSound(data.sound_id), 500);
    }
  };

  const periodOptions = [
    { value: 'AM', label: 'AM' },
    { value: 'PM', label: 'PM' },
  ];

  // Use the utility function to get sound options
  const soundOptions = getSoundOptions(sounds);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Input
        id="name"
        label="Medication Name"
        placeholder="Enter medication name"
        {...register('name', { required: 'Medication name is required' })}
        error={errors.name?.message}
        fullWidth
      />

      <Input
        id="dosage"
        label="Dosage"
        placeholder="e.g., 10mg, 1 tablet"
        {...register('dosage', { required: 'Dosage is required' })}
        error={errors.dosage?.message}
        fullWidth
      />

      <TextArea
        id="description"
        label="Description"
        placeholder="Additional instructions or notes"
        {...register('description')}
        rows={3}
        fullWidth
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="start_date"
          label="Start Date"
          type="date"
          {...register('start_date', { required: 'Start date is required' })}
          error={errors.start_date?.message}
          fullWidth
        />

        <Input
          id="end_date"
          label="End Date"
          type="date"
          {...register('end_date', { required: 'End date is required' })}
          error={errors.end_date?.message}
          fullWidth
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="time"
          label="Time"
          type="time"
          {...register('time', { required: 'Time is required' })}
          error={errors.time?.message}
          fullWidth
        />

        <Select
          id="period"
          label="Period"
          options={periodOptions}
          {...register('period', { required: 'Period is required' })}
          error={errors.period?.message}
          fullWidth
        />
      </div>

      <div className="space-y-2">
        <Select
          id="sound_id"
          label="Notification Sound"
          options={soundOptions}
          {...register('sound_id')}
          fullWidth
        />
        
        {/* Temporary debug display */}
        <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
          <div><strong>Available options:</strong> {soundOptions.length}</div>
          <div><strong>Selected:</strong> {selectedSoundId || 'None'}</div>
          <div><strong>Supabase sounds:</strong> {sounds.length}</div>
        </div>
        
        {selectedSoundId && selectedSoundId !== '' && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => playSound(selectedSoundId)}
              disabled={isPlaying === selectedSoundId}
              className="text-sm"
            >
              {isPlaying === selectedSoundId ? '🔊 Playing...' : '🔊 Test Sound'}
            </Button>
          </div>
        )}
      </div>

      <Button type="submit" isLoading={isLoading} fullWidth>
        {defaultValues ? 'Update Medication' : 'Add Medication'}
      </Button>
    </form>
  );
};

export default MedicationForm;