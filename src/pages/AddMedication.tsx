import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import MedicationForm from '../components/MedicationForm';
import { useMedicationStore } from '../store/medicationStore';
import { useAuthStore } from '../store/authStore'; // Add this import
import type { MedicationFormData } from '../types';

const AddMedication: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { addMedication } = useMedicationStore();
  const { user } = useAuthStore(); // Get current user
  const navigate = useNavigate();

  // Redirect if no user is logged in
  useEffect(() => {
    console.log('AddMedication useEffect - user:', user);
    if (!user || !user.id || user.id.trim() === '') {
      console.log('No valid user, redirecting to login');
      navigate('/login'); // or wherever your login page is
    }
  }, [user, navigate]);

  const handleSubmit = async (data: MedicationFormData) => {
    // Debug logging
    console.log('User object:', user);
    console.log('User ID:', user?.id);
    console.log('User ID type:', typeof user?.id);
    console.log('Form data:', data);

    // Check for valid user ID (not just truthy, but actually a valid UUID)
    if (!user?.id || user.id.trim() === '') {
      console.error('Invalid user ID:', user?.id);
      alert('You must be logged in to add medications');
      return;
    }

    setIsLoading(true);
    try {
      // Include user_id in the medication data
      const medicationData = {
        ...data,
        user_id: user.id.trim(),
        email: user.email // Add email for profile creation if needed
      };
      
      console.log('Final medication data being sent:', medicationData);
      
      const result = await addMedication(medicationData);
      if (result.success) {
        navigate('/medications');
      } else {
        alert(result.error || 'Failed to add medication');
      }
    } catch (error) {
      console.error('Error adding medication:', error);
      alert('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render the form if user is not available or user ID is invalid
  if (!user || !user.id || user.id.trim() === '') {
    return <div>Loading...</div>;
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Add New Medication</h1>
          <p className="text-gray-600">
            Enter the details of your medication and set a reminder
          </p>
        </CardHeader>
       
        <CardContent>
          <MedicationForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AddMedication;