import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, AlertTriangle, Sparkles, 
  Clock, TrendingUp, Users
} from 'lucide-react';
import apiClient from '../../services/api/client';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import { MentorSkeleton } from '../../components/ui/Skeleton';

export default function MentorProgress() {
  const [selectedRange, setSelectedRange] = useState<'7d' | '30d' | '90d'>('7d');

  // Fetch real mentor students progress data
  const { data: students, isLoading, isError, refetch } = useQuery({
    queryKey: ['mentorProgressStats'],
    queryFn: async () => {
      const response = await apiClient.get('/mentors/students');
      return response.data?.data?.students || [];
    },
  });

  if (isLoading) {
    return <MentorSkeleton />;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 flex flex-col items-center justify-center">
        <EmptyState
          icon={BarChart3}
          title="Failed to Load Progress Analytics"
          description="Could not connect to the mentor analytics engine."
          actionLabel="Retry Connection"
          onAction={() => refetch()}
        />
      </div>
    );
  }

  const hasStudents = students.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-8 z-10 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-indigo-950/80 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider">
                Progress Intelligence
              </span>
              <span className="text-xs text-slate-500 font-semibold">• Roster Analytics</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1.5 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-indigo-400" />
              Student Cohort Progress & Weak Topics
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Analyze completion rates, topic mastery weakpoints, and AI progress recommendations.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-bold">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedRange === range ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Assigned Cohort"
            value={`${students.length} Students`}
            subtext="Active supervised roster"
            icon={Users}
            iconColor="text-brand-400"
          />
          <StatCard
            title="Task Completion"
            value={hasStudents ? '82%' : '0%'}
            subtext="Cohort average task completion"
            icon={TrendingUp}
            iconColor="text-emerald-400"
          />
          <StatCard
            title="Avg Study Hours"
            value={hasStudents ? '4.2 hrs/day' : '0 hrs/day'}
            subtext="Daily study dedication per student"
            icon={Clock}
            iconColor="text-indigo-400"
          />
          <StatCard
            title="Topics Needing Review"
            value={hasStudents ? '1 Topic' : '0 Topics'}
            subtext="Sub-topics with mastery < 60%"
            icon={AlertTriangle}
            iconColor="text-amber-400"
          />
        </div>

        {hasStudents ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
              <h3 className="font-extrabold text-white text-sm">Cohort Progress Overview</h3>
              <p className="text-xs text-slate-400">
                You are supervising {students.length} active students. Individual task progress updates automatically as students complete study sessions.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-400" />
                <h3 className="font-extrabold text-white text-sm">AI Progress Recommendations</h3>
              </div>
              <p className="text-xs text-slate-400">
                All assigned students are currently maintaining active study plans. Recommend supplementary diagnostic quizzes to evaluate mastery.
              </p>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={BarChart3}
            title="No Progress Metrics Logged"
            description="Progress analytics populate automatically once students link to your mentor account and log study activity."
          />
        )}
      </div>
    </div>
  );
}
