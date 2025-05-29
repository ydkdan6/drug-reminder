import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Bell, Calendar, Clock } from 'lucide-react';
import Button from '../components/ui/Button';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import MedicationCard from '../components/MedicationCard';
import { useMedicationStore } from '../store/medicationStore';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../utils/dateUtils';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { medications, reminders, fetchMedications, fetchReminders, deleteMedication } = useMedicationStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchMedications(),
        fetchReminders()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, [fetchMedications, fetchReminders]);

  const todayMedications = medications.filter(med => {
    const today = new Date().toISOString().split('T')[0];
    return med.start_date <= today && med.end_date >= today;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this medication?')) {
      await deleteMedication(id);
    }
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const getReminderForMedication = (medicationId: string) => {
    return reminders.find(rem => rem.medication_id === medicationId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Good {getTimeOfDay()}, {user?.full_name || 'User'}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link to="/medications/add">
            <Button icon={<Plus className="h-4 w-4" />}>
              Add Medication
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="py-6">
            <div className="flex items-center">
              <Bell className="h-8 w-8 mr-3" />
              <div>
                <h3 className="text-xl font-bold">Today's Medications</h3>
                <p className="text-blue-100">{todayMedications.length} active reminders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
          <CardContent className="py-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 mr-3" />
              <div>
                <h3 className="text-xl font-bold">Total Medications</h3>
                <p className="text-teal-100">{medications.length} medications tracked</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <span className="text-blue-600 text-lg font-bold">{new Date().getDate()}</span>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Today's Date</h3>
                <p className="text-gray-500">{formatDate(new Date().toISOString())}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Medications</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : todayMedications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {todayMedications.map(medication => (
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
              <p className="text-gray-500 mb-4">No medications scheduled for today</p>
              <Link to="/medications/add">
                <Button variant="outline" icon={<Plus className="h-4 w-4" />}>
                  Add Medication
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Schedule</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : medications.length > 0 ? (
          <div className="overflow-hidden bg-white shadow sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {medications.slice(0, 5).map(medication => {
                const reminder = getReminderForMedication(medication.id);
                return (
                  <li key={medication.id}>
                    <Link to={`/medications/edit/${medication.id}`} className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-medium text-blue-600">{medication.name}</p>
                          <div className="ml-2 flex flex-shrink-0">
                            <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                              {medication.dosage}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              {reminder && (
                                <>
                                  <Clock className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                                  {formatDate(reminder.time, reminder.period)}
                                </>
                              )}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <Calendar className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                            <p>
                              {formatDate(medication.start_date)} - {formatDate(medication.end_date)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {medications.length > 5 && (
              <div className="bg-gray-50 px-4 py-3 text-center text-sm">
                <Link to="/medications" className="font-medium text-blue-600 hover:text-blue-500">
                  View all medications
                </Link>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No medications added yet</p>
              <Link to="/medications/add">
                <Button variant="outline" icon={<Plus className="h-4 w-4" />}>
                  Add Medication
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;