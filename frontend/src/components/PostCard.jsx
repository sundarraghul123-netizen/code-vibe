import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  PaperAirplaneIcon,
  BookmarkIcon,
  FaceSmileIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from '@heroicons/react/24/solid';
import { postAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PostCard = ({ post }) => {
  const [isLiked, setIsLiked] = useState(post.likes?.includes(useAuth().user?.id));
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [isLiking, setIsLiking] = useState(false);
  const { user } = useAuth();

  const handleLike = async () => {
    if (isLiking) return; // Prevent double-click
    
    setIsLiking(true);
    try {
      const response = await postAPI.likePost(post._id);
      setIsLiked(response.data.isLiked);
      setLikeCount(response.data.likeCount);
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    try {
      await postAPI.savePost(post._id);
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const response = await postAPI.addComment(post._id, commentText);
      setComments([...comments, response.data.comment]);
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link
          to={`/profile/${post.user.username}`}
          className="flex items-center gap-3"
        >
          <img
            src={post.user.profilePicture}
            alt={post.user.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          <span className="font-semibold text-sm">{post.user.username}</span>
        </Link>
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <EllipsisHorizontalIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Image */}
      <div className="relative aspect-square bg-gray-100 dark:bg-gray-900">
        <img
          src={post.image}
          alt="Post"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className="transition-transform active:scale-125"
            >
              {isLiked ? (
                <HeartIconSolid className="w-7 h-7 text-red-500" />
              ) : (
                <HeartIcon className="w-7 h-7" />
              )}
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="transition-transform active:scale-125"
            >
              <ChatBubbleOvalLeftIcon className="w-7 h-7" />
            </button>
            <button className="transition-transform active:scale-125">
              <PaperAirplaneIcon className="w-7 h-7 -rotate-45" />
            </button>
          </div>
          <button
            onClick={handleSave}
            className="transition-transform active:scale-125"
          >
            {isSaved ? (
              <BookmarkIconSolid className="w-7 h-7" />
            ) : (
              <BookmarkIcon className="w-7 h-7" />
            )}
          </button>
        </div>

        {/* Likes */}
        <div className="font-semibold text-sm mb-2">
          {likeCount.toLocaleString()} likes
        </div>

        {/* Caption */}
        <div className="text-sm mb-2">
          <Link
            to={`/profile/${post.user.username}`}
            className="font-semibold mr-2"
          >
            {post.user.username}
          </Link>
          {post.caption}
        </div>

        {/* Comments Count */}
        {comments.length > 0 && (
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-gray-500 dark:text-gray-400 text-sm mb-2"
          >
            View all {comments.length} comments
          </button>
        )}

        {/* Comments */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 overflow-hidden"
            >
              {comments.map((comment) => (
                <div key={comment._id} className="text-sm">
                  <Link
                    to={`/profile/${comment.user.username}`}
                    className="font-semibold mr-2"
                  >
                    {comment.user.username}
                  </Link>
                  {comment.text}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timestamp */}
        <div className="text-gray-500 dark:text-gray-400 text-xs uppercase mt-2">
          {new Date(post.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Add Comment */}
      <form
        onSubmit={handleAddComment}
        className="flex items-center gap-3 p-4 border-t border-gray-200 dark:border-gray-700"
      >
        <FaceSmileIcon className="w-6 h-6 text-gray-400" />
        <input
          type="text"
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm"
        />
        <button
          type="submit"
          disabled={!commentText.trim()}
          className="text-primary-500 font-semibold text-sm disabled:opacity-50"
        >
          Post
        </button>
      </form>
    </div>
  );
};

export default PostCard;
