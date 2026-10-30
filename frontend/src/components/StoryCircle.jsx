import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/solid';

const StoryCircle = ({ user, stories, hasUnviewed, isAddStory }) => {
  const [imageError, setImageError] = useState(false);

  if (isAddStory) {
    return (
      <Link
        to="/create-story"
        className="flex flex-col items-center gap-1 min-w-[72px]"
      >
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
          <PlusIcon className="w-8 h-8 text-gray-400" />
        </div>
        <span className="text-xs truncate max-w-[72px]">Your story</span>
      </Link>
    );
  }

  const ringColor = hasUnviewed
    ? 'bg-gradient-to-tr from-instagram-start via-instagram-middle to-instagram-purple'
    : 'bg-gray-200 dark:bg-gray-700';

  return (
    <Link
      to={`/stories?user=${user._id}`}
      className="flex flex-col items-center gap-1 min-w-[72px]"
    >
      <div className={`p-[2px] rounded-full ${ringColor}`}>
        <div className="p-[2px] bg-white dark:bg-gray-800 rounded-full">
          <img
            src={imageError ? '/default-avatar.png' : user.profilePicture}
            alt={user.username}
            onError={() => setImageError(true)}
            className="w-14 h-14 rounded-full object-cover"
          />
        </div>
      </div>
      <span className="text-xs truncate max-w-[72px]">{user.username}</span>
    </Link>
  );
};

export default StoryCircle;
