import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, CheckCircle, Flame, Target, Check, Play, SkipForward, AlertCircle,
  Plus, Eye, Loader2, Sparkles, Bell, Users, RefreshCw, Calendar
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

  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteLinkGenerated, setInviteLinkGenerated] = useState<string>('');

  const [showChatModal, setShowChatModal] = useState<boolean>(false);
  const [activeChatConversationId, setActiveChatConversationId] = useState<string>('');
  const [chatInputMessage, setChatInputMessage] = useState<string>('');

  const startChatMutation = useMutation({
    mutationFn: async (mentorId: string) => {
      const response = await apiClient.post('/messages/start', { mentorId });
      return response.data.data.conversation;
    },
    onSuccess: (conversation) => {
      setActiveChatConversationId(conversation._id);
      setShowChatModal(true);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Could not start chat session with mentor', 'Chat Failed');
    }
  });

  const { data: chatMessagesList, refetch: refetchChatMessages } = useQuery({
    queryKey: ['studentChatMessages', activeChatConversationId],
    queryFn: async () => {
      if (!activeChatConversationId) return [];
      const response = await apiClient.get(`/messages/${activeChatConversationId}`);
      await apiClient.patch(`/messages/read/${activeChatConversationId}`);
      return response.data.data.messages || [];
    },
    enabled: !!activeChatConversationId && showChatModal,
    refetchInterval: showChatModal ? 3000 : false,
  });

  const sendStudentMessageMutation = useMutation({
    mutationFn: async (payload: { conversationId: string; message: string }) => {
      const response = await apiClient.post('/messages', payload);
      return response.data.data.message;
    },
    onSuccess: () => {
      setChatInputMessage('');
      refetchChatMessages();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to send message', 'Send Error');
    }
  });
  const acceptBannerRescheduleMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res1 = await apiClient.post('/scheduler/reschedule-skipped', { taskId });
      const options = res1.data?.data?.options || [];
      if (!options || options.length === 0) {
        throw new Error('No available reschedule slots found.');
      }
      const topSlot = options[0];
      const res2 = await apiClient.post('/scheduler/accept-reschedule', { taskId, slot: topSlot });
      return res2.data?.data?.task;
    },
    onSuccess: () => {
      toast.success('Study session successfully rescheduled.', 'Rescheduled');
      queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
      queryClient.invalidateQueries({ queryKey: ['myPlans'] });
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] });
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reschedule study session.', 'Reschedule Failed');
    }
  });

  const startMockTestMutation = useMutation({
    mutationFn: async (mockTask: any) => {
      if (mockTask.referencedQuizId) {
        return { quizId: mockTask.referencedQuizId };
      }
      const res = await apiClient.post('/quizzes/generate', {
        subjectId: mockTask.subjectId,
        topicId: mockTask.topicId,
        difficulty: mockTask.difficulty || 'Medium',
        count: 5
      });
      return { quizId: res.data?.data?.quiz?._id };
    },
    onSuccess: (data) => {
      toast.success('Loading practice diagnostic quiz environment...', 'Mock Test Ready');
      navigate(`/mock-tests/${data.quizId}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to start test session.', 'Error');
    }
  });

  // Fetch connected mentor status
  const { data: mentorStatus, refetch: refetchMentorStatus } = useQuery({
    queryKey: ['myMentorStatus'],
    queryFn: async () => {
      const response = await apiClient.get('/mentors/my-mentor');
      return response.data.data; // connected, pending
    }
  });

  // Fetch available mentors list
  const { data: availableMentorsList } = useQuery({
    queryKey: ['availableMentors'],
    queryFn: async () => {
      const response = await apiClient.get('/mentors/available');
      return response.data.data.mentors;
    }
  });

  const inviteMentorMutation = useMutation({
    mutationFn: async (payload: { email?: string; mentorId?: string }) => {
      const response = await apiClient.post('/mentors/invite', payload);
      return response.data.data.request;
    },
    onSuccess: () => {
      toast.success('Mentorship invitation sent successfully!', 'Invite Dispatched');
      setShowInviteModal(false);
      setInviteEmail('');
      refetchMentorStatus();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to dispatch mentorship invite', 'Invite Failed');
    }
  });

  const requestReviewMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/mentors/request-review');
    },
    onSuccess: () => {
      toast.success('Progress review request sent to your mentor!', 'Review Requested');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to request review', 'Request Failed');
    }
  });

  // Fetch my study plans list
  const { data: plansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['myPlans'],
    queryFn: async () => {
      const response = await apiClient.get('/planner/my');
      return response.data.data.plans;
    }
  });

  const activatePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      await apiClient.post(`/planner/${planId}/activate`);
    },
    onSuccess: () => {
      toast.success('Switched to selected study plan workspace.', 'Workspace Activated');
      queryClient.invalidateQueries({ queryKey: ['activePlan'] });
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] });
      queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      queryClient.invalidateQueries({ queryKey: ['myPlans'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to switch study plan workspace.', 'Error');
    }
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      await apiClient.delete(`/planner/${planId}`);
    },
    onSuccess: () => {
      toast.success('Study plan deleted successfully.', 'Plan Deleted');
      queryClient.invalidateQueries({ queryKey: ['myPlans'] });
      queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] });
    },
    onError: () => {
      toast.error('Failed to delete study plan.', 'Delete Failed');
    }
  });

  const regenerateMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const res = await apiClient.post('/planner/generate', { goalId });
      return res.data?.data;
    },
    onSuccess: (data) => {
      if (data?.jobId) {
        toast.info('Starting AI planning session...', 'Regeneration Triggered');
        navigate(`/planner/job/${data.jobId}`);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to trigger plan regeneration.', 'Regeneration Failed');
    }
  });

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleTaskId, setRescheduleTaskId] = useState('');
  const [rescheduleOptions, setRescheduleOptions] = useState<any[]>([]);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState<any>(null);

  const skipRescheduleMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await apiClient.post('/scheduler/reschedule-skipped', { taskId });
      return res.data.data;
    },
    onSuccess: (data) => {
      setRescheduleTaskId(data.taskId);
      setRescheduleOptions(data.options);
      if (data.options && data.options.length > 0) {
        setSelectedRescheduleSlot(data.options[0]);
        setShowRescheduleModal(true);
      } else {
        toast.info('Task skipped. No optimal reschedule slots could be found within parameters.', 'Skipped');
      }
      queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
      queryClient.invalidateQueries({ queryKey: ['myPlans'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to trigger skip scheduling.', 'Error');
    }
  });

  const acceptRescheduleMutation = useMutation({
    mutationFn: async (payload: { taskId: string; slot: any }) => {
      await apiClient.post('/scheduler/accept-reschedule', payload);
    },
    onSuccess: () => {
      toast.success('Task rescheduled successfully!', 'Schedule Accepted');
      setShowRescheduleModal(false);
      queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
      queryClient.invalidateQueries({ queryKey: ['myPlans'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reschedule task.', 'Error');
    }
  });

  // Fetch active study goal
  const { data: goalData } = useQuery({
    queryKey: ['activeGoal'],
    queryFn: async () => {
      const response = await apiClient.get('/goals/active');
      return response.data?.data?.goal || null;
    },
    staleTime: 0,
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

  const [openWeekDay, setOpenWeekDay] = useState<string | null>(null);

  const formatTimeString = (timeStr: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10);
    if (isNaN(h)) return timeStr;
    const suffix = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    const m = parts[1] || '00';
    return `${displayH}:${m} ${suffix}`;
  };

  const formatTaskTime = (task: any) => {
    if (task.plannedStartTime && task.plannedEndTime) {
      return `${formatTimeString(task.plannedStartTime)} – ${formatTimeString(task.plannedEndTime)}`;
    }
    return 'Flexible Time';
  };

  const formatTaskDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const getGreetingPrefix = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const allTasks = (tasksData as any[]) || [];
  
  const todayStr = new Date().toDateString();
  const todayTasks = allTasks.filter(t => new Date(t.scheduledDate).toDateString() === todayStr && t.status !== 'Skipped');
  const todayCompletedTasks = todayTasks.filter(t => t.status === 'Completed');
  const todayProgress = todayTasks.length > 0 ? Math.round((todayCompletedTasks.length / todayTasks.length) * 100) : 0;
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toDateString();
  const tomorrowTasks = allTasks.filter(t => new Date(t.scheduledDate).toDateString() === tomorrowStr && t.status !== 'Skipped');

  const futureUpcomingTasks = allTasks.filter(t => {
    const d = new Date(t.scheduledDate);
    d.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return d > now && t.status !== 'Skipped';
  });

  // Next 7 days grouping
  const upcomingWeekByDay: { [key: string]: any[] } = {};
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  for (let i = 2; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayName = weekdayNames[d.getDay()];
    upcomingWeekByDay[dayName] = allTasks.filter(t => new Date(t.scheduledDate).toDateString() === d.toDateString() && t.status !== 'Skipped');
  }

  // Mock Tests
  const mockTests = allTasks.filter(t => t.taskType === 'Mock Test');
  const upcomingMockTest = mockTests.find(t => t.status === 'Pending' || t.status === 'In Progress');

  // Revision Timeline
  const revisionTasks = allTasks.filter(t => t.taskType === 'Revision');

  // Skipped Tasks for suggestions
  const skippedTasks = allTasks.filter(t => t.status === 'Skipped');

  // Statistics
  const totalCompletedTasks = allTasks.filter(t => t.status === 'Completed');
  const totalRemainingTasks = allTasks.filter(t => t.status === 'Pending' || t.status === 'In Progress');
  const totalCompletionRate = allTasks.length > 0 ? Math.round((totalCompletedTasks.length / allTasks.length) * 100) : 0;
  
  const totalHoursStudied = totalCompletedTasks.reduce((acc, t) => acc + (t.actualStudyTime || t.estimatedDuration || 0), 0) / 60;
  const totalHoursRemaining = totalRemainingTasks.reduce((acc, t) => acc + (t.estimatedDuration || 0), 0) / 60;
  
  const avgFocusTime = totalCompletedTasks.length > 0 
    ? Math.round(totalCompletedTasks.reduce((acc, t) => acc + (t.actualStudyTime || t.estimatedDuration || 0), 0) / totalCompletedTasks.length)
    : 45;

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
    skipRescheduleMutation.mutate(selectedTask._id);
    setShowNotesModal(false);
  };

  if (isLoadingTasks) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
        <p className="text-sm">Loading your dashboard...</p>
      </div>
    );
  }

  // Calculate day details for Hero Card strictly based on targetDate - currentDate
  const targetTime = goalData?.targetDate ? new Date(goalData.targetDate).getTime() : Date.now() + 7 * 24 * 60 * 60 * 1000;
  const createdTime = goalData?.createdAt ? new Date(goalData.createdAt).getTime() : Date.now();

  const totalGoalDays = Math.max(1, Math.ceil((targetTime - createdTime) / (1000 * 60 * 60 * 24)));
  const remainingDays = Math.max(1, Math.ceil((targetTime - Date.now()) / (1000 * 60 * 60 * 24)));
  const currentDayNum = Math.max(1, Math.min(totalGoalDays, Math.ceil((Date.now() - createdTime) / (1000 * 60 * 60 * 24)) || 1));
  const totalWeeks = Math.max(1, Math.ceil(remainingDays / 7));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Light glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-500/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 z-10 relative">
        
        {/* HERO CARD MODULE */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-900 bg-gradient-to-r from-slate-900 to-slate-950 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-brand-500/10 blur-3xl pointer-events-none"></div>
          
          <div className="space-y-4 max-w-lg">
            <div>
              <span className="text-[10px] tracking-widest text-brand-400 font-bold uppercase block">{getGreetingPrefix()},</span>
              <h1 className="text-3xl font-black text-white mt-1">{profileData?.name || 'Student'} 👋</h1>
              <p className="text-slate-400 text-xs mt-2 flex items-center gap-1.5">
                <Target className="h-4 w-4 text-brand-400 shrink-0" />
                Current Goal: <span className="text-slate-200 font-bold">{goalData?.title || 'Personal Study Target'}</span>
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-3">
                <span className="text-slate-500 text-[9px] uppercase font-bold block">Current Timeline</span>
                <span className="text-white font-extrabold block mt-0.5">
                  {remainingDays} Days ({totalWeeks} {totalWeeks === 1 ? 'Week' : 'Weeks'})
                </span>
              </div>
              <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-3">
                <span className="text-slate-500 text-[9px] uppercase font-bold block">Focus Time Logged</span>
                <span className="text-brand-450 font-extrabold block mt-0.5">{totalHoursStudied.toFixed(1)} Hours</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-3">
                <span className="text-slate-500 text-[9px] uppercase font-bold block">Focus Streak</span>
                <span className="text-orange-400 font-extrabold block mt-0.5">{streakData?.currentStreak || 0} Days</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-stretch md:items-end gap-3 w-full md:w-auto shrink-0">
            <div className="bg-brand-500/5 border border-brand-500/20 p-4 rounded-xl space-y-2 text-xs md:text-right w-full md:w-56">
              <span className="text-slate-500 text-[9px] uppercase font-bold block">Today's Progress</span>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-350">
                <span>{todayCompletedTasks.length}/{todayTasks.length} Done</span>
                <span>{todayProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${todayProgress}%` }}></div>
              </div>
            </div>

            <button
              onClick={() => {
                const element = document.getElementById("today-planner-section");
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 px-5 text-xs font-bold transition shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4" />
              Continue Today's Session
            </button>
          </div>
        </div>

        {/* AI SUGGESTIONS MODULE */}
        {skippedTasks.length > 0 && (
          <div className="bg-brand-500/5 border border-brand-500/20 p-5 rounded-2xl space-y-3 z-10 relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex gap-3">
              <Sparkles className="h-6 w-6 text-brand-450 shrink-0 animate-pulse mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">AI Workload Adjustment Recommendation</h4>
                <p className="text-xs text-slate-400 mt-1">
                  You skipped yesterday's "{skippedTasks[0].title}". Would you like me to reschedule it automatically?
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => acceptBannerRescheduleMutation.mutate(skippedTasks[0]._id)}
                disabled={acceptBannerRescheduleMutation.isPending}
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs py-2 px-4 rounded-xl transition disabled:opacity-50"
              >
                {acceptBannerRescheduleMutation.isPending ? 'Rescheduling...' : 'Accept'}
              </button>
              <button
                onClick={() => {
                  toast.info('Suggestion dismissed.');
                }}
                className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-bold text-xs py-2 px-4 rounded-xl transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* MAIN DASHBOARD MATRIX SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2/3 COLUMN: DAILY PLANNER */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* SECTION 1: TODAY'S STUDY PLAN */}
            <div id="today-planner-section" className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-brand-400" />
                  Today's Study Plan
                </h2>
                <span className="text-xs text-slate-400 font-semibold">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>

              {isLoadingTasks ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                </div>
              ) : todayTasks.length > 0 ? (
                <div className="space-y-4">
                  {todayTasks.map((task) => (
                    <div 
                      key={task._id}
                      className={`p-5 rounded-2xl border transition-all ${
                        task.status === 'Completed' ? 'bg-slate-950/40 border-slate-900/60 opacity-60' :
                        task.status === 'In Progress' ? 'bg-slate-900/60 border-brand-500/30' :
                        'bg-slate-900/20 border-slate-900 hover:border-slate-850'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-900 text-brand-400">
                              {task.subjectId?.name || 'General Subject'}
                            </span>
                            {task.isRescheduled && (
                              <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-brand-500/10 text-brand-400">
                                Rescheduled
                              </span>
                            )}
                          </div>
                          <h3 className="font-extrabold text-white mt-2 text-sm">{task.title}</h3>
                          <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                          <span className="text-[10px] text-slate-400 font-bold block mt-2">
                            {formatTaskTime(task)}
                          </span>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1.5">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                            task.priority === 'High' ? 'bg-red-950/40 text-red-400 border border-red-500/20' :
                            task.priority === 'Medium' ? 'bg-amber-950/40 text-amber-400 border border-amber-500/20' :
                            'bg-slate-900 text-slate-400'
                          }`}>
                            {task.priority} Priority
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">{task.estimatedDuration} mins</span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-900/60">
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${
                          task.status === 'Completed' ? 'text-emerald-400' :
                          task.status === 'In Progress' ? 'text-brand-450 animate-pulse' : 'text-slate-500'
                        }`}>
                          {task.status}
                        </span>

                        <div className="flex gap-2">
                          {task.status !== 'Completed' && task.status !== 'Skipped' && (
                            <>
                              {task.status !== 'In Progress' && (
                                <button
                                  onClick={() => updateStatusMutation.mutate({ taskId: task._id, status: 'In Progress' })}
                                  className="flex items-center gap-1 bg-slate-900 text-slate-350 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-slate-800 transition"
                                >
                                  <Play className="h-3.5 w-3.5" />
                                  Start
                                </button>
                              )}
                              <button
                                onClick={() => openActionModal(task)}
                                className="flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-emerald-900/40 transition"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Complete
                              </button>
                              <button
                                onClick={() => openActionModal(task)}
                                className="flex items-center gap-1 bg-slate-900 text-slate-500 border border-slate-900 rounded-lg px-3 py-1.5 text-xs font-semibold hover:text-slate-400 hover:border-slate-850 transition"
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
              ) : futureUpcomingTasks.length > 0 ? (
                <div className="p-6 rounded-2xl bg-slate-900/30 border border-brand-500/20 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-brand-500/15 text-brand-400 border border-brand-500/20">
                        Next Available Study Session
                      </span>
                      <h3 className="font-extrabold text-white text-base mt-2">{futureUpcomingTasks[0].title}</h3>
                      <p className="text-xs text-slate-400 mt-1">{futureUpcomingTasks[0].description}</p>
                      <span className="text-xs text-brand-400 font-bold block mt-2">
                        Scheduled for: {new Date(futureUpcomingTasks[0].scheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ({futureUpcomingTasks[0].estimatedDuration} mins)
                      </span>
                    </div>
                    <button
                      onClick={() => updateStatusMutation.mutate({ taskId: futureUpcomingTasks[0]._id, status: 'In Progress' })}
                      className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs px-5 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 shrink-0"
                    >
                      <Play className="h-4 w-4" />
                      Start Session Early
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-900/10 rounded-2xl border border-slate-900">
                  <CheckCircle className="h-10 w-10 text-slate-650 mx-auto mb-3" />
                  <h4 className="text-slate-400 font-bold">No tasks scheduled for today.</h4>
                  <p className="text-xs text-slate-550 mt-1">Enjoy your rest window or check out the preview below.</p>
                </div>
              )}
            </div>

            {/* SECTION 2: TOMORROW PREVIEW */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <Eye className="h-4.5 w-4.5 text-slate-500" />
                  Tomorrow Preview
                </h2>
              </div>

              {tomorrowTasks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tomorrowTasks.map((task) => (
                    <div key={task._id} className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-900 text-brand-400">
                          {task.subjectId?.name || 'General'}
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-200 mt-2 line-clamp-1">{task.title}</h4>
                        <span className="text-[10px] text-slate-500 block mt-1">{formatTaskTime(task)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-900/60 text-[10px] text-slate-400">
                        <span>{task.estimatedDuration} mins</span>
                        <span className="capitalize">{task.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/10 border border-slate-900 text-center text-xs text-slate-500">
                  No study blocks configured for tomorrow.
                </div>
              )}
            </div>

            {/* SECTION 3: UPCOMING WEEK COLLAPSIBLE TIMELINE */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-slate-500" />
                  Upcoming Week
                </h2>
              </div>

              <div className="space-y-2">
                {Object.keys(upcomingWeekByDay).map((dayName) => {
                  const dayTasks = upcomingWeekByDay[dayName] || [];
                  const isOpen = openWeekDay === dayName;

                  return (
                    <div key={dayName} className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950/20">
                      <button
                        onClick={() => setOpenWeekDay(isOpen ? null : dayName)}
                        className="w-full flex justify-between items-center p-4 bg-slate-900/40 hover:bg-slate-900/60 transition text-left text-xs font-bold text-slate-250"
                      >
                        <span>{dayName}</span>
                        <span className="text-[10px] bg-slate-900 text-slate-550 px-2 py-0.5 rounded-full font-semibold">
                          {dayTasks.length} Study Blocks
                        </span>
                      </button>
                      
                      {isOpen && (
                        <div className="p-4 bg-slate-950/40 border-t border-slate-900 space-y-3">
                          {dayTasks.length > 0 ? (
                            dayTasks.map((t) => (
                              <div key={t._id} className="flex justify-between items-center text-xs text-slate-350 p-2.5 rounded bg-slate-900/10 border border-slate-900/50">
                                <div>
                                  <span className="font-semibold text-slate-200 block">{t.title}</span>
                                  <span className="text-[10px] text-slate-500">{formatTaskTime(t)} ({t.subjectId?.name || 'General'})</span>
                                </div>
                                <span className="text-[9px] uppercase bg-slate-950 px-2 py-0.5 rounded font-bold text-slate-500">
                                  {t.priority}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-slate-550 italic">No schedules for this day.</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT 1/3 COLUMN: SIDEBAR METRICS & CALENDARS */}
          <div className="space-y-6">
            
            {/* STUDY PLANS WORKSPACE */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Your Study Plans</h3>
                <button
                  onClick={() => navigate('/goals/new')}
                  className="text-brand-400 hover:text-white font-bold text-xs flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> New Plan
                </button>
              </div>
              
              {plansData && plansData.length > 0 ? (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {plansData.map((plan: any) => (
                    <div key={plan.planId} className="glass-panel p-4 rounded-xl border border-slate-900 bg-slate-900/10 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[8px] uppercase tracking-wider bg-slate-950 text-brand-400 px-2 py-0.5 rounded font-bold">
                            {plan.category}
                          </span>
                          <h4 className="font-extrabold text-white text-xs mt-1.5 leading-tight">{plan.goalTitle}</h4>
                          <span className="text-[9px] text-slate-500 block mt-0.5">
                            Created: {new Date(plan.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                          plan.isCurrent
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30 font-extrabold' 
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}>
                          {plan.isCurrent ? 'Active Workspace' : 'Available'}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-[10px]">
                        <div className="flex justify-between text-slate-400 font-semibold">
                          <span>Progress</span>
                          <span>{plan.progress}%</span>
                        </div>
                        <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 transition-all rounded-full" style={{ width: `${plan.progress}%` }}></div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-900/60">
                        <button
                          onClick={() => activatePlanMutation.mutate(plan.planId)}
                          disabled={activatePlanMutation.isPending}
                          className={`${
                            plan.isCurrent
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : 'bg-brand-500 hover:bg-brand-600'
                          } text-white rounded py-1 px-2.5 text-[9px] font-extrabold transition disabled:opacity-50 flex items-center gap-1`}
                        >
                          {plan.isCurrent ? 'Current Workspace' : 'Continue Workspace'}
                        </button>
                        <button
                          onClick={() => navigate(`/planner/${plan.planId}`)}
                          className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded py-1 px-2 text-[9px] font-semibold transition"
                        >
                          View Roadmap
                        </button>
                        <button
                          onClick={() => regenerateMutation.mutate(plan.goalId)}
                          disabled={regenerateMutation.isPending}
                          className="bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-850 rounded py-1 px-2 text-[9px] font-semibold transition disabled:opacity-50"
                        >
                          Regenerate
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this study plan?')) {
                              deletePlanMutation.mutate(plan.planId);
                            }
                          }}
                          disabled={deletePlanMutation.isPending}
                          className="bg-slate-955 hover:bg-red-950/40 text-red-400 border border-slate-955 rounded py-1 px-2 text-[9px] font-semibold transition disabled:opacity-50 ml-auto"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 text-center text-xs text-slate-500">
                  No study plans configured.
                </div>
              )}
            </div>

            {/* MOCK TEST PLANNER */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Mock Exams Schedule</h3>
              {upcomingMockTest ? (
                <div className="glass-panel p-5 rounded-2xl border border-slate-900 bg-slate-900/10 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] bg-red-950/40 border border-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded uppercase">
                      Upcoming summative
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      {formatTaskDate(upcomingMockTest.scheduledDate)}
                    </span>
                  </div>
                  <h4 className="text-xs font-extrabold text-white">{upcomingMockTest.title.replace('Mock Exam: ', '')}</h4>
                  
                  <div className="text-[10px] text-slate-400 space-y-1.5 pt-2 border-t border-slate-900/50">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Duration:</span>
                      <span>{upcomingMockTest.estimatedDuration || 120} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Passing Score:</span>
                      <span>75% Minimum</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Estimated Marks:</span>
                      <span>100 Marks Target</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Difficulty:</span>
                      <span className="capitalize">{upcomingMockTest.difficulty || 'Intermediate'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => startMockTestMutation.mutate(upcomingMockTest)}
                    disabled={startMockTestMutation.isPending}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-850 py-2 rounded-xl text-[10px] font-bold mt-2 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {startMockTestMutation.isPending ? 'Generating Test...' : 'Start Test Session'}
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 text-center text-xs text-slate-500">
                  No mock exams scheduled yet.
                </div>
              )}
            </div>

            {/* REVISION CALENDAR */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Revision Spacing (Timeline)</h3>
              {revisionTasks.length > 0 ? (
                <div className="glass-panel p-4 rounded-2xl border border-slate-900 bg-slate-900/10 space-y-3">
                  <div className="relative border-l border-slate-850 pl-4 space-y-4">
                    {revisionTasks.slice(0, 5).map((rev, idx) => (
                      <div key={rev._id} className="relative">
                        <div className="absolute -left-[21px] mt-1 h-2 w-2 rounded-full bg-brand-500 ring-4 ring-slate-950"></div>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                          Day {idx * 3 + 1 === 1 ? 1 : idx * 3 + 1} Spacing ({formatTaskDate(rev.scheduledDate)})
                        </span>
                        <span className="text-xs font-extrabold text-slate-200 leading-tight block mt-0.5">
                          {rev.title.replace('Revision: ', '')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 text-center text-xs text-slate-500">
                  No spaced repetition reviews scheduled.
                </div>
              )}
            </div>

            {/* PERFORMANCE STATISTICS MODULE */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Focus Analytics</h3>
              <div className="glass-panel p-5 rounded-2xl border border-slate-900 bg-slate-900/10 space-y-3.5 text-xs text-slate-350">
                <div className="flex justify-between">
                  <span>Current Study Streak:</span>
                  <span className="font-extrabold text-orange-400">{streakData?.currentStreak || 0} Days</span>
                </div>
                <div className="flex justify-between">
                  <span>Global Completion:</span>
                  <span className="font-extrabold text-white">{totalCompletionRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Logged Focus Time:</span>
                  <span className="font-extrabold text-brand-450">{totalHoursStudied.toFixed(1)} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Time Remaining:</span>
                  <span className="font-extrabold text-slate-200">{totalHoursRemaining.toFixed(1)} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span>Tasks Completed:</span>
                  <span className="font-extrabold text-emerald-450">{totalCompletedTasks.length} Tasks</span>
                </div>
                <div className="flex justify-between">
                  <span>Tasks Remaining:</span>
                  <span className="font-extrabold text-slate-200">{totalRemainingTasks.length} Tasks</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Session Duration:</span>
                  <span className="font-extrabold text-white">{avgFocusTime} mins</span>
                </div>
              </div>
            </div>

            {/* SaaS Mentor Connection Widget */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-900 bg-slate-900/10 space-y-4 pt-6 text-xs relative overflow-hidden">
              <div className="flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-brand-400" />
                <h3 className="text-sm font-bold text-white">Study Mentor</h3>
              </div>
              
              {!mentorStatus?.connected ? (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Need expert guidance? Invite a mentor to review your AI study plan, monitor progress, and provide personalized feedback.
                  </p>
                  
                  {mentorStatus?.pending ? (
                    <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-amber-400 block">Pending Invitation</span>
                      <p className="text-[10px] text-slate-300">Sent to: <span className="font-bold">{mentorStatus.pending.mentorId?.email || 'Your Mentor'}</span></p>
                      <span className="text-[9px] text-slate-550 block mt-1">Awaiting mentor approval...</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setShowInviteModal(true);
                        setInviteLinkGenerated('');
                      }}
                      className="w-full bg-brand-500 hover:bg-brand-600 font-extrabold py-2 text-xs rounded-xl text-white transition text-center shadow-lg shadow-brand-500/10"
                    >
                      Invite Mentor
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between border-b border-slate-900/60 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center font-extrabold text-brand-400 text-lg">
                        {mentorStatus.connected.mentorId?.name?.charAt(0).toUpperCase() || 'M'}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-xs">{mentorStatus.connected.mentorId?.name || 'Rahul Sharma'}</h4>
                        <span className="text-[9px] text-slate-500 block">{mentorStatus.connected.mentorProfile?.bio || 'Senior Software Engineer'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-0.5 text-amber-400 text-[10px]">
                        <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                      </div>
                      <span className="text-[8px] text-slate-550 block mt-0.5">
                        Connected: {new Date(mentorStatus.connected.acceptedAt || mentorStatus.connected.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {feedbackList && feedbackList.length > 0 ? (
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-900 space-y-2">
                      <span className="text-[9px] uppercase font-bold text-brand-400 block tracking-wider">Latest Feedback</span>
                      <p className="text-[10px] text-slate-350 italic">
                        "{feedbackList[0].comment || `Strengths: ${feedbackList[0].strengths || 'Good progress'}. Rec: ${feedbackList[0].recommendations || 'Keep it up'}`}"
                      </p>
                      {feedbackList[0].recommendations && (
                        <div className="text-[9px] text-slate-450 border-t border-slate-900/40 pt-1.5 mt-1">
                          <span className="font-bold text-slate-400">Rec:</span> {feedbackList[0].recommendations}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-950/25 border border-slate-900 text-center text-[10px] text-slate-550">
                      No feedback logs posted yet.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => requestReviewMutation.mutate()}
                      disabled={requestReviewMutation.isPending}
                      className="bg-slate-950 hover:bg-slate-900 text-slate-200 border border-slate-850 rounded-xl py-2 text-[10px] font-bold transition disabled:opacity-50 text-center"
                    >
                      {requestReviewMutation.isPending ? 'Requesting...' : 'Request Review'}
                    </button>
                    <button
                      onClick={() => {
                        const mId = mentorStatus.connected.mentorId?._id || mentorStatus.connected.mentorId;
                        startChatMutation.mutate(mId);
                      }}
                      disabled={startChatMutation.isPending}
                      className="bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-2 text-[10px] font-bold transition text-center disabled:opacity-50"
                    >
                      {startChatMutation.isPending ? 'Connecting...' : 'Message Mentor'}
                    </button>
                  </div>
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

      {/* Invite Mentor Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full border border-slate-800 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                🎓 Invite a Study Mentor
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Option 1: Invite via Email */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-350 uppercase tracking-wider">Option 1: Invite via Email</h4>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter mentor's email address..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="bg-slate-955 border border-slate-850 text-xs rounded-xl px-4 py-2 w-full outline-none text-slate-100 placeholder:text-slate-600 focus:border-brand-500"
                  />
                  <button
                    onClick={() => inviteMentorMutation.mutate({ email: inviteEmail })}
                    disabled={!inviteEmail || inviteMentorMutation.isPending}
                    className="bg-brand-500 hover:bg-brand-600 font-extrabold px-4 py-2 text-xs rounded-xl text-white transition disabled:opacity-50"
                  >
                    Send Invite
                  </button>
                </div>
              </div>

              {/* Option 2: Generate Invite Link */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-350 uppercase tracking-wider">Option 2: Generate Invitation Link</h4>
                <p className="text-[9px] text-slate-500">Create a secure URL to send directly to your tutor or study guide.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/register?inviteStudentId=${studentId}`;
                      setInviteLinkGenerated(link);
                    }}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold px-4 py-2 text-xs rounded-xl transition"
                  >
                    Generate Secure Link
                  </button>
                  {inviteLinkGenerated && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="text"
                        readOnly
                        value={inviteLinkGenerated}
                        className="bg-slate-950 border border-slate-900 text-[10px] rounded-xl px-3 py-2 w-full outline-none text-slate-400 select-all truncate"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(inviteLinkGenerated);
                          toast.success('Invitation link copied to clipboard!', 'Copied');
                        }}
                        className="bg-emerald-650 hover:bg-emerald-700 text-white font-bold px-3 py-2 text-xs rounded-xl transition whitespace-nowrap"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Option 3: Select from Available Mentors */}
              <div className="space-y-3 pt-2 border-t border-slate-900/60">
                <h4 className="text-[11px] font-bold text-slate-350 uppercase tracking-wider">Option 3: Available System Mentors</h4>
                <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {availableMentorsList && availableMentorsList.length > 0 ? (
                    availableMentorsList.map((m: any) => (
                      <div
                        key={m._id}
                        className="p-3 rounded-xl bg-slate-900/30 border border-slate-900 flex justify-between items-center hover:border-slate-850 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 text-xs uppercase">
                            {m.userId?.name?.charAt(0) || 'M'}
                          </div>
                          <div>
                            <h5 className="font-bold text-white text-[11px]">{m.userId?.name || 'Academic Mentor'}</h5>
                            <p className="text-[9px] text-slate-455 line-clamp-1">{m.bio || 'Qualified study counselor'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => inviteMentorMutation.mutate({ mentorId: m.userId?._id })}
                          disabled={inviteMentorMutation.isPending}
                          className="bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-[10px] py-1 px-3 rounded-lg transition"
                        >
                          Connect
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-slate-500 text-center py-2">No mentors are currently available for direct links.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-900">
              <button
                onClick={() => setShowInviteModal(false)}
                className="bg-slate-900 border border-slate-800 text-slate-400 rounded-xl px-4 py-2 text-xs font-semibold hover:bg-slate-800 transition"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Chat Workspace Modal */}
      {showChatModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full border border-slate-800 shadow-2xl space-y-4 flex flex-col h-[520px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center font-extrabold text-brand-400 text-sm">
                  {mentorStatus?.connected?.mentorId?.name?.charAt(0).toUpperCase() || 'M'}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    {mentorStatus?.connected?.mentorId?.name || 'Rahul Sharma'}
                  </h3>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online • Academic Advisor
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowChatModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto space-y-3 p-2 custom-scrollbar">
              {chatMessagesList && chatMessagesList.length > 0 ? (
                chatMessagesList.map((msg: any) => {
                  const isStudentMsg = msg.senderId?._id === studentId || msg.senderId === studentId;
                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col ${isStudentMsg ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-xs p-3 rounded-2xl text-xs leading-relaxed ${
                          isStudentMsg
                            ? 'bg-brand-600 text-white rounded-br-none'
                            : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none'
                        }`}
                      >
                        {msg.message}
                      </div>
                      <span className="text-[9px] text-slate-550 mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                  <span className="text-2xl">💬</span>
                  <p className="text-xs font-semibold text-slate-400">Direct Mentor Channel</p>
                  <p className="text-[10px] text-slate-550">Type your question or study plan update below.</p>
                </div>
              )}
            </div>

            {/* Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!chatInputMessage.trim() || !activeChatConversationId) return;
                sendStudentMessageMutation.mutate({
                  conversationId: activeChatConversationId,
                  message: chatInputMessage.trim(),
                });
              }}
              className="flex items-center gap-2 pt-3 border-t border-slate-900"
            >
              <input
                type="text"
                value={chatInputMessage}
                onChange={(e) => setChatInputMessage(e.target.value)}
                placeholder="Type your message to mentor..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={!chatInputMessage.trim() || sendStudentMessageMutation.isPending}
                className="bg-brand-500 hover:bg-brand-600 font-extrabold px-4 py-2.5 text-xs rounded-xl text-white transition disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      <DailyCheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        completedCount={todayCompletedTasks.length}
        missedCount={todayTasks.filter(t => t.status === 'Missed').length}
        skippedCount={todayTasks.filter(t => t.status === 'Skipped').length}
      />

      {showNotificationDrawer && (
        <NotificationDrawer onClose={() => setShowNotificationDrawer(false)} />
      )}
    </div>
  );
}
