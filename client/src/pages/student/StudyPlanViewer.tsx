import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Sparkles, Calendar, Clock, CheckCircle2, 
  ChevronDown, ChevronUp, AlertCircle, Quote, Lightbulb, 
  Rocket, MoreVertical, Printer, Download, RefreshCw,
  Layers, Target, ShieldCheck, ArrowRight
} from 'lucide-react';
import apiClient from '../../services/api/client';
import PlanErrorBoundary from '../../components/ui/PlanErrorBoundary';
import { normalizeStudyPlan, NormalizedStudyPlan } from '../../utils/normalizeStudyPlan';

function StudyPlanViewerContent() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [showAdvancedDetails, setShowAdvancedDetails] = useState<boolean>(false);

  const activatePlanMutation = useMutation({
    mutationFn: async () => {
      if (planId) {
        await apiClient.post(`/planner/${planId}/activate`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] });
      queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      queryClient.invalidateQueries({ queryKey: ['myPlans'] });
      navigate('/dashboard');
    },
    onError: () => {
      navigate('/dashboard');
    }
  });

  const handleStartLearning = () => {
    activatePlanMutation.mutate();
  };

  // Fetch plan detail & transform through normalization layer
  const { data: plan, isLoading, error, refetch } = useQuery<NormalizedStudyPlan>({
    queryKey: ['plan', planId],
    queryFn: async () => {
      const response = await apiClient.get(`/planner/${planId}`);
      const rawPlan = response.data?.data?.plan;
      return normalizeStudyPlan(rawPlan);
    },
    enabled: !!planId
  });

  // Fetch parent goal name & details
  const { data: goalData } = useQuery({
    queryKey: ['goal', plan?.goalId],
    queryFn: async () => {
      const response = await apiClient.get(`/goals/${plan?.goalId}`);
      return response.data?.data?.goal;
    },
    enabled: !!plan?.goalId
  });

  // Regenerate plan mutation
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/planner/generate', { goalId: plan?.goalId });
      return res.data?.data;
    },
    onSuccess: (data) => {
      if (data?.jobId) {
        navigate(`/planner/job/${data.jobId}`);
      }
    }
  });

  const handlePrint = () => {
    window.print();
    setShowMoreMenu(false);
  };

  const handleExportPDF = () => {
    window.print();
    setShowMoreMenu(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-brand-500"></div>
        <p className="text-sm font-medium">Assembling your custom study plan review...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4 px-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h3 className="text-lg font-bold text-white">Failed to Load Plan</h3>
        <p className="text-sm text-center max-w-sm">The plan could not be fetched or does not exist.</p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => refetch()}
            className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-5 py-2.5 text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-brand-500 text-white rounded-xl px-5 py-2.5 text-xs font-semibold hover:bg-brand-600 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Derive human-readable roadmap & statistics directly from user's target date
  const targetDateObj = goalData?.targetDate ? new Date(goalData.targetDate) : null;
  const remainingDays = targetDateObj 
    ? Math.max(1, Math.ceil((targetDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : (plan.goalAnalysis.suggestedTimelineWeeks || 1) * 7;
  const totalWeeks = Math.max(1, Math.ceil(remainingDays / 7));

  const weeklyHours = Math.round((plan.goalAnalysis.weeklyCommitmentMinutes || 1200) / 60);
  const totalEstimatedHours = weeklyHours * totalWeeks;

  // Derive mock exams formatted nicely
  const mockExamSchedule = plan.quizPlan.quizSchedule.length > 0
    ? plan.quizPlan.quizSchedule.map((quiz, idx) => ({
        title: quiz.examType || (idx === 0 ? 'Diagnostic Quiz' : idx === 1 ? 'Practice Test' : 'Final Mock Exam'),
        weekLabel: `Week ${Math.min(idx + 1, totalWeeks)}`,
        durationMinutes: quiz.durationMinutes || (idx === 0 ? 45 : idx === 1 ? 60 : 90),
        scheduledDate: quiz.scheduledDate && quiz.scheduledDate !== 'TBD' ? quiz.scheduledDate : null
      }))
    : [
        { title: 'Diagnostic Quiz', weekLabel: 'Week 1', durationMinutes: 45, scheduledDate: null },
        { title: 'Practice Test', weekLabel: 'Week 2', durationMinutes: 60, scheduledDate: null },
        { title: 'Final Mock Exam', weekLabel: `Week ${totalWeeks}`, durationMinutes: 90, scheduledDate: null }
      ];

  // Derive Weekly Roadmap Timeline items
  const prioritizedSubjectsList = plan.studyPlan.prioritizedSubjects.length > 0
    ? plan.studyPlan.prioritizedSubjects
    : [{ subjectName: 'Core Computer Science', priority: 1, rationale: 'Primary focus area' }];

  const weeklyRoadmap = Array.from({ length: Math.min(totalWeeks, 6) }).map((_, wIdx) => {
    const weekNum = wIdx + 1;
    const subIndex = wIdx % prioritizedSubjectsList.length;
    const currentSub = prioritizedSubjectsList[subIndex];

    const weeklyTaskMatch = plan.scheduler.weeklyTasks[wIdx];

    return {
      weekNum,
      title: `Week ${weekNum}: ${currentSub?.subjectName || 'Core Concepts'}`,
      focusText: weeklyTaskMatch?.focus || `Master key topics in ${currentSub?.subjectName || 'subject'}`,
      hours: weeklyTaskMatch?.hoursAllocated || weeklyHours,
      topics: [
        `Fundamental concepts in ${currentSub?.subjectName || 'Subject'}`,
        `Practical exercises & problem solving`,
        `Spaced revision review`
      ]
    };
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden print:bg-white print:text-slate-900">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/5 blur-[140px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto space-y-8 z-10 relative">
        
        {/* TOP HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-900 pb-6 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                Plan Successfully Generated
              </span>
            </div>
            <h1 className="text-3xl font-black text-white mt-2 flex items-center gap-2">
              🎉 Your Study Plan is Ready
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Your personalized learning roadmap has been created successfully.
            </p>
          </div>

          <div className="flex items-center gap-3 relative">
            <button
              onClick={handleStartLearning}
              disabled={activatePlanMutation.isPending}
              className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition shadow-lg shadow-brand-500/25 flex items-center gap-2 disabled:opacity-50"
            >
              <Rocket className="h-4 w-4" />
              {activatePlanMutation.isPending ? 'Activating Workspace...' : '🚀 Start Learning'}
            </button>

            {/* More Actions Dropdown (⋮) */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
                title="More Actions"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-30 space-y-1">
                  <button
                    onClick={handlePrint}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center gap-2"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-400" />
                    Print Plan
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center gap-2"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-400" />
                    PDF Export
                  </button>
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      regenerateMutation.mutate();
                    }}
                    disabled={regenerateMutation.isPending}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-brand-400 hover:bg-slate-800 transition flex items-center gap-2 border-t border-slate-800/80 pt-2"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
                    Regenerate Plan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 1: GOAL SUMMARY CARD */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 bg-gradient-to-r from-slate-900/80 to-slate-950 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900/80 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Target className="h-4 w-4 text-brand-400" />
              Goal Summary
            </h2>
            <span className="text-[10px] bg-brand-950/80 text-brand-400 border border-brand-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {goalData?.goalType || 'Skill Target'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-900">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Goal Title</span>
              <span className="text-xs font-extrabold text-white block mt-1 truncate" title={goalData?.title || 'Personal Study Target'}>
                {goalData?.title || 'Personal Study Target'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-900">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Duration</span>
              <span className="text-xs font-extrabold text-white block mt-1">
                {totalWeeks} Weeks
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-900">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Daily Study</span>
              <span className="text-xs font-extrabold text-brand-400 block mt-1">
                {goalData?.dailyStudyHours || Math.round(weeklyHours / 5)} Hours / Day
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-900">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Study Days</span>
              <span className="text-xs font-extrabold text-slate-200 block mt-1">
                {goalData?.weeklyStudyDays ? `${goalData.weeklyStudyDays} Days / Wk` : '5 Days / Wk'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-900">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Break Days</span>
              <span className="text-xs font-extrabold text-emerald-400 block mt-1">
                {plan.scheduler.RestDays.length > 0 ? plan.scheduler.RestDays.join(', ') : 'Sat, Sun'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-900">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Target Completion</span>
              <span className="text-xs font-extrabold text-indigo-300 block mt-1">
                {goalData?.targetDate ? new Date(goalData.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'In 4 Weeks'}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 2: LEARNING ROADMAP (WEEKLY TIMELINE CARDS) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-400" />
              Learning Roadmap
            </h2>
            <span className="text-xs text-slate-500 font-semibold">{totalWeeks}-Week Scheduled Progression</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weeklyRoadmap.map((item) => (
              <div key={item.weekNum} className="glass-panel p-5 rounded-2xl border border-slate-900 space-y-3 relative overflow-hidden group hover:border-slate-800 transition">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-brand-950 text-brand-400 border border-brand-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                    Week {item.weekNum}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-500" />
                    {item.hours} Hours Alloc.
                  </span>
                </div>

                <h3 className="font-extrabold text-white text-sm leading-tight">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.focusText}</p>

                <div className="pt-2 border-t border-slate-900/60 space-y-1">
                  {item.topics.map((t, tIdx) => (
                    <div key={tIdx} className="flex items-center gap-2 text-[11px] text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-400 shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: STUDY SUMMARY (STATISTIC CARDS) */}
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-brand-400" />
            Study Summary & Allocations
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-slate-900 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Sessions</span>
              <p className="text-xl font-extrabold text-white">{plan.scheduler.dailyTasks.length || 24}</p>
              <span className="text-[9px] text-slate-550 block">Daily study blocks</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-900 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Revision Sessions</span>
              <p className="text-xl font-extrabold text-brand-400">{plan.revisionPlan.revisionPlan.length || 6}</p>
              <span className="text-[9px] text-slate-550 block">Spaced reviews</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-900 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Mock Exams</span>
              <p className="text-xl font-extrabold text-emerald-400">{mockExamSchedule.length}</p>
              <span className="text-[9px] text-slate-550 block">Diagnostic quizzes</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-900 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Buffer Days</span>
              <p className="text-xl font-extrabold text-amber-400">2 Days</p>
              <span className="text-[9px] text-slate-550 block">Reserved catch-up</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-900 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Estimated Hours</span>
              <p className="text-xl font-extrabold text-indigo-300">{totalEstimatedHours} Hrs</p>
              <span className="text-[9px] text-slate-550 block">Total commitment</span>
            </div>
          </div>
        </div>

        {/* SECTION 4: MOCK EXAMS PREVIEW */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-brand-400" />
            Scheduled Diagnostic Quizzes & Mock Exams
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {mockExamSchedule.map((exam, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-emerald-400 uppercase">{exam.weekLabel}</span>
                  <span className="text-slate-500">{exam.durationMinutes} mins</span>
                </div>
                <h4 className="font-extrabold text-white text-xs">{exam.title}</h4>
                <p className="text-[10px] text-slate-400">
                  {exam.scheduledDate ? `Scheduled: ${exam.scheduledDate}` : 'Scheduled automatically prior to milestone checks.'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5: AI INSIGHTS (NATURAL LANGUAGE ONLY) */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 bg-gradient-to-r from-brand-950/20 to-slate-950 space-y-4">
          <div className="flex items-center gap-2">
            <Quote className="h-5 w-5 text-brand-400" />
            <h2 className="text-base font-extrabold text-white">AI Strategy Insights</h2>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-850 space-y-3">
            <p className="text-xs text-slate-200 leading-relaxed italic">
              "{plan.motivation.motivationalSummary || plan.studyPlan.rankingRationale || 'Your study roadmap prioritizes core concepts early, building strong foundations before transitioning into spaced revisions and diagnostic practice quizzes.'}"
            </p>

            {plan.motivation.suggestedProductivityTips.length > 0 && (
              <div className="pt-2 border-t border-slate-850 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" /> Recommended Study Practices:
                </span>
                {plan.motivation.suggestedProductivityTips.map((tip, idx) => (
                  <p key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-brand-400 shrink-0">•</span>
                    <span>{tip}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 6: ADVANCED DETAILS (COLLAPSIBLE ACCORDION) */}
        <div className="glass-panel rounded-2xl border border-slate-900 overflow-hidden">
          <button
            onClick={() => setShowAdvancedDetails(!showAdvancedDetails)}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-900/50 transition"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-300">Advanced Details & Technical Allocations</h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>{showAdvancedDetails ? 'Hide Details' : 'Show Details'}</span>
              {showAdvancedDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </button>

          {showAdvancedDetails && (
            <div className="p-6 border-t border-slate-900 space-y-6 bg-slate-950/60 text-xs text-slate-400">
              {/* Subject Weightage */}
              <div className="space-y-3">
                <h4 className="font-bold text-white uppercase text-[10px] tracking-wider">Subject Weightage & Rationale</h4>
                {plan.studyPlan.prioritizedSubjects.map((sub, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-900/40 border border-slate-850 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-200 text-xs block">{sub.subjectName}</span>
                      <span className="text-[10px] text-slate-500">{sub.rationale}</span>
                    </div>
                    <span className="text-xs font-bold text-brand-400">{sub.examWeightage || 'Standard Weight'}</span>
                  </div>
                ))}
              </div>

              {/* Weekly Hours Distribution */}
              <div className="space-y-3 pt-3 border-t border-slate-900">
                <h4 className="font-bold text-white uppercase text-[10px] tracking-wider">Weekly Hours Distribution</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {plan.scheduler.weeklyTasks.map((wt, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-900/40 border border-slate-850 flex justify-between items-center">
                      <span className="text-slate-300">{wt.focus}</span>
                      <span className="font-bold text-brand-400">{wt.hoursAllocated} Hrs</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buffer Allocation */}
              <div className="pt-3 border-t border-slate-900 space-y-2">
                <h4 className="font-bold text-white uppercase text-[10px] tracking-wider">Buffer & Catch-Up Days</h4>
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                  <p className="text-slate-300">
                    🟢 Buffer Days reserved for unfinished tasks or additional practice: <span className="font-bold text-emerald-400">{plan.scheduler.bufferAllocation || 'Saturday afternoon catch-up blocks'}</span>
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div className="pt-3 border-t border-slate-900 flex justify-between text-[10px] text-slate-550">
                <span>Workload Rating: {plan.goalAnalysis.workloadRating || 'Balanced'}</span>
                <span>Plan ID: {planId}</span>
              </div>
            </div>
          )}
        </div>

        {/* MAIN PRIMARY CTA AT BOTTOM */}
        <div className="pt-4 text-center space-y-3">
          <button
            onClick={handleStartLearning}
            disabled={activatePlanMutation.isPending}
            className="w-full sm:w-auto bg-gradient-to-r from-brand-500 via-brand-600 to-emerald-500 hover:from-brand-600 hover:to-emerald-600 text-white font-extrabold text-base px-10 py-4 rounded-2xl transition shadow-2xl shadow-brand-500/30 flex items-center justify-center gap-3 mx-auto disabled:opacity-50"
          >
            <Rocket className="h-5 w-5" />
            {activatePlanMutation.isPending ? 'Activating Workspace...' : '🚀 Start Learning'}
            <ArrowRight className="h-5 w-5" />
          </button>
          <p className="text-slate-500 text-xs">
            Your daily workspace is ready. Click above to view today's study schedule.
          </p>
        </div>

      </div>
    </div>
  );
}

export default function StudyPlanViewer() {
  return (
    <PlanErrorBoundary>
      <StudyPlanViewerContent />
    </PlanErrorBoundary>
  );
}
