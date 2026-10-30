import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Cog6ToothIcon, Squares2X2Icon, BookmarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { userAPI, chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profileRes = await userAPI.getProfile(username);
      setProfile(profileRes.data.user);
      
      const postsRes = await userAPI.getUserPosts(profileRes.data.user.id);
      setPosts(postsRes.data.posts);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const response = await userAPI.followUser(profile.id);
      setProfile({
        ...profile,
        isFollowing: !profile.isFollowing,
        canChat: response.data.canChat,
        followerCount: profile.isFollowing
          ? profile.followerCount - 1
          : profile.followerCount + 1,
      });
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleMessage = async () => {
    try {
      // Check if conversation exists
      const conversationsRes = await chatAPI.getConversations();
      const existingConversation = conversationsRes.data.conversations.find(
        c => c.participants.some(p => p._id === profile.id)
      );
      
      if (existingConversation) {
        navigate(`/messages/${existingConversation._id}`);
      } else {
        // Create new conversation
        const newConvRes = await chatAPI.createConversation(profile.id);
        navigate(`/messages/${newConvRes.data.conversation._id}`);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>User not found</p>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
        {/* Avatar */}
        <div className="w-24 h-24 md:w-36 md:h-36">
          <img
            src={profile.profilePicture}
            alt={profile.username}
            className="w-full h-full rounded-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <h1 className="text-2xl font-light">{profile.username}</h1>
            {isOwnProfile ? (
              <div className="flex gap-2">
                <Link
                  to="/edit-profile"
                  className="btn-secondary text-sm px-4 py-1.5"
                >
                  Edit profile
                </Link>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <Cog6ToothIcon className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleFollow}
                  className={`btn-primary text-sm px-6 py-1.5 ${
                    profile.isFollowing ? 'bg-gray-200 text-black hover:bg-gray-300' : ''
                  }`}
                >
                  {profile.isFollowing ? 'Following' : 'Follow'}
                </button>
                {profile.canChat && (
                  <button
                    onClick={handleMessage}
                    className="btn-secondary text-sm px-6 py-1.5"
                  >
                    Message
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-center md:justify-start gap-8 mb-4">
            <div>
              <span className="font-semibold">{profile.postCount || 0}</span>{' '}
              <span className="text-gray-600 dark:text-gray-400">posts</span>
            </div>
            <div>
              <span className="font-semibold">{profile.followerCount || 0}</span>{' '}
              <span className="text-gray-600 dark:text-gray-400">followers</span>
            </div>
            <div>
              <span className="font-semibold">{profile.followingCount || 0}</span>{' '}
              <span className="text-gray-600 dark:text-gray-400">following</span>
            </div>
          </div>

          {/* Bio */}
          <div>
            <p className="font-semibold">{profile.name || profile.username}</p>
            <p className="text-gray-600 dark:text-gray-400">{profile.bio}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-center gap-8">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 py-4 text-xs font-semibold uppercase tracking-wider border-t-2 transition-colors ${
              activeTab === 'posts'
                ? 'border-black dark:border-white'
                : 'border-transparent text-gray-500'
            }`}
          >
            <Squares2X2Icon className="w-4 h-4" />
            Posts
          </button>
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 py-4 text-xs font-semibold uppercase tracking-wider border-t-2 transition-colors ${
                activeTab === 'saved'
                  ? 'border-black dark:border-white'
                  : 'border-transparent text-gray-500'
              }`}
            >
              <BookmarkIcon className="w-4 h-4" />
              Saved
            </button>
          )}
          <button
            onClick={() => setActiveTab('tagged')}
            className={`flex items-center gap-2 py-4 text-xs font-semibold uppercase tracking-wider border-t-2 transition-colors ${
              activeTab === 'tagged'
                ? 'border-black dark:border-white'
                : 'border-transparent text-gray-500'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Tagged
          </button>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-1 md:gap-4 py-4">
        {posts.map((post) => (
          <a
            key={post._id}
            href={`/post/${post._id}`}
            className="aspect-square relative group overflow-hidden"
          >
            <img
              src={post.image}
              alt="Post"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{post.likeCount || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{post.commentCount || 0}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Profile;
