import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { storyAPI } from '../services/api';

const CreateStory = () => {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const mediaUrl = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video');
      setSelectedMedia({
        file,
        preview: mediaUrl,
        type: isVideo ? 'video' : 'image',
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedMedia) return;

    try {
      setLoading(true);
      await storyAPI.createStory({
        media: selectedMedia.file,
        type: selectedMedia.type,
        caption,
      });
      navigate('/');
    } catch (error) {
      console.error('Error creating story:', error);
      alert('Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Add to Story</h1>
          {selectedMedia && (
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
          {!selectedMedia ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <PhotoIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-xl mb-2">Select photo or video</p>
              <p className="text-gray-500 mb-4">Share a moment with your followers</p>
              <button className="btn-primary">Select from computer</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                {selectedMedia.type === 'video' ? (
                  <video
                    src={selectedMedia.preview}
                    className="w-full max-h-96 rounded-lg"
                    controls
                  />
                ) : (
                  <img
                    src={selectedMedia.preview}
                    alt="Preview"
                    className="w-full max-h-96 object-contain rounded-lg"
                  />
                )}
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <textarea
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none outline-none dark:bg-gray-800"
                rows={2}
                maxLength={100}
              />
              <p className="text-xs text-gray-500">{caption.length}/100</p>
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
      </motion.div>
    </div>
  );
};

export default CreateStory;
