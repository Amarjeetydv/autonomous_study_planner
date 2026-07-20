interface UserAvatarProps {
  name?: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'idle';
  role?: string;
}

export default function UserAvatar({
  name = 'User',
  avatarUrl,
  size = 'md',
  status,
}: UserAvatarProps) {
  const getInitial = () => name.charAt(0).toUpperCase();

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  }[size];

  const statusColor = {
    online: 'bg-emerald-500',
    offline: 'bg-slate-500',
    idle: 'bg-amber-500',
  };

  return (
    <div className="relative inline-block">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={`${sizeClasses} rounded-xl object-cover border border-slate-800 shadow-md`}
        />
      ) : (
        <div className={`${sizeClasses} rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md border border-slate-800`}>
          {getInitial()}
        </div>
      )}

      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-950 ${statusColor[status]}`}
        />
      )}
    </div>
  );
}
