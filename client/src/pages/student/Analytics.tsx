import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';
import { 
  ArrowLeft, Calendar, Clock, Award, Flame, Smile, Target, Sparkles, Loader2 
} from 'lucide-react';
import apiClient from '../../services/api/client';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, 
  Title, Tooltip, Legend, Filler
);

interface CheckIn {
  _id: string;
  date: string;
  plannedStudyHours: number;
  actualStudyHours: number;
  completedTasks: number;
  missedTasks: number;
  skippedTasks: number;
  mood: string;
  focusLevel: number;
  productivityRating: number;
  notes: string;
  aiInsights?: {
    summary: string;
    suggestions: string[];
    motivation: string;
  };
}

interface AnalyticsData {
  checkInsCount: number;
  averages: {
    dailyStudyHours: number;
    focusLevel: number;
    productivityRating: number;
  };
  moodTrends: Record<string, number>;
  rawHistory: CheckIn[];
}

export default function Analytics() {
  const navigate = useNavigate();

  // Fetch check-in history & analytics statistics
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analyticsData'],
    queryFn: async () => {
      const response = await apiClient.get('/check-ins/analytics');
      return response.data.data.analytics as AnalyticsData;
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

  if (isLoading || !analytics) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
        <p className="text-sm">Calculating study statistics & drawing trends...</p>
      </div>
    );
  }

  const history = analytics.rawHistory || [];

  // 1. Data mapping for Study Hours Bar chart
  const hoursLabels = history.map(h => new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  const plannedHoursData = history.map(h => h.plannedStudyHours);
  const actualHoursData = history.map(h => h.actualStudyHours);

  const hoursChartData = {
    labels: hoursLabels.length > 0 ? hoursLabels : ['No Data'],
    datasets: [
      {
        label: 'Planned Hours',
        data: plannedHoursData.length > 0 ? plannedHoursData : [0],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: '#6366f1',
        borderWidth: 1.5,
      },
      {
        label: 'Actual Hours Studied',
        data: actualHoursData.length > 0 ? actualHoursData : [0],
        backgroundColor: 'rgba(16, 185, 129, 0.4)',
        borderColor: '#10b981',
        borderWidth: 1.5,
      }
    ]
  };

  // 2. Data mapping for focus & productivity Line chart
  const focusData = history.map(h => h.focusLevel);
  const productivityData = history.map(h => h.productivityRating);

  const trendsChartData = {
    labels: hoursLabels.length > 0 ? hoursLabels : ['No Data'],
    datasets: [
      {
        label: 'Focus Level',
        data: focusData.length > 0 ? focusData : [0],
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        tension: 0.3,
        borderWidth: 2,
      },
      {
        label: 'Productivity Level',
        data: productivityData.length > 0 ? productivityData : [0],
        borderColor: '#8b5cf6',
        backgroundColor: 'transparent',
        tension: 0.3,
        borderWidth: 2,
      }
    ]
  };

  // Find latest checkin containing AI summary
  const latestCheckinWithAI = [...history].reverse().find(h => h.aiInsights?.summary);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Lights */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-500/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 z-10 relative">
        {/* Header bar */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-3 rounded-xl border border-slate-900 bg-slate-900/40 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Study Analytics Hub</h1>
            <p className="text-slate-400 text-xs mt-1">Review focus timelines, study duration balances, and AI performance reports.</p>
          </div>
        </div>

        {/* Top Widgets grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-panel p-5 rounded-xl border border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Current Streak</span>
            <div className="flex items-center gap-2 mt-2">
              <Flame className="h-6 w-6 text-orange-500" />
              <span className="text-2xl font-extrabold text-white">{streakData?.currentStreak || 0} Days</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Longest Streak</span>
            <div className="flex items-center gap-2 mt-2">
              <Award className="h-6 w-6 text-brand-400" />
              <span className="text-2xl font-extrabold text-white">{streakData?.longestStreak || 0} Days</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Avg Daily Hours</span>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="h-6 w-6 text-emerald-400" />
              <span className="text-2xl font-extrabold text-white">
                {(analytics.averages.dailyStudyHours || 0).toFixed(1)} hrs
              </span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Avg Focus Rating</span>
            <div className="flex items-center gap-2 mt-2">
              <Target className="h-6 w-6 text-amber-500" />
              <span className="text-2xl font-extrabold text-white">
                {(analytics.averages.focusLevel || 0).toFixed(1)} / 5
              </span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Logs Count</span>
            <div className="flex items-center gap-2 mt-2">
              <Calendar className="h-6 w-6 text-indigo-400" />
              <span className="text-2xl font-extrabold text-white">{analytics.checkInsCount} Days</span>
            </div>
          </div>
        </div>

        {/* AI observations row */}
        {latestCheckinWithAI?.aiInsights && (
          <div className="glass-panel p-6 rounded-2xl border border-brand-500/20 bg-brand-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-brand-300">Latest AI Learning Insights</span>
              </div>
              <p className="text-sm italic text-slate-200 mt-1">"{latestCheckinWithAI.aiInsights.summary}"</p>
            </div>
            {latestCheckinWithAI.aiInsights.motivation && (
              <span className="text-xs font-bold text-brand-400 uppercase tracking-widest bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-800 shrink-0">
                {latestCheckinWithAI.aiInsights.motivation}
              </span>
            )}
          </div>
        )}

        {/* Charts and mood trends grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Study hours chart */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-900">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-white">Study Hours Distribution</h3>
                <span className="text-[10px] text-slate-500 block">Planned vs actual hours per day</span>
              </div>
            </div>
            <div className="h-[280px]">
              <Bar 
                data={hoursChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b' } },
                    x: { grid: { display: false }, ticks: { color: '#64748b' } }
                  },
                  plugins: { legend: { display: false } }
                }} 
              />
            </div>
          </div>

          {/* Focus & Productivity line graph */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-900">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-white">Focus & Productivity Timelines</h3>
                <span className="text-[10px] text-slate-500 block">Metrics level fluctuations (1-5 range)</span>
              </div>
            </div>
            <div className="h-[280px]">
              <Line 
                data={trendsChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b' } },
                    x: { grid: { display: false }, ticks: { color: '#64748b' } }
                  },
                  plugins: { legend: { display: false } }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Mood distributions & recent logs checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mood breakdown */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-900">
            <h3 className="text-sm font-bold text-white mb-4">Mood Frequency Breakdown</h3>
            <div className="space-y-3">
              {['Excellent', 'Good', 'Neutral', 'Stressed', 'Burnout'].map((m) => {
                const count = analytics.moodTrends[m] || 0;
                const percent = analytics.checkInsCount > 0 ? (count / analytics.checkInsCount) * 100 : 0;

                return (
                  <div key={m} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Smile className="h-4 w-4 text-brand-400" />
                        {m}
                      </span>
                      <span className="text-slate-500">{count} days ({Math.round(percent)}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-500 rounded-full" 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent logs */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-900">
            <h3 className="text-sm font-bold text-white mb-4">Recent Daily Logs Checklist</h3>
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
              {history.map((check) => (
                <div key={check._id} className="bg-slate-900/20 p-3.5 rounded-xl border border-slate-900 text-xs flex justify-between items-center gap-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">
                      {new Date(check.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </h4>
                    <p className="text-[10px] text-slate-500">Notes: {check.notes || 'None logged'}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 font-semibold">
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Focus</span>
                      <span className="text-amber-500">{check.focusLevel}/5</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Hours</span>
                      <span className="text-emerald-400">{check.actualStudyHours} hrs</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
