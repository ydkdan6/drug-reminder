import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import MedicationForm from '../components/MedicationForm';
import { useMedicationStore } from '../store/medicationStore';
import type { MedicationFormData } from '../types';
import { parseTimeString } from '../utils/dateUtils';

const EditMedication: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<MedicationFormData> | null>(null);
  const { medications, reminders, fetchMedications, fetchReminders, updateMedication } = useMedicationStore();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        await Promise.all([
          fetchMedications(),
          fetchReminders(id)
        ]);
      }
    };
    
    loadData();
  }, [id, fetchMedications, fetchReminders]);

  useEffect(() => {
    if (id && medications.length > 0) {
      const medication = medications.find(m => m.id === id);
      const reminder = reminders.find(r => r.medication_id === id);
      
      if (medication && reminder) {
        setFormData({
          name: medication.name,
          dosage: medication.dosage,
          description: medication.description,
          start_date: medication.start_date,
          end_date: medication.end_date,
          time: reminder.time,
          period: reminder.period,
          sound_id: reminder.sound_id,
        });
      }
    }
  }, [id, medications, reminders]);

  const handleSubmit = async (data: MedicationFormData) => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const result = await updateMedication(id, data);
      if (result.success) {
        navigate('/medications');
      } else {
        alert(result.error || 'Failed to update medication');
      }
    } catch (error) {
      console.error('Error updating medication:', error);
      alert('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-900">Edit Medication</h1>
          <p className="text-gray-600">
            Update the details of your medication and reminder
          </p>
        </CardHeader>
        
        <CardContent>
          {formData ? (
            <MedicationForm
              onSubmit={handleSubmit}
              defaultValues={formData}
              isLoading={isLoading}
            />
          ) : (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EditMedication;