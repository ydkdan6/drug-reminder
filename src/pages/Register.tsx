import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Bell } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import type { RegisterCredentials } from '../types';

const Register: React.FC = () => {
  const [error, setError] = useState('');
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterCredentials>({
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data: RegisterCredentials) => {
    setError('');
    const result = await registerUser(data);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Failed to create account. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Bell className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign up to start managing your medication reminders
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <Input
              id="full_name"
              type="text"
              label="Full Name"
              placeholder="John Doe"
              autoComplete="name"
              fullWidth
              {...register('full_name', { 
                required: 'Full name is required',
              })}
              error={errors.full_name?.message}
            />
            
            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              autoComplete="email"
              fullWidth
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                }
              })}
              error={errors.email?.message}
            />
            
            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              autoComplete="new-password"
              fullWidth
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                }
              })}
              error={errors.password?.message}
            />
          </div>

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
          >
            Create account
          </Button>
          
          <div className="text-center">
            <p className="mt-2 text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;