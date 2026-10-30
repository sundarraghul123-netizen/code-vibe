import { useState, useEffect } from 'react';
import { reelAPI } from '../services/api';

const Reels = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      const response = await reelAPI.getReels();
      setReels(response.data.reels);
    } catch (error) {
      console.error('Error fetching reels:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-4">
      <h1 className="text-2xl font-bold mb-6 px-4">Reels</h1>
      
      <div className="space-y-4">
        {reels.map((reel) => (
          <div
            key={reel._id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <video
              src={reel.video}
              className="w-full aspect-[9/16] object-cover"
              controls
              poster={reel.thumbnail}
            />
            <div className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={reel.user.profilePicture}
                  alt={reel.user.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="font-semibold text-sm">{reel.user.username}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{reel.caption}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reels;
