import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, CheckCircle, Flame, Target, Check, Play, SkipForward, AlertCircle,
  Plus, Eye, Loader2, Sparkles, Bell, Users
} from 'lucide-react';
import apiClient from '../../services/api/client';
import { toast } from '../../services/toast';
import DailyCheckInModal from '../../components/student/DailyCheckInModal';
import NotificationDrawer from '../../components/student/NotificationDrawer';

interface Task {
  _id: string;
  title: string;
  description: string;
  taskType: 'Study' | 'Revision' | 'Mock Test' | 'Practice';
  scheduledDate: string;
  estimatedDuration: number;
  actualStudyTime: number;
  priority: 'Low' | 'Medium' | 'High';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Mixed';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Missed' | 'Skipped';
  notes: string;
  subjectId?: {
    name: string;
    code: string;
    color: string;
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNotesModal, setShowNotesModal] = useState<boolean>(false);
  const [noteText, setNoteText] = useState<string>('');
  const [actualMinutes, setActualMinutes] = useState<number>(45);
  const [showCheckInModal, setShowCheckInModal] = useState<boolean>(false);
  const [selectedSubjectForQuiz, setSelectedSubjectForQuiz] = useState<string>('');
  const [showNotificationDrawer, setShowNotificationDrawer] = useState<boolean>(false);
  const [mentorInputId, setMentorInputId] = useState<string>('');

  // Fetch active study goal
  const { data: goalData } = useQuery({
    queryKey: ['activeGoal'],
    queryFn: async () => {
      const response = await apiClient.get('/goals?status=active&limit=1');
      return response.data.data.items?.[0] || null;
    },
    staleTime: 1000 * 60 * 2,
  });

  // Fetch user profile
  const { data: profileData } = useQuery({
    queryKey: ['userProfileDetails'],
    queryFn: async () => {
      const response = await apiClient.get('/auth/me');
      return response.data.data.user;
    },
    staleTime: 1000 * 60 * 5,
  });

  const studentId = profileData?.id || profileData?._id;

  // Fetch mentor feedback list
  const { data: feedbackList } = useQuery({
    queryKey: ['studentMentorFeedbackList', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const response = await apiClient.get(`/mentors/feedback/${studentId}`);
      return response.data.data.feedback;
    },
    enabled: !!studentId,
    staleTime: 1000 * 60 * 2,
  });

  // Connect mentor mutation
  const connectMentorMutation = useMutation({
    mutationFn: async (mentorId: string) => {
      await apiClient.post('/mentors/request', { mentorId });
    },
    onSuccess: () => {
      toast.success('Mentor link request sent successfully!', 'Request Sent');
      setMentorInputId('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to send mentor request', 'Request Failed');
    }
  });

  // Fetch today's study tasks
  const { data: tasksData, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['todayTasks'],
    queryFn: async () => {
      const response = await apiClient.get('/tasks');
      return response.data.data.tasks as Task[];
    }
  });

  // Fetch active reschedule preview
  const { data: previewData } = useQuery({
    queryKey: ['schedulerPreview'],
    queryFn: async () => {
      const response = await apiClient.get('/scheduler/preview');
      return response.data.data.preview;
    }
  });

  // Fetch today's check-in status
  const { data: todayCheckIn } = useQuery({
    queryKey: ['todayCheckIn'],
    queryFn: async () => {
      const response = await apiClient.get('/check-ins/today');
      return response.data.data.checkIn;
    }
  });

  // Fetch streak info
  const { data: streakData } = useQuery({
    queryKey: ['streakData'],
    queryFn: async () => {
      const response = await apiClient.get('/check-ins/streak');
      return response.data.data.streak;
    }
  });

  // Fetch quiz attempts history
  const { data: attemptsData } = useQuery({
    queryKey: ['quizAttemptsData'],
    queryFn: async () => {
      const response = await apiClient.get('/quizzes/attempts/history');
      return response.data.data.attempts;
    }
  });

  // Fetch subjects list for select launcher (Cached for 10 minutes)
  const { data: subjectsList } = useQuery({
    queryKey: ['subjectsListForQuiz'],
    queryFn: async () => {
      const response = await apiClient.get('/subjects?limit=100');
      return response.data.data.items;
    },
    staleTime: 1000 * 60 * 10,
  });

  // Generate quiz mutation
  const generateQuizMutation = useMutation({
    mutationFn: async (payload: { subjectId: string; difficulty: string; count: number }) => {
      const response = await apiClient.post('/quizzes/generate', payload);
      return response.data.data.quiz;
    },
    onSuccess: (data) => {
      navigate(`/quizzes/${data._id}`);
    }
  });

  // Fetch unread count
  const { data: unreadCount } = useQuery({
    queryKey: ['unreadNotificationsCount'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications/unread');
      return response.data.data.notifications.length;
    }
  });

  // Complete task mutation
  const completeMutation = useMutation({
    mutationFn: async ({ taskId, actualStudyTime, notes }: { taskId: string; actualStudyTime: number; notes: string }) => {
      const response = await apiClient.post(`/tasks/${taskId}/complete`, { actualStudyTime, notes });
      return response.data.data.task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
      setShowNotesModal(false);
      setSelectedTask(null);
    }
  });

  // Skip task mutation
  const skipMutation = useMutation({
    mutationFn: async ({ taskId, notes }: { taskId: string; notes: string }) => {
      const response = await apiClient.post(`/tasks/${taskId}/skip`, { notes });
      return response.data.data.task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
      setShowNotesModal(false);
      setSelectedTask(null);
    }
  });

  // Update status (e.g. In Progress)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await apiClient.patch(`/tasks/${taskId}`, { status });
      return response.data.data.task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
    }
  });

  const openActionModal = (task: Task) => {
    setSelectedTask(task);
    setNoteText(task.notes || '');
    setActualMinutes(task.estimatedDuration || 45);
    setShowNotesModal(true);
  };

  const handleActionSubmit = () => {
    if (!selectedTask) return;
    completeMutation.mutate({
      taskId: selectedTask._id,
      actualStudyTime: Number(actualMinutes),
      notes: noteText
    });
  };

  const handleSkipSubmit = () => {
    if (!selectedTask) return;
    skipMutation.mutate({
      taskId: selectedTask._id,
      notes: noteText
    });
  };

  // Group tasks into timeline slots
  const getTimelineSlot = (task: Task) => {
    const desc = (task.description || '').toLowerCase();
    const titleLower = task.title.toLowerCase();

    if (desc.includes('morning') || titleLower.includes('morning')) return 'Morning';
    if (desc.includes('afternoon') || titleLower.includes('afternoon')) return 'Afternoon';
    if (desc.includes('evening') || titleLower.includes('evening')) return 'Evening';
    if (desc.includes('night') || titleLower.includes('night')) return 'Night';

    // Default distribution based on taskType
    if (task.taskType === 'Mock Test') return 'Afternoon';
    if (task.taskType === 'Revision') return 'Evening';
    return 'Morning';
  };

  // Calculate metrics
  const todayTasks = tasksData || [];
  const completedTasks = todayTasks.filter(t => t.status === 'Completed');
  const remainingTasks = todayTasks.filter(t => t.status === 'Pending' || t.status === 'In Progress');
  const totalHoursCompleted = completedTasks.reduce((acc, t) => acc + (t.actualStudyTime || 0), 0) / 60;

  const filteredTasks = todayTasks.filter(task => {
    if (filterStatus === 'All') return true;
    return task.status === filterStatus;
  });

  const timelineSlots = ['Morning', 'Afternoon', 'Evening', 'Night'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Light glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-500/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 z-10 relative">
        {/* Page Title & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-900/60">
          <div>
            <span className="text-[10px] tracking-widest text-brand-400 font-bold uppercase block">Student Workspace</span>
            <h1 className="text-2xl font-extrabold text-white">Dashboard Overview</h1>
          </div>
          <div className="flex items-center gap-3">
            {goalData ? (
              <div className="glass-panel p-2.5 px-4 rounded-xl border border-slate-800 flex items-center gap-3">
                <Target className="h-4 w-4 text-brand-400" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block leading-tight">Active Goal</span>
                  <span className="text-xs font-semibold text-slate-200">{goalData.title}</span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate('/goals/new')}
                className="flex items-center gap-2 bg-brand-500 text-white rounded-xl px-4 py-2.5 text-xs font-semibold hover:bg-brand-600 transition"
              >
                <Plus className="h-4 w-4" />
                Setup Study Goal
              </button>
            )}
            <button
              onClick={() => setShowCheckInModal(true)}
              className="bg-brand-500 text-white rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-brand-600 transition shadow-lg shadow-brand-500/20"
            >
              Daily Check-In
            </button>
            <button
              onClick={() => setShowNotificationDrawer(true)}
              className="relative p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition"
            >
              <Bell className="h-5 w-5" />
              {unreadCount !== undefined && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white font-bold text-[9px] flex items-center justify-center border border-slate-950 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Widgets Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-xl border border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Streak</span>
            <div className="flex items-center gap-2 mt-2">
              <Flame className="h-6 w-6 text-orange-500" />
              <span className="text-2xl font-extrabold text-white">{streakData?.currentStreak || 0} Days</span>
            </div>
            <span className="text-[10px] text-slate-600 mt-1 block">Longest: {streakData?.longestStreak || 0} Days.</span>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Today Completed Hours</span>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="h-6 w-6 text-brand-400" />
              <span className="text-2xl font-extrabold text-white">{totalHoursCompleted.toFixed(1)} hrs</span>
            </div>
            <span className="text-[10px] text-slate-600 mt-1 block">Actual focus logged today.</span>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tasks Completed</span>
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
              <span className="text-2xl font-extrabold text-white">
                {completedTasks.length} / {todayTasks.length}
              </span>
            </div>
            <span className="text-[10px] text-slate-600 mt-1 block">Daily checklist progress.</span>
          </div>

        {/* Daily Check-in Prompt Banner */}
        {!todayCheckIn && (
          <div className="bg-brand-500/10 border border-brand-500/30 p-4 rounded-xl flex items-center justify-between text-sm text-brand-300">
            <div className="flex items-center gap-3">
              <Flame className="h-5 w-5 text-brand-400 shrink-0" />
              <span>Ready to check out for today? Submit your Daily Check-in to get AI learning observations.</span>
            </div>
            <button
              onClick={() => setShowCheckInModal(true)}
              className="bg-brand-500 text-white rounded-lg px-4 py-2 font-bold hover:bg-brand-600 transition shrink-0"
            >
              Complete Check-in
            </button>
          </div>
        )}

          <div className="glass-panel p-5 rounded-xl border border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Remaining Tasks</span>
            <div className="flex items-center gap-2 mt-2">
              <Eye className="h-6 w-6 text-slate-400" />
              <span className="text-2xl font-extrabold text-white">{remainingTasks.length} Tasks</span>
            </div>
            <span className="text-[10px] text-slate-600 mt-1 block">To be completed.</span>
          </div>
        </div>

        {/* Reschedule Preview Banner */}
        {previewData?.changes?.length > 0 && (
          <div className="bg-brand-500/10 border border-brand-500/30 p-4 rounded-xl flex items-center justify-between text-sm text-brand-300">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-brand-400 shrink-0" />
              <span>We generated a rescheduled workload layout to balance your missed tasks. Review changes now!</span>
            </div>
            <button
              onClick={() => navigate('/scheduler/preview')}
              className="bg-brand-500 text-white rounded-lg px-4 py-2 font-bold hover:bg-brand-600 transition shrink-0"
            >
              Review Proposed Shifts
            </button>
          </div>
        )}

        {/* Dashboard Content split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Tasks List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-900 pb-4">
              <h2 className="text-lg font-bold text-white">Daily Study Checklist</h2>
              
              {/* Filter controls */}
              <div className="flex gap-1">
                {['All', 'Pending', 'In Progress', 'Completed', 'Skipped'].map((statusOption) => (
                  <button
                    key={statusOption}
                    onClick={() => setFilterStatus(statusOption)}
                    className={`text-[10px] px-2.5 py-1 rounded font-bold border transition ${
                      filterStatus === statusOption 
                        ? 'bg-brand-500/20 text-brand-400 border-brand-500/30' 
                        : 'bg-slate-900/50 text-slate-500 border-slate-900 hover:border-slate-800'
                    }`}
                  >
                    {statusOption}
                  </button>
                ))}
              </div>
            </div>

            {isLoadingTasks ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
              </div>
            ) : filteredTasks.length > 0 ? (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <div 
                    key={task._id}
                    className={`p-5 rounded-xl border transition-all ${
                      task.status === 'Completed' ? 'bg-slate-950/40 border-slate-900/60 opacity-60' :
                      task.status === 'In Progress' ? 'bg-slate-900/60 border-brand-500/30' :
                      'bg-slate-900/20 border-slate-900 hover:border-slate-800/80'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span 
                          className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-900"
                          style={{ color: task.subjectId?.color }}
                        >
                          {task.subjectId?.name || 'General Study'}
                        </span>
                        <h3 className="font-bold text-white mt-1">{task.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                          task.priority === 'High' ? 'bg-red-950/40 text-red-400 border border-red-500/20' :
                          task.priority === 'Medium' ? 'bg-amber-950/40 text-amber-400 border border-amber-500/20' :
                          'bg-slate-900 text-slate-400'
                        }`}>
                          {task.priority} Priority
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">{task.estimatedDuration} mins</span>
                      </div>
                    </div>

                    {/* Footer Task Actions */}
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-900/60">
                      <div className="flex gap-1.5">
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${
                          task.status === 'Completed' ? 'text-emerald-400' :
                          task.status === 'In Progress' ? 'text-brand-400 animate-pulse' :
                          task.status === 'Skipped' ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {task.status}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {task.status !== 'Completed' && task.status !== 'Skipped' && (
                          <>
                            {task.status !== 'In Progress' && (
                              <button
                                onClick={() => updateStatusMutation.mutate({ taskId: task._id, status: 'In Progress' })}
                                className="flex items-center gap-1 bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-slate-800 transition"
                              >
                                <Play className="h-3.5 w-3.5" />
                                Start
                              </button>
                            )}
                            <button
                              onClick={() => openActionModal(task)}
                              className="flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-emerald-900/40 transition"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Done
                            </button>
                            <button
                              onClick={() => openActionModal(task)}
                              className="flex items-center gap-1 bg-slate-900 text-slate-500 border border-slate-900 rounded-lg px-3 py-1.5 text-xs font-semibold hover:text-slate-400 hover:border-slate-800 transition"
                            >
                              <SkipForward className="h-3.5 w-3.5" />
                              Skip
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-900/10 rounded-xl border border-slate-900">
                <AlertCircle className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <h4 className="text-slate-400 font-bold">No tasks matching filter.</h4>
                <p className="text-xs text-slate-500 mt-1">Settle your priorities or review goals.</p>
              </div>
            )}
          </div>

          {/* Sidebar Timeline View */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white border-b border-slate-900 pb-4">Schedule Timeline</h2>
            
            <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-900">
              {timelineSlots.map((slot) => {
                const slotTasks = todayTasks.filter(t => getTimelineSlot(t) === slot);

                return (
                  <div key={slot} className="relative pl-8">
                    {/* timeline node */}
                    <div className="absolute left-2.5 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-brand-500 bg-slate-950"></div>
                    
                    <h3 className="text-sm font-extrabold text-white mb-2">{slot}</h3>

                    {slotTasks.length > 0 ? (
                      <div className="space-y-2">
                        {slotTasks.map(t => (
                          <div 
                            key={t._id} 
                            onClick={() => {
                              setSelectedTask(t);
                              setNoteText(t.notes || '');
                              setShowNotesModal(false);
                            }}
                            className="bg-slate-900/40 border border-slate-900 hover:border-slate-800 p-3 rounded-lg cursor-pointer transition text-left"
                          >
                            <h4 className="text-xs font-bold text-slate-200">{t.title}</h4>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1.5">
                              <span>{t.estimatedDuration} mins</span>
                              <span className={t.status === 'Completed' ? 'text-emerald-400' : 'text-slate-500'}>
                                {t.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-600 italic">No slots scheduled</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* AI Diagnostic Quiz Generator Widget */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-900 bg-slate-900/10 space-y-4 pt-6 mt-6 border-t border-slate-900">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-brand-400" />
                <h3 className="text-sm font-bold text-white">AI MCQ Diagnostic</h3>
              </div>
              <p className="text-[10px] text-slate-500">Test topic strengths. Accuracy updates Spaced repetition masteries.</p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Subject</label>
                  <select
                    value={selectedSubjectForQuiz}
                    onChange={(e) => setSelectedSubjectForQuiz(e.target.value)}
                    className="block w-full rounded-lg border border-slate-850 bg-slate-950/60 py-2 px-3 text-xs text-slate-300 outline-none"
                  >
                    <option value="">-- Choose Subject --</option>
                    {subjectsList?.map((s: any) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  disabled={!selectedSubjectForQuiz || generateQuizMutation.isPending}
                  onClick={() => generateQuizMutation.mutate({ subjectId: selectedSubjectForQuiz, difficulty: 'Medium', count: 5 })}
                  className="w-full flex items-center justify-center gap-2 bg-brand-500 text-white rounded-lg py-2.5 text-xs font-bold hover:bg-brand-600 transition disabled:opacity-30"
                >
                  {generateQuizMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating MCQ...
                    </>
                  ) : (
                    'Generate Diagnostic Quiz'
                  )}
                </button>
              </div>

              {/* Latest attempt mini-widget */}
              {attemptsData && attemptsData.length > 0 && (
                <div className="pt-3 border-t border-slate-900/60 text-[10px] space-y-1.5 text-slate-400">
                  <div className="flex justify-between">
                    <span>Average Graded Accuracy</span>
                    <span className="font-bold text-white">
                      {Math.round(attemptsData.reduce((acc: number, a: any) => acc + a.accuracy, 0) / attemptsData.length)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Latest Assessment Score</span>
                    <span className="font-bold text-brand-400">
                      {attemptsData[0].score} Marks ({attemptsData[0].accuracy}%)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Mentor Collaboration Widget */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-900 bg-slate-900/10 space-y-4 pt-6 mt-6 border-t border-slate-900 text-xs">
              <div className="flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-brand-400" />
                <h3 className="text-sm font-bold text-white">Mentor Link</h3>
              </div>
              <p className="text-[10px] text-slate-500">Provide your mentor's user ID to link accounts for study plan reviews.</p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Mentor user ID..."
                  value={mentorInputId}
                  onChange={(e) => setMentorInputId(e.target.value)}
                  className="bg-slate-950 border border-slate-850 text-xs rounded-lg px-3 py-1.5 w-full outline-none text-slate-300"
                />
                <button
                  onClick={() => connectMentorMutation.mutate(mentorInputId)}
                  disabled={!mentorInputId || connectMentorMutation.isPending}
                  className="bg-brand-500 hover:bg-brand-600 font-bold px-3 py-1.5 text-[11px] rounded-lg text-white transition shrink-0"
                >
                  Link
                </button>
              </div>

              {/* Feedbacks list */}
              {feedbackList && feedbackList.length > 0 && (
                <div className="pt-3 border-t border-slate-900/60 space-y-3">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Recent Mentor Feedback</span>
                  {feedbackList.slice(0, 2).map((fb: any) => (
                    <div key={fb._id} className="p-2 rounded bg-slate-950/40 border border-slate-900 space-y-1 text-[10px] leading-relaxed text-slate-400">
                      <div className="flex justify-between font-bold text-white">
                        <span>{fb.mentorId?.name || 'Supervisor'}</span>
                        <span className="text-[9px] text-slate-500">{new Date(fb.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p>{fb.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Complete/Skip Notes Action Modal */}
      {showNotesModal && selectedTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">
              {completeMutation.isPending || skipMutation.isPending ? 'Logging data...' : 'Configure task completion logs'}
            </h3>
            <p className="text-slate-400 text-xs mb-4">Task focus: {selectedTask.title}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Actual Study Time (Minutes)
                </label>
                <input
                  type="number"
                  value={actualMinutes}
                  onChange={(e) => setActualMinutes(Number(e.target.value))}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-2.5 px-4 text-sm text-slate-100 outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Study Notes
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-2.5 px-4 text-sm text-slate-100 outline-none focus:border-brand-500 resize-none"
                  placeholder="Summarize what you learned or log blockers..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleActionSubmit}
                  className="flex-1 bg-emerald-500 text-white rounded-xl py-3 text-xs font-semibold hover:bg-emerald-600 transition"
                >
                  Log Completed
                </button>
                <button
                  type="button"
                  onClick={handleSkipSubmit}
                  className="flex-1 bg-amber-500 text-white rounded-xl py-3 text-xs font-semibold hover:bg-amber-600 transition"
                >
                  Log Skipped
                </button>
                <button
                  type="button"
                  onClick={() => setShowNotesModal(false)}
                  className="bg-slate-900 border border-slate-800 text-slate-400 rounded-xl px-4 py-3 text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DailyCheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        completedCount={completedTasks.length}
        missedCount={todayTasks.filter(t => t.status === 'Missed').length}
        skippedCount={todayTasks.filter(t => t.status === 'Skipped').length}
      />

      {showNotificationDrawer && (
        <NotificationDrawer onClose={() => setShowNotificationDrawer(false)} />
      )}
    </div>
  );
}
