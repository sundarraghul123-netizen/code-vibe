import { useNotifications } from '../context/NotificationContext';
import { Link } from 'react-router-dom';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/solid';

const Notifications = () => {
  const { notifications, markAsRead, markAllAsRead, loading } = useNotifications();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <HeartIcon className="w-6 h-6 text-red-500" />;
      case 'comment':
        return <ChatBubbleLeftIcon className="w-6 h-6 text-blue-500" />;
      case 'follow':
        return <UserPlusIcon className="w-6 h-6 text-green-500" />;
      case 'message':
        return <EnvelopeIcon className="w-6 h-6 text-purple-500" />;
      default:
        return <HeartIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  const getNotificationText = (notification) => {
    const { sender, type, post, comment } = notification;
    switch (type) {
      case 'like':
        return (
          <span>
            <span className="font-semibold">{sender.username}</span> liked your post
          </span>
        );
      case 'comment':
        return (
          <span>
            <span className="font-semibold">{sender.username}</span> commented: {comment}
          </span>
        );
      case 'follow':
        return (
          <span>
            <span className="font-semibold">{sender.username}</span> started following you
          </span>
        );
      case 'message':
        return (
          <span>
            <span className="font-semibold">{sender.username}</span> sent you a message
          </span>
        );
      default:
        return null;
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
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={markAllAsRead}
            className="text-primary-500 text-sm font-semibold"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((notification) => (
          <Link
            key={notification._id}
            to={
              notification.post
                ? `/post/${notification.post._id}`
                : `/profile/${notification.sender.username}`
            }
            onClick={() => !notification.read && markAsRead(notification._id)}
            className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
              notification.read
                ? 'bg-white dark:bg-gray-800'
                : 'bg-blue-50 dark:bg-blue-900/20'
            }`}
          >
            <div className="relative">
              <img
                src={notification.sender.profilePicture}
                alt={notification.sender.username}
                className="w-11 h-11 rounded-full object-cover"
              />
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5">
                {getNotificationIcon(notification.type)}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm">{getNotificationText(notification)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(notification.createdAt).toLocaleDateString()}
              </p>
            </div>
            {notification.post && (
              <img
                src={notification.post.image}
                alt="Post"
                className="w-11 h-11 object-cover rounded"
              />
            )}
          </Link>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No notifications yet</p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
