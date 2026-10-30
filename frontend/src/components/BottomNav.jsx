import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PlayIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  PlayIcon as PlayIconSolid,
  UserCircleIcon as UserCircleIconSolid,
} from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
  const { user } = useAuth();

  const navItems = [
    { path: '/', icon: HomeIcon, activeIcon: HomeIconSolid },
    { path: '/explore', icon: MagnifyingGlassIcon, activeIcon: MagnifyingGlassIconSolid },
    { path: '/create', icon: PlusIcon, activeIcon: PlusIcon },
    { path: '/reels', icon: PlayIcon, activeIcon: PlayIconSolid },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="p-2"
          >
            {({ isActive }) =>
              isActive ? (
                <item.activeIcon className="w-7 h-7" />
              ) : (
                <item.icon className="w-7 h-7" />
              )
            }
          </NavLink>
        ))}
        
        {/* Profile */}
        <NavLink
          to={`/profile/${user?.username}`}
          className="p-2"
        >
          {({ isActive }) =>
            isActive ? (
              <img
                src={user?.profilePicture}
                alt={user?.username}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-black dark:ring-white"
              />
            ) : (
              <img
                src={user?.profilePicture}
                alt={user?.username}
                className="w-7 h-7 rounded-full object-cover"
              />
            )
          }
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
