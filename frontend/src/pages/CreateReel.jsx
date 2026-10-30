import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { reelAPI } from '../services/api';

const CreateReel = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const videoUrl = URL.createObjectURL(file);
      setSelectedVideo({
        file,
        preview: videoUrl,
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedVideo) return;

    try {
      setLoading(true);
      await reelAPI.createReel({
        video: selectedVideo.file,
        caption,
      });
      navigate('/reels');
    } catch (error) {
      console.error('Error creating reel:', error);
      alert('Failed to create reel');
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
          <h1 className="text-lg font-semibold">Create New Reel</h1>
          {selectedVideo && (
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
          {!selectedVideo ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <VideoCameraIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-xl mb-2">Select video</p>
              <p className="text-gray-500 mb-4">Upload a short video for your reel</p>
              <button className="btn-primary">Select from computer</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <video
                  src={selectedVideo.preview}
                  className="w-full max-h-96 rounded-lg"
                  controls
                />
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
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
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default CreateReel;
