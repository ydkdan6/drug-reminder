import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent } from '../components/ui/Card';
import MedicationCard from '../components/MedicationCard';
import { useMedicationStore } from '../store/medicationStore';
import { useAuthStore } from '../store/authStore';

const MedicationList: React.FC = () => {
  const { medications, reminders, fetchMedications, fetchReminders, deleteMedication } = useMedicationStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Redirect if no user is logged in
  useEffect(() => {
    if (!user || !user.id || user.id.trim() === '') {
      console.log('No valid user, redirecting to login');
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadData = async () => {
      // Only fetch if user is available
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // RLS will automatically filter by user - no need to pass user ID
        await Promise.all([
          fetchMedications(),
          fetchReminders()
        ]);
      } catch (error) {
        console.error('Error loading medications and reminders:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [fetchMedications, fetchReminders, user?.id]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this medication?')) {
      await deleteMedication(id);
    }
  };

  const getReminderForMedication = (medicationId: string) => {
    return reminders.find(rem => rem.medication_id === medicationId);
  };

  const isActive = (medication: any): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return medication.start_date <= today && medication.end_date >= today;
  };

  const filteredMedications = medications
    .filter(med => {
      if (filter === 'active') return isActive(med);
      if (filter === 'inactive') return !isActive(med);
      return true;
    })
    .filter(med => 
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.dosage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (med.description && med.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  // Don't render if user is not available
  if (!user || !user.id || user.id.trim() === '') {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Medications</h1>
        <div className="mt-4 md:mt-0">
          <Link to="/medications/add">
            <Button icon={<Plus className="h-4 w-4" />}>
              Add Medication
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            placeholder="Search medications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            fullWidth
          />
        </div>
        
        <div className="flex">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilter('all')}
            className="rounded-r-none"
          >
            All
          </Button>
          <Button
            variant={filter === 'active' ? 'primary' : 'outline'}
            onClick={() => setFilter('active')}
            className="rounded-none border-l-0 border-r-0"
          >
            Active
          </Button>
          <Button
            variant={filter === 'inactive' ? 'primary' : 'outline'}
            onClick={() => setFilter('inactive')}
            className="rounded-l-none"
          >
            Inactive
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredMedications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedications.map(medication => (
            <MedicationCard
              key={medication.id}
              medication={medication}
              reminder={getReminderForMedication(medication.id)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            {searchTerm || filter !== 'all' ? (
              <p className="text-gray-500 mb-4">No medications match your search or filter</p>
            ) : (
              <>
                <p className="text-gray-500 mb-4">No medications added yet</p>
                <Link to="/medications/add">
                  <Button variant="outline" icon={<Plus className="h-4 w-4" />}>
                    Add Medication
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MedicationList;