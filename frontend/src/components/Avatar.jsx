const Avatar = ({ user, size = 'md', className = '' }) => {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base' };
  const name = user?.name || user?.fullName || user?.username || 'User';
  const initials = name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 ${sizes[size] || sizes.md} ${className}`} aria-label={name}>
      <div className="flex h-full w-full items-center justify-center font-semibold text-white">{initials}</div>
      {user?.profilePicture && (
        <img
          src={user.profilePicture}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => { event.currentTarget.style.display = 'none'; }}
        />
      )}
    </div>
  );
};

export default Avatar;
