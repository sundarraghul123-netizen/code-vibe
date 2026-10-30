import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, HeartIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline';
import { storyAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const StoryViewer = () => {
  const [searchParams] = useSearchParams();
  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const navigate = useNavigate();
  const { viewStory } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    if (stories.length > 0) {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            nextStory();
            return 0;
          }
          return prev + 2;
        });
      }, 100);

      return () => clearInterval(timer);
    }
  }, [stories, currentIndex]);

  const fetchStories = async () => {
    try {
      const response = await storyAPI.getStories();
      const allStories = response.data.stories.flatMap((group) => group.stories);
      setStories(allStories);
      
      const userId = searchParams.get('user');
      if (userId) {
        const index = allStories.findIndex((s) => s.user._id === userId);
        if (index !== -1) {
          setCurrentIndex(index);
        }
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      navigate('/');
    }
  };

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleView = () => {
    const story = stories[currentIndex];
    if (story && !story.hasViewed) {
      viewStory(story._id, story.user._id);
      storyAPI.viewStory(story._id);
    }
  };

  const handleLike = async () => {
    if (isLiking) return; // Prevent double-click
    
    const story = stories[currentIndex];
    if (!story) return;
    
    setIsLiking(true);
    try {
      const response = await storyAPI.likeStory(story._id);
      setIsLiked(response.data.isLiked);
      setLikeCount(response.data.likeCount);
      
      // Update the story in the array
      const updatedStories = [...stories];
      updatedStories[currentIndex].likes = response.data.isLiked 
        ? [...(updatedStories[currentIndex].likes || []), user.id]
        : updatedStories[currentIndex].likes?.filter(id => id !== user.id) || [];
      updatedStories[currentIndex].likeCount = response.data.likeCount;
      setStories(updatedStories);
    } catch (error) {
      console.error('Error liking story:', error);
    } finally {
      setIsLiking(false);
    }
  };

  useEffect(() => {
    if (stories[currentIndex]) {
      handleView();
      // Check if current user liked this story
      const story = stories[currentIndex];
      setIsLiked(story.likes?.includes(user?.id) || false);
      setLikeCount(story.likeCount || 0);
    }
  }, [currentIndex, stories, user]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="w-full max-w-md mx-auto h-full max-h-[850px] bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="w-full max-w-md mx-auto h-full max-h-[850px] bg-black flex items-center justify-center">
          <p className="text-white">No stories available</p>
        </div>
      </div>
    );
  }

  const currentStory = stories[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      {/* Phone-style Container */}
      <div className="relative w-full max-w-md h-full max-h-[850px] bg-black overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-4 left-4 right-16 flex gap-1 z-20">
          {stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width:
                    index < currentIndex
                      ? '100%'
                      : index === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-16 flex items-center gap-3 z-20">
          <img
            src={currentStory.user.profilePicture}
            alt={currentStory.user.username}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
          />
          <div className="flex flex-col">
            <span className="text-white font-semibold text-sm">
              {currentStory.user.username}
            </span>
            <span className="text-white/60 text-xs">
              {new Date(currentStory.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 z-20 text-white hover:text-gray-300"
        >
          <XMarkIcon className="w-7 h-7" />
        </button>

        {/* Story Content - Vertical */}
        <div className="h-full w-full flex items-center justify-center bg-black">
          {currentStory.type === 'video' ? (
            <video
              src={currentStory.media}
              className="h-full w-full object-cover"
              autoPlay
              playsInline
              onEnded={nextStory}
            />
          ) : (
            <img
              src={currentStory.media}
              alt="Story"
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* Navigation Areas */}
        <button
          onClick={prevStory}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
          disabled={currentIndex === 0}
        />
        <button
          onClick={nextStory}
          className="absolute right-16 top-0 bottom-0 w-1/3 z-10"
        />

        {/* Right Side Actions */}
        <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4 z-20">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className="flex flex-col items-center gap-1"
          >
            {isLiked ? (
              <HeartIcon className="w-8 h-8 text-red-500 fill-red-500" />
            ) : (
              <HeartIconOutline className="w-8 h-8 text-white" />
            )}
            <span className="text-white text-xs font-semibold">{likeCount}</span>
          </button>
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-8 left-4 right-20 text-white z-20">
            <p className="text-sm drop-shadow-lg">{currentStory.caption}</p>
          </div>
        )}

        {/* Story Counter */}
        <div className="absolute bottom-4 left-4 text-white/60 text-xs z-20">
          {currentIndex + 1} / {stories.length}
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;
