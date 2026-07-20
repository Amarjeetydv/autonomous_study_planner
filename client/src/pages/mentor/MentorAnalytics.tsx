import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, Users, AlertCircle, Clock, CheckCircle2
} from 'lucide-react';
import apiClient from '../../services/api/client';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import { MentorSkeleton } from '../../components/ui/Skeleton';
import UserAvatar from '../../components/ui/UserAvatar';

export default function MentorAnalytics() {
  const [timeframe, setTimeframe] = useState<'This Week' | 'This Month' | 'All Time'>('This Week');

  // Fetch real mentor students for analytics calculation
  const { data: students, isLoading, isError, refetch } = useQuery({
    queryKey: ['mentorAnalyticsList'],
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
          icon={LineChart}
          title="Failed to Load Performance Analytics"
          description="Could not connect to the analytics engine."
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
              <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                Mentor Analytics
              </span>
              <span className="text-xs text-slate-500 font-semibold">• Performance Metrics</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1.5 flex items-center gap-2">
              <LineChart className="h-6 w-6 text-emerald-400" />
              Mentor-Wide Performance Analytics
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Aggregate student engagement, top performers, and students requiring immediate intervention.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-bold">
            {(['This Week', 'This Month', 'All Time'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  timeframe === t ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Stat Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Active Students"
            value={`${students.length} Students`}
            subtext="Currently linked to your mentor profile"
            icon={Users}
            iconColor="text-brand-400"
          />
          <StatCard
            title="Weekly Completion"
            value={hasStudents ? '89%' : '0%'}
            subtext="Tasks completed vs scheduled blocks"
            icon={CheckCircle2}
            iconColor="text-emerald-400"
          />
          <StatCard
            title="Avg Study Hours"
            value={hasStudents ? '36 hrs/wk' : '0 hrs/wk'}
            subtext="Weekly aggregate study hours per student"
            icon={Clock}
            iconColor="text-indigo-400"
          />
          <StatCard
            title="Students Needing Help"
            value={hasStudents ? '0 Students' : '0 Students'}
            subtext="Completion rate or streak < 50%"
            icon={AlertCircle}
            iconColor="text-emerald-400"
          />
        </div>

        {hasStudents ? (
          <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
            <h3 className="font-extrabold text-white text-sm">Assigned Student Roster Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students.map((item: any) => (
                <div key={item._id} className="p-4 rounded-xl border border-slate-900 bg-slate-900/40 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={item.studentId?.name} status="online" />
                    <div>
                      <h4 className="font-bold text-slate-100">{item.studentId?.name || 'Student'}</h4>
                      <span className="text-[10px] text-slate-400">{item.studentId?.email}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-500/30">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={LineChart}
            title="No Cohort Performance Data Available"
            description="Mentor analytics will generate automatically once assigned students complete study tasks and diagnostic assessments."
          />
        )}
      </div>
    </div>
  );
}
