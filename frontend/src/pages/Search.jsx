import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { searchAPI } from '../services/api';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });

  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults({ users: [], posts: [] });
      return;
    }

    try {
      setLoading(true);
      const [usersRes, postsRes] = await Promise.all([
        searchAPI.searchUsers(searchQuery),
        searchAPI.searchPosts(searchQuery),
      ]);
      setResults({
        users: usersRes.data.users,
        posts: postsRes.data.posts,
      });
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  const addToRecentSearches = (item) => {
    const newSearches = [item, ...recentSearches.filter((s) => s.id !== item.id)].slice(0, 10);
    setRecentSearches(newSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newSearches));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Search Input */}
      <div className="relative mb-6">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-10 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Results */}
      {query ? (
        <div className="space-y-6">
          {/* Users */}
          {results.users.length > 0 && (
            <div>
              <h2 className="font-semibold mb-4">Accounts</h2>
              <div className="space-y-3">
                {results.users.map((user) => (
                  <Link
                    key={user._id}
                    to={`/profile/${user.username}`}
                    onClick={() => addToRecentSearches({ type: 'user', ...user })}
                    className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <img
                      src={user.profilePicture}
                      alt={user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold">{user.username}</p>
                      {user.name && <p className="text-gray-500 text-sm">{user.name}</p>}
                      <p className="text-gray-400 text-xs">{user.bio?.substring(0, 50)}{user.bio?.length > 50 ? '...' : ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Posts */}
          {results.posts.length > 0 && (
            <div>
              <h2 className="font-semibold mb-4">Posts</h2>
              <div className="grid grid-cols-3 gap-1">
                {results.posts.map((post) => (
                  <Link
                    key={post._id}
                    to={`/post/${post._id}`}
                    className="aspect-square"
                  >
                    <img
                      src={post.image}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          )}
        </div>
      ) : (
        /* Recent Searches */
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent</h2>
            {recentSearches.length > 0 && (
              <button
                onClick={clearRecentSearches}
                className="text-primary-500 text-sm font-semibold"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="space-y-3">
            {recentSearches.map((item) => (
              <Link
                key={item._id}
                to={`/profile/${item.username}`}
                className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <img
                  src={item.profilePicture}
                  alt={item.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold">{item.username}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setRecentSearches(recentSearches.filter((s) => s._id !== item._id));
                  }}
                >
                  <XMarkIcon className="w-5 h-5 text-gray-400" />
                </button>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
