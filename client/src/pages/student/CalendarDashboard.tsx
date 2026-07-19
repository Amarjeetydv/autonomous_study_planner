import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, ArrowLeft, ChevronLeft, ChevronRight, Plus, 
  RefreshCw, CheckCircle, X, Loader2 
} from 'lucide-react';
import apiClient from '../../services/api/client';
import { CalendarSkeleton } from '../../components/ui/Skeleton';
import { toast } from '../../services/toast';

interface Recurrence {
  frequency?: string;
  interval?: number;
  until?: string;
}

interface CalendarEvent {
  _id: string;
  eventType: 'studyBlock' | 'deadline' | 'mentorSession' | 'quiz' | 'reminder' | 'custom';
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'moved';
  sourceType?: 'plan' | 'task' | 'quiz' | 'mentor' | 'custom';
  recurrence?: Recurrence;
}

export default function CalendarDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showSyncToast, setShowSyncToast] = useState<boolean>(false);
  
  // Custom event inputs
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventDesc, setEventDesc] = useState<string>('');
  const [eventType, setEventType] = useState<string>('custom');
  const [eventStart, setEventStart] = useState<string>('');
  const [eventEnd, setEventEnd] = useState<string>('');

  // Fetch events
  const { data: events, isLoading } = useQuery({
    queryKey: ['calendarEventsList'],
    queryFn: async () => {
      const response = await apiClient.get('/calendar');
      return response.data.data.events as CalendarEvent[];
    },
    staleTime: 1000 * 60 * 3,
  });

  // Create custom event mutation
  const createMutation = useMutation({
    mutationFn: async (payload: Partial<CalendarEvent>) => {
      const response = await apiClient.post('/calendar', payload);
      return response.data.data.event;
    },
    onSuccess: () => {
      setShowAddModal(false);
      setEventTitle('');
      setEventDesc('');
      setEventType('custom');
      setEventStart('');
      setEventEnd('');
      toast.success('Calendar event added successfully!');
      queryClient.invalidateQueries({ queryKey: ['calendarEventsList'] });
    }
  });

  // Google sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/calendar/sync/google');
      return response.data.data.syncResults;
    },
    onSuccess: () => {
      toast.success('Calendar synchronized with Google Calendar!', '🗓️ Sync Completed');
      setShowSyncToast(true);
      setTimeout(() => setShowSyncToast(false), 4000);
    }
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay(); // 0 is Sunday, 6 is Saturday
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDay = (day: number) => {
    if (!events) return [];
    return events.filter(event => {
      const start = new Date(event.startDateTime);
      return (
        start.getDate() === day &&
        start.getMonth() === currentDate.getMonth() &&
        start.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventStart || !eventEnd) return;
    createMutation.mutate({
      title: eventTitle,
      description: eventDesc,
      eventType: eventType as any,
      startDateTime: new Date(eventStart).toISOString(),
      endDateTime: new Date(eventEnd).toISOString(),
    });
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case 'studyBlock': return 'bg-indigo-950/60 text-indigo-400 border-indigo-500/20';
      case 'quiz': return 'bg-red-950/60 text-red-400 border-red-500/20';
      case 'deadline': return 'bg-amber-950/60 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayIndex = getFirstDayOfMonth(currentDate);
  const calendarCells = Array.from({ length: 42 }, (_, idx) => {
    const dayNumber = idx - firstDayIndex + 1;
    const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;
    return { dayNumber, isValidDay };
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Lights */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 z-10 relative">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-3 rounded-xl border border-slate-900 bg-slate-900/40 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-brand-400" />
                Task Calendar Planner
              </h1>
              <p className="text-slate-400 text-xs mt-1">Study blocks, exam deadlines, and quiz assessment times.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-slate-800 transition"
            >
              {syncMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Sync GCal
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 bg-brand-500 text-white rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-brand-600 transition"
            >
              <Plus className="h-4 w-4" />
              Add Custom Block
            </button>
          </div>
        </div>

        {/* Calendar Nav Controls */}
        <div className="flex justify-between items-center bg-slate-900/20 p-4 rounded-2xl border border-slate-900">
          <h2 className="text-base font-extrabold text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded-lg border border-slate-850 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-lg border border-slate-850 text-xs font-semibold transition"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded-lg border border-slate-850 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-400 pl-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
            <span>Study Block</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            <span>Diagnostic Quiz</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            <span>Deadline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-400"></span>
            <span>Custom Block</span>
          </div>
        </div>

        {/* Grid Cells */}
        {isLoading ? (
          <CalendarSkeleton />
        ) : (
          <div className="grid grid-cols-7 gap-px bg-slate-900 border border-slate-900 rounded-2xl overflow-hidden">
            {/* Week Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-slate-950 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarCells.map((cell, idx) => {
              const dayEvents = cell.isValidDay ? getEventsForDay(cell.dayNumber) : [];
              const isToday = 
                cell.isValidDay && 
                cell.dayNumber === new Date().getDate() && 
                currentDate.getMonth() === new Date().getMonth() && 
                currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div 
                  key={idx} 
                  className={`bg-slate-950/60 min-h-[100px] p-2 flex flex-col justify-between border-t border-slate-900 relative ${
                    cell.isValidDay ? 'hover:bg-slate-900/10' : 'opacity-20 pointer-events-none'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-xs font-bold ${
                      isToday 
                        ? 'bg-brand-500 text-white h-5 w-5 rounded-full flex items-center justify-center text-[10px]' 
                        : 'text-slate-500'
                    }`}>
                      {cell.isValidDay ? cell.dayNumber : ''}
                    </span>
                  </div>

                  {/* Day Events stack */}
                  <div className="space-y-1 mt-2 flex-1">
                    {dayEvents.map(event => (
                      <div 
                        key={event._id}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold truncate border ${getEventBadgeColor(event.eventType)}`}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Sync Success Toast */}
      {showSyncToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-emerald-500/20 text-slate-100 p-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-bounce">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-white">Google Calendar Synced</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Schedules mirrored. Synced primary events logs.</p>
          </div>
        </div>
      )}

      {/* Add Custom Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-800 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h3 className="text-base font-bold text-white">Add Custom study block</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded bg-slate-900 hover:text-white text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Study companion revision hour"
                  className="block w-full rounded-lg border border-slate-850 bg-slate-950/60 py-2 px-3 text-xs text-slate-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Description</label>
                <textarea
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Outline key study targets..."
                  className="block w-full rounded-lg border border-slate-850 bg-slate-950/60 py-2 px-3 text-xs text-slate-300 outline-none h-16"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="block w-full rounded-lg border border-slate-850 bg-slate-950/60 py-2 px-3 text-xs text-slate-300 outline-none"
                  >
                    <option value="custom">Custom study</option>
                    <option value="studyBlock">Revision Block</option>
                    <option value="deadline">Exam Deadline</option>
                    <option value="mentorSession">Mentor review</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    className="block w-full rounded-lg border border-slate-850 bg-slate-950/60 py-2 px-3 text-xs text-slate-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    className="block w-full rounded-lg border border-slate-850 bg-slate-950/60 py-2 px-3 text-xs text-slate-300 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full bg-brand-500 text-white rounded-xl py-3 text-xs font-bold hover:bg-brand-600 transition disabled:opacity-50"
              >
                {createMutation.isPending ? 'Logging event...' : 'Save study block'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
