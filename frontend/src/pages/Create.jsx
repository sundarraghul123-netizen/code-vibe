import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhotoIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { postAPI, reelAPI } from '../services/api';

const Create = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setSelectedFile({
        file,
        preview: previewUrl,
        type: file.type.startsWith('video/') ? 'video' : 'image'
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      
      // Route based on file type
      if (selectedFile.type === 'video') {
        await reelAPI.createReel({
          video: selectedFile.file,
          caption
        });
        navigate('/reels');
      } else {
        await postAPI.createPost({
          image: selectedFile.file,
          caption
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Error creating content:', error);
      alert('Failed to create content');
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setCaption('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h1 className="text-lg font-semibold">
            {!selectedFile ? 'Create New Content' : selectedFile.type === 'video' ? 'Create Reel' : 'Create Post'}
          </h1>
          {selectedFile && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="text-primary-500 font-semibold disabled:opacity-50"
            >
              {loading ? 'Sharing...' : 'Share'}
            </button>
          )}
        </div>

        <div className="p-8">
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <PhotoIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-xl mb-2">Select Photo or Video</p>
              <p className="text-gray-500 mb-4">
                Photos will be posted as posts<br/>
                Videos will be posted as reels
              </p>
              <button className="btn-primary">Select from computer</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                {selectedFile.type === 'video' ? (
                  <video
                    src={selectedFile.preview}
                    className="w-full max-h-96 rounded-lg"
                    controls
                  />
                ) : (
                  <img
                    src={selectedFile.preview}
                    alt="Preview"
                    className="w-full max-h-96 object-contain rounded-lg"
                  />
                )}
                <button
                  onClick={clearSelection}
                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                  {selectedFile.type === 'video' ? '🎬 Reel' : '📷 Post'}
                </div>
              </div>
              
              <textarea
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none outline-none dark:bg-gray-800"
                rows={4}
              />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default Create;
