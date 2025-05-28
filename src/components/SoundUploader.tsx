import React, { useState } from 'react';
import { Upload, Music } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import { useSoundStore } from '../store/soundStore';

interface SoundUploaderProps {
  onUploadComplete?: (soundId: string) => void;
}

const SoundUploader: React.FC<SoundUploaderProps> = ({ onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const { uploadSound } = useSoundStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Check if it's an audio file
    if (!selectedFile.type.startsWith('audio/')) {
      setError('Please select an audio file');
      setFile(null);
      return;
    }
    
    // Check file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (selectedFile.size > MAX_SIZE) {
      setError('File size exceeds the maximum limit of 5MB');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError('');
    
    // Use the file name as the default name (without extension)
    const fileName = selectedFile.name.split('.').slice(0, -1).join('.');
    setName(fileName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select an audio file');
      return;
    }
    
    if (!name.trim()) {
      setError('Please enter a name for the sound');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const result = await uploadSound(file, name);
      
      if (result.success && result.id) {
        // Reset form
        setFile(null);
        setName('');
        setError('');
        
        // Notify parent component
        if (onUploadComplete) {
          onUploadComplete(result.id);
        }
      } else {
        setError(result.error || 'Failed to upload sound');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Notification Sound</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sound File (Max 5MB)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center">
            <Music className="h-10 w-10 text-gray-400 mb-2" />
            
            {file ? (
              <div className="flex flex-col items-center">
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500 mb-2">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  Change File
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-2">
                  Drag and drop your audio file here, or click to browse
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('sound-file')?.click()}
                >
                  Select File
                </Button>
              </>
            )}
            
            <input
              id="sound-file"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
        
        <Input
          label="Sound Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a name for this sound"
          fullWidth
          required
        />
        
        <div className="mt-4">
          <Button
            type="submit"
            isLoading={isUploading}
            disabled={!file || !name}
            fullWidth
            icon={<Upload className="h-4 w-4" />}
          >
            Upload Sound
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SoundUploader;