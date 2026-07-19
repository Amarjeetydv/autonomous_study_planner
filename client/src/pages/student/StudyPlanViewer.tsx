import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Printer, Download, RefreshCw, LayoutDashboard, Calendar, Clock, Award, CheckCircle, 
  ChevronDown, ChevronUp, AlertCircle, Quote, Lightbulb, TrendingUp, Sparkles, Loader2
} from 'lucide-react';
import apiClient from '../../services/api/client';

interface AIPlan {
  id: string;
  goalId: string;
  studentId: string;
  status: string;
  promptVersion: string;
  goalAnalysis: {
    workloadRating?: string;
    weeklyCommitmentMinutes?: number;
    riskFactors?: string[];
    suggestedTimelineWeeks?: number;
    weakAreas?: string[];
  };
  studyPlan: {
    prioritizedSubjects?: {
      subjectId: string;
      subjectName: string;
      priority: number;
      examWeightage: string;
      rationale: string;
    }[];
    subjectWeightages?: Record<string, string>;
    rankingRationale?: string;
  };
  scheduler: {
    dailyTasks?: { task: string; duration: string; type: string }[];
    weeklyTasks?: { focus: string; hoursAllocated: number }[];
    monthlyTasks?: { milestone: string; targetWeek: number }[];
    bufferAllocation?: string;
    RestDays?: string[];
  };
  revisionPlan?: {
    revisionPlan?: { topic: string; reviewIntervalDays: number; date: string }[];
    spacedRepetitionIntervals?: Record<string, number>;
    logic?: string;
  };
  quizPlan?: {
    quizPlan?: { type: string; topic: string; targetDate: string }[];
    quizSchedule?: { examType: string; scheduledDate: string; durationMinutes: number }[];
  };
  motivation?: {
    motivationalSummary?: string;
    suggestedProductivityTips?: string[];
  };
}

export default function StudyPlanViewer() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  // Accordion Section States
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    overview: true,
    priorities: true,
    schedules: true,
    revision: true,
    mockTests: true,
    motivation: true
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Fetch plan detail
  const { data: plan, isLoading, error } = useQuery({
    queryKey: ['plan', planId],
    queryFn: async () => {
      const response = await apiClient.get(`/planner/${planId}`);
      return response.data.data.plan as AIPlan;
    },
    enabled: !!planId
  });

  // Fetch parent goal name
  const { data: goalData } = useQuery({
    queryKey: ['goal', plan?.goalId],
    queryFn: async () => {
      const response = await apiClient.get(`/goals/${plan?.goalId}`);
      return response.data.data.goal;
    },
    enabled: !!plan?.goalId
  });

  // Regenerate plan mutation
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/planner/generate', { goalId: plan?.goalId });
      return res.data.data;
    },
    onSuccess: (data) => {
      navigate(`/planner/job/${data.jobId}`);
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // Standard PDF print fallback trigger
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
        <p className="text-sm">Loading study plan details...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4 px-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h3 className="text-lg font-bold text-white">Failed to Load Plan</h3>
        <p className="text-sm text-center max-w-sm">The plan could not be fetched or does not exist.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-brand-500 text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-brand-600 transition"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 print:bg-white print:text-slate-900 print:py-0 print:px-0">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Controls Header (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-6 print:hidden">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-brand-400" />
              AI Structured Plan
            </h1>
            <p className="text-slate-400 text-xs mt-1">Generated specifically for: <span className="text-slate-200 font-medium">{goalData?.title || 'Loading goal...'}</span></p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold hover:bg-slate-800 transition"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold hover:bg-slate-800 transition"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold hover:bg-slate-800 transition"
            >
              <Download className="h-4 w-4" />
              PDF Export
            </button>
            <button
              onClick={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending}
              className="flex items-center gap-2 bg-brand-500 text-white rounded-xl px-4 py-2.5 text-xs font-semibold hover:bg-brand-600 transition disabled:opacity-50"
            >
              {regenerateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </>
              )}
            </button>
          </div>
        </div>

        {/* 1. OVERVIEW ACCORDION */}
        <div className="glass-panel rounded-2xl border border-slate-900 overflow-hidden print:border-none print:shadow-none">
          <button
            onClick={() => toggleSection('overview')}
            className="w-full flex items-center justify-between p-6 text-left border-b border-slate-900 print:border-none print:p-0"
          >
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-brand-400" />
              <h2 className="text-lg font-bold text-white print:text-slate-900">Study Overview & Workload</h2>
            </div>
            <div className="print:hidden">
              {openSections.overview ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
            </div>
          </button>
          
          {openSections.overview && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 print:p-0 print:pt-4">
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/40 print:bg-slate-100 print:border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Estimated Workload</span>
                <p className="text-xl font-extrabold text-white mt-1 print:text-slate-900">{plan.goalAnalysis?.workloadRating || 'Medium'}</p>
                <span className="text-xs text-slate-500 block mt-1">Based on target timelines.</span>
              </div>
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/40 print:bg-slate-100 print:border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Weekly Commitment</span>
                <p className="text-xl font-extrabold text-white mt-1 print:text-slate-900">
                  {plan.goalAnalysis?.weeklyCommitmentMinutes ? Math.round(plan.goalAnalysis.weeklyCommitmentMinutes / 60) : (goalData?.dailyStudyHours * goalData?.weeklyStudyDays || 15)} Hours
                </p>
                <span className="text-xs text-slate-500 block mt-1">Hours expected per week.</span>
              </div>
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/40 print:bg-slate-100 print:border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Target Period</span>
                <p className="text-xl font-extrabold text-white mt-1 print:text-slate-900">{plan.goalAnalysis?.suggestedTimelineWeeks || 12} Weeks</p>
                <span className="text-xs text-slate-500 block mt-1">Estimated duration weeks.</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. SUBJECT PRIORITIES ACCORDION */}
        <div className="glass-panel rounded-2xl border border-slate-900 overflow-hidden print:border-none print:shadow-none">
          <button
            onClick={() => toggleSection('priorities')}
            className="w-full flex items-center justify-between p-6 text-left border-b border-slate-900 print:border-none print:p-0"
          >
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-brand-400" />
              <h2 className="text-lg font-bold text-white print:text-slate-900">Subject Prioritization & Weightage</h2>
            </div>
            <div className="print:hidden">
              {openSections.priorities ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
            </div>
          </button>
          
          {openSections.priorities && (
            <div className="p-6 space-y-4 print:p-0 print:pt-4">
              {plan.studyPlan?.rankingRationale && (
                <p className="text-xs text-slate-400 italic mb-4 print:text-slate-700">"{plan.studyPlan.rankingRationale}"</p>
              )}
              <div className="space-y-3">
                {plan.studyPlan?.prioritizedSubjects?.map((sub, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row justify-between bg-slate-900/30 p-4 rounded-xl border border-slate-800/60 items-start md:items-center gap-2 print:bg-white print:border-slate-200">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded bg-slate-950 border border-slate-800 text-xs font-bold flex items-center justify-center text-slate-400 print:bg-slate-100 print:border-slate-200 print:text-slate-900">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white print:text-slate-900">{sub.subjectName}</h4>
                        <span className="text-[10px] text-slate-500">Exam Weight: {sub.examWeightage || 'N/A'}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 md:max-w-md print:text-slate-700">{sub.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. SCHEDULES ACCORDION */}
        <div className="glass-panel rounded-2xl border border-slate-900 overflow-hidden print:border-none print:shadow-none">
          <button
            onClick={() => toggleSection('schedules')}
            className="w-full flex items-center justify-between p-6 text-left border-b border-slate-900 print:border-none print:p-0"
          >
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-brand-400" />
              <h2 className="text-lg font-bold text-white print:text-slate-900">Study Calendars & Blocks</h2>
            </div>
            <div className="print:hidden">
              {openSections.schedules ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
            </div>
          </button>
          
          {openSections.schedules && (
            <div className="p-6 space-y-6 print:p-0 print:pt-4">
              {/* Daily tasks */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Daily Layout Study Block</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {plan.scheduler?.dailyTasks?.map((dt, idx) => (
                    <div key={idx} className="bg-slate-900/30 p-3 rounded-lg border border-slate-800/40 print:bg-slate-50 print:border-slate-200">
                      <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">{dt.duration}</span>
                      <p className="text-sm font-bold text-white mt-1 print:text-slate-900">{dt.task}</p>
                      <span className="text-[10px] text-slate-500 uppercase">{dt.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly focus */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-900">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Weekly Hours Distribution</h3>
                  <div className="space-y-2">
                    {plan.scheduler?.weeklyTasks?.map((wt, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-900/10 p-3 rounded-lg border border-slate-900 print:bg-white print:border-slate-200">
                        <span className="text-xs font-semibold text-slate-300 print:text-slate-900">{wt.focus}</span>
                        <span className="text-xs font-bold text-brand-400">{wt.hoursAllocated} hrs</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Monthly Roadmap Milestones</h3>
                  <div className="space-y-2">
                    {plan.scheduler?.monthlyTasks?.map((mt, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-900/10 p-3 rounded-lg border border-slate-900 print:bg-white print:border-slate-200">
                        <span className="text-xs font-semibold text-slate-300 print:text-slate-900">{mt.milestone}</span>
                        <span className="text-xs font-bold text-brand-400">Week {mt.targetWeek}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rest days & buffer */}
              {(plan.scheduler?.RestDays || plan.scheduler?.bufferAllocation) && (
                <div className="pt-4 border-t border-slate-900 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {plan.scheduler.RestDays && plan.scheduler.RestDays.length > 0 && (
                    <div>
                      <span className="text-slate-500 font-bold block">Weekly Rest Days:</span>
                      <span className="text-slate-300 print:text-slate-900">{plan.scheduler.RestDays.join(', ')}</span>
                    </div>
                  )}
                  {plan.scheduler.bufferAllocation && (
                    <div>
                      <span className="text-slate-500 font-bold block">Buffer Allocation Logic:</span>
                      <span className="text-slate-300 print:text-slate-900">{plan.scheduler.bufferAllocation}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. REVISION ACCORDION */}
        <div className="glass-panel rounded-2xl border border-slate-900 overflow-hidden print:border-none print:shadow-none">
          <button
            onClick={() => toggleSection('revision')}
            className="w-full flex items-center justify-between p-6 text-left border-b border-slate-900 print:border-none print:p-0"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-brand-400" />
              <h2 className="text-lg font-bold text-white print:text-slate-900">Spaced Revision Schedule</h2>
            </div>
            <div className="print:hidden">
              {openSections.revision ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
            </div>
          </button>
          
          {openSections.revision && (
            <div className="p-6 space-y-4 print:p-0 print:pt-4">
              {plan.revisionPlan?.logic && (
                <p className="text-xs text-slate-400 italic mb-3 print:text-slate-700">"{plan.revisionPlan.logic}"</p>
              )}
              <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                {plan.revisionPlan?.revisionPlan?.map((rev, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-900/30 p-3 rounded-lg border border-slate-800/40 print:bg-white print:border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-brand-400">Review Interval: {rev.reviewIntervalDays} Days</span>
                      <h4 className="text-xs font-bold text-white print:text-slate-900 mt-0.5">{rev.topic}</h4>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">{rev.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. MOCK TESTS ACCORDION */}
        <div className="glass-panel rounded-2xl border border-slate-900 overflow-hidden print:border-none print:shadow-none">
          <button
            onClick={() => toggleSection('mockTests')}
            className="w-full flex items-center justify-between p-6 text-left border-b border-slate-900 print:border-none print:p-0"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-brand-400" />
              <h2 className="text-lg font-bold text-white print:text-slate-900">Mock Exams & Quizzes Schedule</h2>
            </div>
            <div className="print:hidden">
              {openSections.mockTests ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
            </div>
          </button>
          
          {openSections.mockTests && (
            <div className="p-6 space-y-4 print:p-0 print:pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {plan.quizPlan?.quizSchedule?.map((quiz, idx) => (
                  <div key={idx} className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/40 print:bg-slate-50 print:border-slate-200">
                    <span className="text-[9px] uppercase font-bold text-emerald-400">Mock Diagnostic Exam</span>
                    <h4 className="text-sm font-bold text-white mt-1 print:text-slate-900">{quiz.examType}</h4>
                    <div className="flex justify-between items-center text-xs text-slate-500 mt-2 border-t border-slate-850 pt-2">
                      <span>Date: {quiz.scheduledDate}</span>
                      <span>Duration: {quiz.durationMinutes} Mins</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 6. MOTIVATION ACCORDION */}
        {plan.motivation && (
          <div className="glass-panel rounded-2xl border border-slate-900 overflow-hidden print:border-none print:shadow-none">
            <button
              onClick={() => toggleSection('motivation')}
              className="w-full flex items-center justify-between p-6 text-left border-b border-slate-900 print:border-none print:p-0"
            >
              <div className="flex items-center gap-3">
                <Quote className="h-5 w-5 text-brand-400" />
                <h2 className="text-lg font-bold text-white print:text-slate-900">Motivation & Study Tips</h2>
              </div>
              <div className="print:hidden">
                {openSections.motivation ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
              </div>
            </button>
            
            {openSections.motivation && (
              <div className="p-6 space-y-6 print:p-0 print:pt-4">
                {plan.motivation.motivationalSummary && (
                  <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/40 relative print:bg-slate-50">
                    <Quote className="h-8 w-8 text-brand-500/10 absolute top-2 left-2" />
                    <p className="text-sm italic text-slate-300 relative z-10 pl-6 print:text-slate-700">
                      "{plan.motivation.motivationalSummary}"
                    </p>
                  </div>
                )}

                {plan.motivation.suggestedProductivityTips && plan.motivation.suggestedProductivityTips.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Lightbulb className="h-4 w-4 text-amber-400" />
                      Suggested Productivity Tips
                    </h4>
                    <ul className="space-y-2">
                      {plan.motivation.suggestedProductivityTips.map((tip, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 print:text-slate-700">
                          <span className="text-brand-400 shrink-0 mt-0.5">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
