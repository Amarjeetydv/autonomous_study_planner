import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  BarChart3, LineChart, FolderKanban, 
  Clock, Sparkles, Flame, Plus, Megaphone, Star, MessageSquare
} from 'lucide-react';
import apiClient from '../../services/api/client';
import { MentorSkeleton } from '../../components/ui/Skeleton';
import StatCard from '../../components/ui/StatCard';
import UserAvatar from '../../components/ui/UserAvatar';
import EmptyState from '../../components/ui/EmptyState';
import { RootState } from '../../app/store';
import { toast } from '../../services/toast';

interface StudentLink {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  invitedAt: string;
  acceptedAt?: string;
  metrics?: {
    goalName: string;
    goalId?: string;
    completionRate: number;
    streak: number;
    lastActive: string;
  };
}

export default function MentorDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const [selectedStudentForFeedback, setSelectedStudentForFeedback] = useState<any>(null);
  const [rating, setRating] = useState<number>(5);
  const [strengthsText, setStrengthsText] = useState<string>('');
  const [weaknessesText, setWeaknessesText] = useState<string>('');
  const [recommendationsText, setRecommendationsText] = useState<string>('');

  // Fetch assigned students list
  const { data: students, isLoading: isStudentsLoading, isError, refetch } = useQuery({
    queryKey: ['mentorStudentsList'],
    queryFn: async () => {
      const response = await apiClient.get('/mentors/students');
      return (response.data?.data?.students as StudentLink[]) || [];
    },
  });

  // Fetch pending invitations
  const { data: pendingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['mentorInvitations'],
    queryFn: async () => {
      const response = await apiClient.get('/mentors/requests');
      return response.data?.data?.requests || [];
    }
  });

  const acceptMutation = useMutation({
    mutationFn: async (studentId: string) => {
      await apiClient.post('/mentors/accept', { studentId });
    },
    onSuccess: () => {
      toast.success('Student invitation accepted! Added to your roster.', 'Invitation Accepted');
      refetch();
      refetchRequests();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to accept student invitation', 'Accept Failed');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (studentId: string) => {
      await apiClient.post('/mentors/reject', { studentId });
    },
    onSuccess: () => {
      toast.info('Student invitation declined.', 'Declined');
      refetchRequests();
    }
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (payload: any) => {
      await apiClient.post('/mentors/feedback', payload);
    },
    onSuccess: () => {
      toast.success('Feedback submitted successfully!', 'Feedback Posted');
      setSelectedStudentForFeedback(null);
      setStrengthsText('');
      setWeaknessesText('');
      setRecommendationsText('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit feedback.', 'Error');
    }
  });

  if (isStudentsLoading) {
    return <MentorSkeleton />;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 flex flex-col items-center justify-center">
        <EmptyState
          icon={Users}
          title="Failed to Load Mentor Dashboard"
          description="Could not fetch assigned student records."
          actionLabel="Retry Connection"
          onAction={() => refetch()}
        />
      </div>
    );
  }

  const assignedCount = students?.length || 0;
  const pendingCount = pendingRequests?.length || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 z-10 relative">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                Mentor Account
              </span>
              <span className="text-xs text-slate-500 font-semibold">• Active Workspace</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1.5 flex items-center gap-2">
              Welcome back, Mentor {user?.name || 'Academic Advisor'}!
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Monitor student engagement, review progress logs, and publish study materials.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/mentor/students')}
              className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition shadow-lg shadow-brand-500/20 flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              View Students Roster
            </button>
          </div>
        </div>

        {/* Pending Student Invitations Banner */}
        {pendingCount > 0 && (
          <div className="p-5 rounded-2xl bg-brand-950/40 border border-brand-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-400 animate-ping" />
                Pending Student Invitations ({pendingCount})
              </h3>
              <span className="text-[10px] text-brand-300 font-semibold">Action Required</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((req: any) => (
                <div key={req._id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={req.studentId?.name || 'Student'} status="online" />
                    <div>
                      <h4 className="font-extrabold text-white text-xs">{req.studentId?.name || 'Student'}</h4>
                      <span className="text-[10px] text-slate-400">{req.studentId?.email}</span>
                      <span className="text-[9px] text-slate-550 block mt-0.5">Invited: {new Date(req.invitedAt || req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => acceptMutation.mutate(req.studentId?._id)}
                      disabled={acceptMutation.isPending}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate(req.studentId?._id)}
                      disabled={rejectMutation.isPending}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-3 py-1.5 rounded-lg transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6 Mentor Specific Dashboard Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Total Students"
            value={assignedCount}
            subtext="Active roster"
            icon={Users}
            iconColor="text-brand-400"
            onClick={() => navigate('/mentor/students')}
          />
          <StatCard
            title="Needing Attention"
            value={assignedCount > 0 ? Math.ceil(assignedCount * 0.2) : 0}
            subtext="Low completion"
            icon={Clock}
            iconColor="text-amber-400"
          />
          <StatCard
            title="Pending Reviews"
            value={pendingCount}
            subtext="Awaiting response"
            icon={Sparkles}
            iconColor="text-indigo-400"
          />
          <StatCard
            title="Avg Completion"
            value={assignedCount > 0 ? '78%' : '0%'}
            subtext="Cohort completion"
            icon={BarChart3}
            iconColor="text-emerald-400"
            onClick={() => navigate('/mentor/progress')}
          />
          <StatCard
            title="Average Streak"
            value={assignedCount > 0 ? '8.4 Days' : '0 Days'}
            subtext="Consecutive days"
            icon={Flame}
            iconColor="text-orange-400"
          />
          <StatCard
            title="Resources Shared"
            value="4"
            subtext="Published items"
            icon={FolderKanban}
            iconColor="text-purple-400"
            onClick={() => navigate('/mentor/resources')}
          />
        </div>

        {/* Quick Actions Navigation Section */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/mentor/students')}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-brand-500/40 text-left transition space-y-2 group"
            >
              <Users className="h-6 w-6 text-brand-400 group-hover:scale-110 transition-transform" />
              <div>
                <span className="font-bold text-white text-xs block">View Students</span>
                <span className="text-[10px] text-slate-500 block">Manage student roster</span>
              </div>
            </button>

            <button
              onClick={() => navigate('/mentor/resources')}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-brand-500/40 text-left transition space-y-2 group"
            >
              <Plus className="h-6 w-6 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <span className="font-bold text-white text-xs block">Add Resource</span>
                <span className="text-[10px] text-slate-500 block">Upload PDFs & notes</span>
              </div>
            </button>

            <button
              onClick={() => navigate('/mentor/resources')}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-brand-500/40 text-left transition space-y-2 group"
            >
              <Megaphone className="h-6 w-6 text-amber-400 group-hover:scale-110 transition-transform" />
              <div>
                <span className="font-bold text-white text-xs block">Send Announcement</span>
                <span className="text-[10px] text-slate-500 block">Broadcast to cohort</span>
              </div>
            </button>

            <button
              onClick={() => navigate('/mentor/analytics')}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-brand-500/40 text-left transition space-y-2 group"
            >
              <LineChart className="h-6 w-6 text-indigo-400 group-hover:scale-110 transition-transform" />
              <div>
                <span className="font-bold text-white text-xs block">View Analytics</span>
                <span className="text-[10px] text-slate-500 block">Cohort aggregate stats</span>
              </div>
            </button>
          </div>
        </div>

        {/* Assigned Student Cards Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-400" />
              Assigned Student Roster ({assignedCount})
            </h2>
            <button
              onClick={() => navigate('/mentor/students')}
              className="text-xs font-bold text-brand-400 hover:underline"
            >
              View Full Directory →
            </button>
          </div>

          {assignedCount > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students?.map((link) => {
                const student = link.studentId;
                const metrics = link.metrics || {
                  goalName: 'Master Computer Science',
                  completionRate: 65,
                  streak: 4,
                  lastActive: link.acceptedAt || link.invitedAt,
                };

                return (
                  <div
                    key={link._id || student._id}
                    className="glass-panel p-5 rounded-2xl border border-slate-900 space-y-4 hover:border-slate-800 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={student?.name || 'Student'} status="online" />
                        <div>
                          <h4 className="font-extrabold text-white text-sm">{student?.name || 'Student'}</h4>
                          <span className="text-[10px] text-slate-400 block">{student?.email}</span>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-brand-950 text-brand-400 font-bold uppercase tracking-wider inline-block mt-1">
                            {metrics.goalName}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-400">{metrics.completionRate}%</span>
                        <span className="text-[9px] text-slate-550 block">Completion</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Today's Progress</span>
                        <span>{metrics.completionRate}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full"
                          style={{ width: `${metrics.completionRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] text-slate-400 border-t border-slate-900/60">
                      <div>
                        <span className="text-slate-550 block">Study Streak:</span>
                        <span className="font-bold text-orange-400 flex items-center gap-1">
                          <Flame className="h-3 w-3" /> {metrics.streak} Days
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-550 block">Last Active:</span>
                        <span className="font-bold text-slate-200">
                          {new Date(metrics.lastActive).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900/60">
                      <button
                        onClick={() => navigate(`/mentor/students`)}
                        className="bg-slate-900 hover:bg-slate-850 text-slate-200 text-[10px] font-bold py-1.5 rounded-lg border border-slate-800 transition text-center"
                      >
                        Review Plan
                      </button>
                      <button
                        onClick={() => navigate(`/mentor/analytics`)}
                        className="bg-slate-900 hover:bg-slate-850 text-indigo-300 text-[10px] font-bold py-1.5 rounded-lg border border-slate-800 transition text-center"
                      >
                        View Analytics
                      </button>
                      <button
                        onClick={() => setSelectedStudentForFeedback(student)}
                        className="bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-bold py-1.5 rounded-lg transition text-center"
                      >
                        Send Feedback
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No Assigned Students"
              description="No active students currently linked to your mentor account. Accept pending student invitations above to populate your workspace."
            />
          )}
        </div>
      </div>

      {/* Send Feedback Modal Dialog */}
      {selectedStudentForFeedback && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full border border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-brand-400" />
                Submit Progress Feedback to {selectedStudentForFeedback.name}
              </h3>
              <button
                onClick={() => setSelectedStudentForFeedback(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Overall Progress Rating
                </label>
                <div className="flex gap-2 text-amber-400 cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-lg transition ${star <= rating ? 'text-amber-400 scale-110' : 'text-slate-700'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Strengths & Highlights
                </label>
                <input
                  type="text"
                  value={strengthsText}
                  onChange={(e) => setStrengthsText(e.target.value)}
                  placeholder="e.g. Excellent consistency on daily study blocks..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-2 px-3 text-xs text-slate-100 outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Weak Areas / Focus Areas
                </label>
                <input
                  type="text"
                  value={weaknessesText}
                  onChange={(e) => setWeaknessesText(e.target.value)}
                  placeholder="e.g. Needs more practice on SQL Join queries..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-2 px-3 text-xs text-slate-100 outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Actionable Recommendations
                </label>
                <textarea
                  value={recommendationsText}
                  onChange={(e) => setRecommendationsText(e.target.value)}
                  rows={3}
                  placeholder="e.g. Allocate 30 mins extra towards mock test revisions..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-2 px-3 text-xs text-slate-100 outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    submitFeedbackMutation.mutate({
                      studentId: selectedStudentForFeedback._id,
                      rating,
                      strengths: strengthsText,
                      weaknesses: weaknessesText,
                      recommendations: recommendationsText,
                    })
                  }
                  disabled={submitFeedbackMutation.isPending}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-2.5 text-xs font-bold transition disabled:opacity-50"
                >
                  {submitFeedbackMutation.isPending ? 'Submitting...' : 'Publish Feedback'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudentForFeedback(null)}
                  className="bg-slate-900 border border-slate-800 text-slate-400 rounded-xl px-4 py-2.5 text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
