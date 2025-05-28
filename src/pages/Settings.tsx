import React from 'react';
import { Bell, UploadCloud } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import SoundUploader from '../components/SoundUploader';
import SoundList from '../components/SoundList';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Settings Menu</h2>
            </CardHeader>
            <CardContent>
              <nav className="space-y-1">
                <a
                  href="#notification-sounds"
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-700"
                >
                  <Bell className="mr-3 h-5 w-5" />
                  Notification Sounds
                </a>
                <a
                  href="#upload-sound"
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
                >
                  <UploadCloud className="mr-3 h-5 w-5" />
                  Upload New Sound
                </a>
              </nav>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <div id="notification-sounds">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Sounds</h2>
            <SoundList />
          </div>
          
          <div id="upload-sound">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Upload New Sound</h2>
            <SoundUploader />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;