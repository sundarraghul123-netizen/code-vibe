import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { postAPI, storyAPI } from '../services/api';
import PostCard from '../components/PostCard';
import StoryCircle from '../components/StoryCircle';
import SuggestedUsers from '../components/SuggestedUsers';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async (pageNum = 1) => {
    try {
      const response = await postAPI.getFeedPosts(pageNum);
      if (pageNum === 1) {
        setPosts(response.data.posts);
      } else {
        setPosts((prev) => [...prev, ...response.data.posts]);
      }
      setHasMore(response.data.posts.length === 10);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }, []);

  const fetchStories = useCallback(async () => {
    try {
      const response = await storyAPI.getStories();
      setStories(response.data.stories);
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPosts(1), fetchStories()]);
      setLoading(false);
    };
    loadData();
  }, [fetchPosts, fetchStories]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,640px)_320px] lg:justify-center lg:gap-12">
        {/* Main Feed */}
        <div className="lg:col-span-2">
          {/* Stories */}
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex gap-4 overflow-x-auto no-scrollbar">
              {/* Add Story Button */}
              <StoryCircle isAddStory />
              
              {/* User Stories */}
              {stories.map((storyGroup) => (
                <StoryCircle
                  key={storyGroup.user._id}
                  user={storyGroup.user}
                  stories={storyGroup.stories}
                  hasUnviewed={storyGroup.hasUnviewed}
                />
              ))}
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-6">
            {posts.map((post, index) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PostCard post={post} />
              </motion.div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center py-8">
              <button
                onClick={loadMore}
                className="btn-secondary"
              >
                Load More
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-8">
            <SuggestedUsers />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
