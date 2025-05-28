import React from 'react';
import { useForm } from 'react-hook-form';
import Button from './ui/Button';
import Input from './ui/Input';
import TextArea from './ui/TextArea';
import Select from './ui/Select';
import { useSoundStore } from '../store/soundStore';
import { MedicationFormData } from '../types';

interface MedicationFormProps {
  onSubmit: (data: MedicationFormData) => void;
  defaultValues?: Partial<MedicationFormData>;
  isLoading?: boolean;
}

const MedicationForm: React.FC<MedicationFormProps> = ({ 
  onSubmit, 
  defaultValues, 
  isLoading = false 
}) => {
  const { sounds, fetchSounds } = useSoundStore();
  const { register, handleSubmit, formState: { errors } } = useForm<MedicationFormData>({
    defaultValues: {
      name: '',
      dosage: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '08:00',
      period: 'AM',
      ...defaultValues,
    }
  });

  React.useEffect(() => {
    fetchSounds();
  }, [fetchSounds]);

  const periodOptions = [
    { value: 'AM', label: 'AM' },
    { value: 'PM', label: 'PM' },
  ];

  const soundOptions = [
    { value: '', label: 'Default Sound' },
    ...sounds.map(sound => ({ value: sound.id, label: sound.name })),
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

      <Select
        id="sound_id"
        label="Notification Sound"
        options={soundOptions}
        {...register('sound_id')}
        fullWidth
      />

      <Button type="submit" isLoading={isLoading} fullWidth>
        {defaultValues ? 'Update Medication' : 'Add Medication'}
      </Button>
    </form>
  );
};

export default MedicationForm;