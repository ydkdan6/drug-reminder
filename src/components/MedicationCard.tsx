import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Edit, Trash } from 'lucide-react';
import Card, { CardContent, CardFooter } from './ui/Card';
import { formatDate, formatTime } from '../utils/dateUtils';
import type { Medication, Reminder } from '../types';

interface MedicationCardProps {
  medication: Medication;
  reminder?: Reminder;
  onDelete: (id: string) => void;
}

const MedicationCard: React.FC<MedicationCardProps> = ({ 
  medication, 
  reminder, 
  onDelete 
}) => {
  const isActive = (): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return medication.start_date <= today && medication.end_date >= today;
  };

  return (
    <Card className="h-full transition-transform duration-200 hover:shadow-lg hover:-translate-y-1">
      <CardContent>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{medication.name}</h3>
            <p className="text-sm text-gray-500">{medication.dosage}</p>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isActive() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isActive() ? 'Active' : 'Inactive'}
          </div>
        </div>
        
        {medication.description && (
          <p className="mt-2 text-sm text-gray-700">{medication.description}</p>
        )}
        
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-xs text-gray-500">Start Date</p>
            <p className="text-sm font-medium">{formatDate(medication.start_date)}</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-xs text-gray-500">End Date</p>
            <p className="text-sm font-medium">{formatDate(medication.end_date)}</p>
          </div>
        </div>
        
        {reminder && (
          <div className="mt-3 flex items-center">
            <Clock className="h-4 w-4 text-blue-500 mr-1" />
            <span className="text-sm text-gray-700">
              {formatTime(reminder.time, reminder.period)}
            </span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between items-center">
        <Link 
          to={`/medications/edit/${medication.id}`}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Link>
        <button 
          onClick={() => onDelete(medication.id)}
          className="inline-flex items-center text-sm text-red-600 hover:text-red-800"
        >
          <Trash className="h-4 w-4 mr-1" />
          Delete
        </button>
      </CardFooter>
    </Card>
  );
};

export default MedicationCard;