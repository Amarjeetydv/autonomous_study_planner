import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, X, Check, CheckSquare, Trash2, 
  Sparkles, Clock, Calendar, CheckCircle2, Loader2 
} from 'lucide-react';
import apiClient from '../../services/api/client';

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  priority: 'Low' | 'Medium' | 'High';
  read: boolean;
  deliveredAt: string;
}

interface NotificationDrawerProps {
  onClose: () => void;
}

export default function NotificationDrawer({ onClose }: NotificationDrawerProps) {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>('All');

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notificationsList'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications');
      return response.data.data.notifications as NotificationItem[];
    }
  });

  // Mark single as read
  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationsList'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
    }
  });

  // Mark all as read
  const readAllMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationsList'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
    }
  });

  // Delete notification
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationsList'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-950/40 text-red-400 border-red-500/20';
      case 'Medium': return 'bg-amber-950/40 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-900 text-slate-500 border-slate-800';
    }
  };

  const getIconForType = (type: string) => {
    if (type.includes('Reminder')) return <Clock className="h-4 w-4 text-brand-400" />;
    if (type.includes('Update')) return <Calendar className="h-4 w-4 text-indigo-400" />;
    if (type.includes('Achievement')) return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    if (type.includes('Recommendation')) return <Sparkles className="h-4 w-4 text-amber-400" />;
    return <Bell className="h-4 w-4 text-slate-400" />;
  };

  const filteredNotifs = notifications?.filter(n => {
    if (filterType === 'All') return true;
    if (filterType === 'AI') return n.type === 'AI Recommendation';
    if (filterType === 'Reminders') return n.type.includes('Reminder');
    return true;
  }) || [];

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-950/95 backdrop-blur-md border-l border-slate-900 shadow-2xl z-50 flex flex-col justify-between">
      {/* Header */}
      <div className="p-5 border-b border-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-brand-400" />
          <h2 className="text-sm font-bold text-white">Alerts & Recommendations</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded bg-slate-900 hover:text-white text-slate-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 py-3 border-b border-slate-900/30 flex gap-2 text-[10px]">
        {['All', 'Reminders', 'AI'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`px-3 py-1 rounded-full border transition ${
              filterType === tab 
                ? 'bg-brand-500/10 text-brand-400 border-brand-500/20 font-bold' 
                : 'bg-slate-900 text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}

        {notifications && notifications.some(n => !n.read) && (
          <button
            onClick={() => readAllMutation.mutate()}
            className="ml-auto flex items-center gap-1 text-slate-400 hover:text-white font-bold"
          >
            <CheckSquare className="h-3 w-3" />
            Mark all read
          </button>
        )}
      </div>

      {/* Content list */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {isLoading ? (
          <div className="h-full flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          </div>
        ) : filteredNotifs.length > 0 ? (
          filteredNotifs.map((notif) => (
            <div 
              key={notif._id}
              className={`p-4 rounded-xl border flex gap-3 relative transition-all ${
                notif.read 
                  ? 'bg-slate-950/20 border-slate-900/60 opacity-60' 
                  : 'bg-slate-900/30 border-slate-900/80 hover:border-slate-800'
              }`}
            >
              {/* Type Icon */}
              <div className="mt-0.5 shrink-0">{getIconForType(notif.type)}</div>

              {/* Text info */}
              <div className="space-y-1 pr-6 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-200 leading-none">{notif.title}</h4>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${getPriorityColor(notif.priority)}`}>
                    {notif.priority}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">{notif.message}</p>
                <span className="text-[9px] text-slate-500 block">
                  {new Date(notif.deliveredAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>

              {/* Actions */}
              <div className="absolute right-2 top-2 flex flex-col gap-1.5">
                {!notif.read && (
                  <button
                    onClick={() => readMutation.mutate(notif._id)}
                    className="p-1 text-slate-500 hover:text-emerald-400 transition"
                    title="Mark as read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => deleteMutation.mutate(notif._id)}
                  className="p-1 text-slate-500 hover:text-red-400 transition"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col justify-center items-center text-slate-600 text-center py-20">
            <Bell className="h-10 w-10 text-slate-700 mb-2" />
            <h4 className="text-slate-400 font-bold text-xs">No alerts matching filter.</h4>
            <p className="text-[10px] text-slate-500 mt-1">Consistency keeps notifications clear.</p>
          </div>
        )}
      </div>
    </div>
  );
}
