import React, { useEffect, useState} from 'react';
import { Play, Trash } from 'lucide-react';
import Card, { CardContent } from './ui/Card';
import Button from './ui/Button';
import { useSoundStore } from '../store/soundStore';

const SoundList: React.FC = () => {
  const { sounds, fetchSounds, deleteSound, getSoundUrl } = useSoundStore();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchSounds();
  }, [fetchSounds]);

  const handlePlay = async (id: string, filePath: string) => {
    try {
      const url = await getSoundUrl(filePath);
      
      if (!url) {
        console.error('Failed to get sound URL');
        return;
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(url);
      audioRef.current.addEventListener('ended', () => setPlayingId(null));
      audioRef.current.play();
      setPlayingId(id);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this sound?')) {
      // Stop playing if this sound is being played
      if (playingId === id && audioRef.current) {
        audioRef.current.pause();
        setPlayingId(null);
      }
      
      await deleteSound(id);
    }
  };

  if (sounds.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">No sound files uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <audio ref={audioRef} className="hidden" />
      
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium text-gray-900">Your Sound Files</h3>
      </div>
      
      <div className="divide-y">
        {sounds.map((sound) => (
          <div key={sound.id} className="p-4 flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">{sound.name}</h4>
              <p className="text-sm text-gray-500">
                {(sound.file_size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePlay(sound.id, sound.file_path)}
                disabled={playingId === sound.id}
              >
                <Play className="h-4 w-4" />
                {playingId === sound.id ? 'Playing' : 'Play'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(sound.id)}
              >
                <Trash className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SoundList;