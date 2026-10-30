import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

const SuggestedUsers = () => {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        const response = await userAPI.getSuggestedUsers();
        setSuggestedUsers(response.data.users.slice(0, 5));
      } catch (error) {
        console.error('Error fetching suggested users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestedUsers();
  }, []);

  const handleFollow = async (userId) => {
    try {
      await userAPI.followUser(userId);
      setSuggestedUsers((current) => current.filter((item) => item._id !== userId));
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-6 rounded-2xl border border-gray-200/80 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-gray-700/80 dark:bg-gray-800/80">
      <div className="flex items-center justify-between gap-3">
        <Link to={`/profile/${user?.username}`} className="flex min-w-0 items-center gap-3">
          <Avatar user={user} size="lg" />
          <div className="min-w-0">
            <div className="text-sm font-semibold">{user?.username}</div>
            <div className="truncate text-sm text-gray-500 dark:text-gray-400">
              {user?.name || user?.fullName || user?.username}
            </div>
          </div>
        </Link>
        <Link to="/edit-profile" className="text-xs font-semibold text-primary-500 hover:text-primary-600">
          Edit
        </Link>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-5 dark:border-gray-700">
        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Suggested for you</span>
        <Link to="/explore" className="text-xs font-semibold hover:text-gray-600 dark:hover:text-gray-300">See All</Link>
      </div>

      <div className="space-y-4">
        {suggestedUsers.map((suggestedUser) => (
          <div key={suggestedUser._id} className="flex items-center justify-between gap-3">
            <Link to={`/profile/${suggestedUser.username}`} className="flex min-w-0 items-center gap-3">
              <Avatar user={suggestedUser} size="md" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{suggestedUser.username}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {suggestedUser.followers?.length || 0} followers
                </div>
              </div>
            </Link>
            <button onClick={() => handleFollow(suggestedUser._id)} className="text-xs font-semibold text-primary-500 hover:text-primary-600">
              Follow
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-5 text-xs leading-5 text-gray-400 dark:border-gray-700 dark:text-gray-500">
        <p>About · Help · Press · API · Jobs · Privacy · Terms · Locations · Language</p>
        <p className="mt-3">© 2024 Code Vibe</p>
      </div>
    </div>
  );
};

export default SuggestedUsers;
