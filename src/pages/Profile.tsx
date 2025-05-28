import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';

interface ProfileFormData {
  full_name: string;
  avatar_url?: string;
}

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: {
      full_name: user?.full_name || '',
      avatar_url: user?.avatar_url || '',
    }
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const result = await updateProfile(data);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="py-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || 'User'}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-blue-500" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  {user?.full_name || 'User'}
                </h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
              <p className="text-sm text-gray-500">
                Update your profile information
              </p>
            </CardHeader>
            
            <CardContent>
              {message && (
                <div 
                  className={`mb-4 p-3 rounded-md ${
                    message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {message.text}
                </div>
              )}
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  id="full_name"
                  label="Full Name"
                  placeholder="Your full name"
                  icon={<User className="h-5 w-5 text-gray-400" />}
                  {...register('full_name', { required: 'Full name is required' })}
                  error={errors.full_name?.message}
                  fullWidth
                />
                
                <Input
                  id="email"
                  label="Email Address"
                  value={user?.email}
                  readOnly
                  disabled
                  icon={<Mail className="h-5 w-5 text-gray-400" />}
                  fullWidth
                />
                
                <Input
                  id="avatar_url"
                  label="Avatar URL (optional)"
                  placeholder="https://example.com/avatar.jpg"
                  {...register('avatar_url')}
                  fullWidth
                />
                
                <Button
                  type="submit"
                  isLoading={isLoading}
                >
                  Update Profile
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;