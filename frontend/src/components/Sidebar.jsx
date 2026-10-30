import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon,
  PlayIcon,
  PaperAirplaneIcon,
  HeartIcon,
  PlusIcon,
  Bars3Icon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  GlobeAltIcon as GlobeAltIconSolid,
  PlayIcon as PlayIconSolid,
  PaperAirplaneIcon as PaperAirplaneIconSolid,
  HeartIcon as HeartIconSolid,
} from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useMessages } from '../context/MessageContext';
import Avatar from './Avatar';

const Sidebar = () => {
  const [showMore, setShowMore] = useState(false);
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { unreadCount: notificationUnreadCount } = useNotifications();
  const { unreadCount: messageUnreadCount } = useMessages();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: HomeIcon, activeIcon: HomeIconSolid, label: 'Home' },
    { path: '/search', icon: MagnifyingGlassIcon, activeIcon: MagnifyingGlassIconSolid, label: 'Search' },
    { path: '/explore', icon: GlobeAltIcon, activeIcon: GlobeAltIconSolid, label: 'Explore' },
    { path: '/reels', icon: PlayIcon, activeIcon: PlayIconSolid, label: 'Reels' },
    { path: '/messages', icon: PaperAirplaneIcon, activeIcon: PaperAirplaneIconSolid, label: 'Messages', badge: messageUnreadCount },
    { path: '/notifications', icon: HeartIcon, activeIcon: HeartIconSolid, label: 'Notifications', badge: notificationUnreadCount },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col z-50">
        {/* Logo */}
        <div className="p-6">
          <NavLink to="/" className="text-2xl font-bold bg-gradient-to-r from-instagram-start via-instagram-middle to-instagram-purple bg-clip-text text-transparent">
            Code Vibe
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'font-semibold'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    {isActive ? (
                      <item.activeIcon className="w-7 h-7" />
                    ) : (
                      <item.icon className="w-7 h-7" />
                    )}
                    {item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-base">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Create */}
          <NavLink
            to="/create"
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'font-semibold'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
          >
            <PlusIcon className="w-7 h-7" />
            <span className="text-base">Create</span>
          </NavLink>

          {/* Profile */}
          <NavLink
            to={`/profile/${user?.username}`}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'font-semibold'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
          >
            <Avatar user={user} size="sm" />
            <span className="text-base">Profile</span>
          </NavLink>
        </nav>

        {/* More Menu */}
        <div className="p-3 relative">
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 w-full transition-colors"
          >
            <Bars3Icon className="w-7 h-7" />
            <span className="text-base">More</span>
          </button>

          <AnimatePresence>
            {showMore && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-3 right-3 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 w-full transition-colors"
                >
                  {darkMode ? (
                    <>
                      <SunIcon className="w-5 h-5" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <MoonIcon className="w-5 h-5" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 w-full transition-colors text-red-500"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span>Log Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
