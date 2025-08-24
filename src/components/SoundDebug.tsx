import React, { useEffect, useState } from 'react';
import { useSoundStore } from '../store/soundStore';
import { supabase } from '../config/supabase';

const SoundDebugComponent: React.FC = () => {
  const { sounds, fetchSounds, getSoundUrl } = useSoundStore();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const debugSounds = async () => {
      console.log('=== SOUND DEBUG START ===');
      
      // 1. Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('User:', user?.id, 'Error:', userError);
      
      // 2. Check database records
      const { data: dbSounds, error: dbError } = await supabase
        .from('reminder_sounds')
        .select('*');
      console.log('DB Sounds (all):', dbSounds, 'Error:', dbError);
      
      // 3. Check user-specific records
      if (user) {
        const { data: userSounds, error: userError } = await supabase
          .from('reminder_sounds')
          .select('*')
          .eq('user_id', user.id);
        console.log('User Sounds:', userSounds, 'Error:', userError);
      }
      
      // 4. Check storage bucket
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('sounds')
        .list('', { limit: 100 });
      console.log('Storage Files:', storageFiles, 'Error:', storageError);
      
      // 5. Check sounds from store
      console.log('Store Sounds:', sounds);
      
      // 6. Test getting a sound URL
      if (sounds.length > 0) {
        try {
          const testUrl = await getSoundUrl(sounds[0].file_path);
          console.log('Test URL for first sound:', testUrl);
        } catch (error) {
          console.error('Error getting test URL:', error);
        }
      }
      
      setDebugInfo({
        user: user?.id || 'No user',
        dbSoundsCount: dbSounds?.length || 0,
        userSoundsCount: user ? (await supabase.from('reminder_sounds').select('*').eq('user_id', user.id)).data?.length || 0 : 0,
        storageFilesCount: storageFiles?.length || 0,
        storeSoundsCount: sounds.length,
        storageError: storageError?.message,
        dbError: dbError?.message
      });
      
      console.log('=== SOUND DEBUG END ===');
    };

    debugSounds();
  }, [sounds, getSoundUrl]);

  const handleRefreshSounds = async () => {
    console.log('Manually refreshing sounds...');
    await fetchSounds();
  };

  const handleTestUpload = async () => {
    // Create a test sound file (silent audio)
    const canvas = document.createElement('canvas');
    canvas.toBlob(async (blob) => {
      if (blob) {
        const testFile = new File([blob], 'test-sound.wav', { type: 'audio/wav' });
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No user');

          const filePath = `${user.id}/test-${Date.now()}.wav`;
          const { error: uploadError } = await supabase.storage
            .from('sounds')
            .upload(filePath, testFile);

          if (uploadError) throw uploadError;

          const { error: dbError } = await supabase
            .from('reminder_sounds')
            .insert([{
              name: 'Test Sound',
              file_path: filePath,
              file_size: testFile.size,
              user_id: user.id,
            }]);

          if (dbError) throw dbError;

          console.log('Test upload successful');
          await fetchSounds();
        } catch (error) {
          console.error('Test upload failed:', error);
        }
      }
    });
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Sound Debug Info</h3>
      
      <div className="space-y-2 text-sm">
        <div><strong>User ID:</strong> {debugInfo.user}</div>
        <div><strong>DB Sounds (total):</strong> {debugInfo.dbSoundsCount}</div>
        <div><strong>User Sounds:</strong> {debugInfo.userSoundsCount}</div>
        <div><strong>Storage Files:</strong> {debugInfo.storageFilesCount}</div>
        <div><strong>Store Sounds:</strong> {debugInfo.storeSoundsCount}</div>
        {debugInfo.storageError && <div className="text-red-600"><strong>Storage Error:</strong> {debugInfo.storageError}</div>}
        {debugInfo.dbError && <div className="text-red-600"><strong>DB Error:</strong> {debugInfo.dbError}</div>}
      </div>

      <div className="mt-4 space-x-2">
        <button 
          onClick={handleRefreshSounds}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Refresh Sounds
        </button>
        <button 
          onClick={handleTestUpload}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm"
        >
          Test Upload
        </button>
      </div>

      {sounds.length > 0 && (
        <div className="mt-4">
          <strong>Current Sounds:</strong>
          <ul className="list-disc pl-5 text-sm">
            {sounds.map(sound => (
              <li key={sound.id}>
                {sound.name} - {sound.file_path} (Size: {sound.file_size})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SoundDebugComponent;