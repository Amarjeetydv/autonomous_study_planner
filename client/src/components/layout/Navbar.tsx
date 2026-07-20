import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { 
  User as UserIcon, LogOut, Settings, LayoutDashboard, 
  Sparkles, Calendar, Trophy, ChevronDown, Menu, X, BookOpen,
  Users, BarChart3, LineChart, FolderKanban, MessageSquare, ShieldCheck, Target
} from 'lucide-react';
import { logout } from '../../features/auth/authSlice';
import { RootState, AppDispatch } from '../../app/store';
import { toast } from '../../services/toast';

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const { user } = useSelector((state: RootState) => state.auth);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setDropdownOpen(false);
    setMobileMenuOpen(false);

    try {
      const actionResult = await dispatch(logout());
      queryClient.clear();
      localStorage.removeItem('asp_access_token');

      if (logout.fulfilled.match(actionResult)) {
        toast.success('Logged out successfully.', 'Logout');
      } else {
        toast.info('You have been logged out.', 'Logout');
      }
    } catch (error) {
      queryClient.clear();
      localStorage.removeItem('asp_access_token');
      toast.info('You have been logged out.', 'Logout');
    } finally {
      setIsLoggingOut(false);
      navigate('/login', { replace: true });
    }
  };

  const getUserInitial = () => {
    if (!user?.name) return 'U';
    return user.name.charAt(0).toUpperCase();
  };

  const isMentor = user?.roles?.includes('Mentor');
  const isAdmin = user?.roles?.includes('Admin');

  const getHomePath = () => {
    if (isMentor) return '/mentor/dashboard';
    if (isAdmin) return '/admin/dashboard';
    return '/dashboard';
  };

  const getNavLinks = () => {
    if (isMentor) {
      return [
        { label: 'Dashboard', path: '/mentor/dashboard', icon: LayoutDashboard },
        { label: 'Students', path: '/mentor/students', icon: Users },
        { label: 'Progress', path: '/mentor/progress', icon: BarChart3 },
        { label: 'Analytics', path: '/mentor/analytics', icon: LineChart },
        { label: 'Resources', path: '/mentor/resources', icon: FolderKanban },
        { label: 'Messages', path: '/mentor/messages', icon: MessageSquare },
        { label: 'Settings', path: '/mentor/settings', icon: Settings },
      ];
    }
    if (isAdmin) {
      return [
        { label: 'Admin Panel', path: '/admin/dashboard', icon: ShieldCheck },
        { label: 'Mentor Hub', path: '/mentor/dashboard', icon: Users },
        { label: 'Student View', path: '/dashboard', icon: LayoutDashboard },
      ];
    }
    // Student Links
    return [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'AI Companion', path: '/companion', icon: Sparkles },
      { label: 'Calendar', path: '/calendar', icon: Calendar },
      { label: 'Mastery', path: '/mastery', icon: BookOpen },
      { label: 'Goals', path: '/goals/new', icon: Target },
      { label: 'Analytics', path: '/analytics', icon: LineChart },
      { label: 'Trophies', path: '/trophy', icon: Trophy },
    ];
  };

  const navLinks = getNavLinks();
  const userRoleDisplay = isMentor ? 'Mentor' : isAdmin ? 'Admin' : 'Student';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link to={getHomePath()} className="flex items-center gap-2 text-gradient font-extrabold text-xl tracking-tight">
              <span className="h-9 w-9 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 text-lg">
                🎓
              </span>
              <span>StudyPilot AI</span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive 
                        ? 'bg-slate-900 text-brand-400 border border-slate-800' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action & User Profile Dropdown */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* User Profile Menu Button */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-3 p-1.5 pl-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <div className="text-right leading-tight">
                  <div className="text-xs font-bold text-slate-100 max-w-[120px] truncate">
                    {user?.name || 'User'}
                  </div>
                  <div className="text-[10px] text-slate-400 max-w-[120px] truncate">
                    {userRoleDisplay}
                  </div>
                </div>

                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {getUserInitial()}
                </div>

                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel bg-slate-900/95 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  
                  {/* User Profile Info Header */}
                  <div className="px-3 py-3 border-b border-slate-800/80 mb-1">
                    <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-slate-400 truncate mb-1.5">{user?.email || 'user@example.com'}</p>
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md uppercase tracking-wider border ${
                      isMentor 
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                        : isAdmin
                        ? 'bg-purple-950/80 text-purple-400 border-purple-500/30'
                        : 'bg-brand-500/10 text-brand-400 border-brand-500/20'
                    }`}>
                      {userRoleDisplay}
                    </span>
                  </div>

                  {/* Dropdown Actions */}
                  <div className="space-y-0.5">
                    <Link
                      to={isMentor ? '/mentor/dashboard' : isAdmin ? '/admin/dashboard' : '/dashboard'}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 rounded-xl hover:bg-slate-800/60 hover:text-white transition"
                    >
                      <UserIcon className="h-4 w-4 text-slate-400" />
                      Dashboard Profile
                    </Link>

                    <Link
                      to={isMentor ? '/mentor/settings' : '/dashboard'}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 rounded-xl hover:bg-slate-800/60 hover:text-white transition"
                    >
                      <Settings className="h-4 w-4 text-slate-400" />
                      Settings
                    </Link>
                  </div>

                  {/* Divider */}
                  <div className="my-1.5 border-t border-slate-800/80"></div>

                  {/* Logout Action (Highlighted in Red) */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 rounded-xl hover:bg-red-500/10 hover:text-red-300 transition focus:outline-none"
                  >
                    <LogOut className="h-4 w-4 text-red-400" />
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-4">
          
          {/* Mobile User Details */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {getUserInitial()}
            </div>
            <div className="leading-tight overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">{userRoleDisplay}</p>
            </div>
          </div>

          {/* Mobile Navigation Links */}
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive 
                      ? 'bg-slate-900 text-brand-400 border border-slate-800' 
                      : 'text-slate-300 hover:bg-slate-900/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-slate-800/80 pt-3">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center justify-center gap-2.5 px-4 py-3 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition"
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
