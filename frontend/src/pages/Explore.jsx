import { useState, useEffect } from 'react';
import { postAPI } from '../services/api';

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExplorePosts();
  }, []);

  const fetchExplorePosts = async () => {
    try {
      const response = await postAPI.getExplorePosts();
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Error fetching explore posts:', error);
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
    <div className="max-w-6xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Explore</h1>
      
      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-1 md:gap-4">
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
                <span>likes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{post.commentCount || 0}</span>
                <span>comments</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Explore;
