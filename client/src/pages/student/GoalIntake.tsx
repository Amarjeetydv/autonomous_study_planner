import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ArrowLeft, ArrowRight, Check, Loader2, AlertCircle, AlertTriangle, Sparkles, Bot, CheckCircle2, Edit2
} from 'lucide-react';
import apiClient from '../../services/api/client';
import { toast } from '../../services/toast';
import { parseGoalInput } from '../../services/ai/goalParser';

interface Subject {
  id: string;
  name: string;
  code: string;
  category: string;
  difficulty: string;
  color: string;
}

const EXAM_TYPES = [
  { value: 'GATE', label: 'GATE (Engineering)' },
  { value: 'CAT', label: 'CAT (Management)' },
  { value: 'UPSC', label: 'UPSC (Civil Services)' },
  { value: 'PLACEMENT', label: 'Campus Placements' },
  { value: 'SEMESTER_EXAM', label: 'Semester Exams' },
  { value: 'SKILL_LEARNING', label: 'Skill Acquisition' },
  { value: 'CUSTOM', label: 'Custom Study Goal' }
];

const PREFERRED_TIMES = ['Morning', 'Afternoon', 'Evening', 'Night', 'Flexible'];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FULL_DAYS_MAP: { [key: string]: string } = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday'
};

export default function GoalIntake() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [manualSubjectOverride, setManualSubjectOverride] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [goalType, setGoalType] = useState('GATE');
  const [targetDate, setTargetDate] = useState('');
  const [dailyStudyHours, setDailyStudyHours] = useState(2);
  const [weeklyStudyDays, setWeeklyStudyDays] = useState(5);
  const [preferredStudyTime, setPreferredStudyTime] = useState('Evening');
  const [preferredSessionLengthMinutes, setPreferredSessionLengthMinutes] = useState(60);
  const [domain, setDomain] = useState('Computer Science');
  const [topic, setTopic] = useState('');
  const [studyDays, setStudyDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [breakDays, setBreakDays] = useState<string[]>(['Saturday', 'Sunday']);
  const [strongSubjects, setStrongSubjects] = useState<string[]>([]);
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [prioritySubjects, setPrioritySubjects] = useState<string[]>([]);
  const [difficultyPreference, setDifficultyPreference] = useState('Intermediate');
  const [learningStyle, setLearningStyle] = useState('Mixed');
  const [motivation, setMotivation] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');

  // Fetch available subjects
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await apiClient.get('/subjects?limit=100');
      return response.data.data.items as Subject[];
    }
  });

  // Dynamic AI Detection for Goal Title
  const detection = useMemo(() => {
    return parseGoalInput(title, subjectsData || []);
  }, [title, subjectsData]);

  // Sync detection results to domain & topic states unless overridden
  useEffect(() => {
    if (detection.subject && !manualSubjectOverride) {
      setDomain(detection.subject);
    }
    if (detection.topic && !manualSubjectOverride) {
      setTopic(detection.topic);
    }
    if (detection.suggestedTargetDate && !targetDate) {
      setTargetDate(detection.suggestedTargetDate);
    }
  }, [detection, manualSubjectOverride]);

  // Check for draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('asp_goal_intake_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.title) {
          setShowDraftModal(true);
        }
      } catch (err) {
        // Invalid draft
      }
    }
  }, []);

  // Save draft whenever state changes
  useEffect(() => {
    const state = {
      title, goalType, targetDate, dailyStudyHours, weeklyStudyDays,
      preferredStudyTime, preferredSessionLengthMinutes, domain, topic,
      studyDays, breakDays, strongSubjects, weakSubjects, prioritySubjects,
      difficultyPreference, learningStyle, motivation, timezone
    };
    localStorage.setItem('asp_goal_intake_draft', JSON.stringify(state));
  }, [
    title, goalType, targetDate, dailyStudyHours, weeklyStudyDays,
    preferredStudyTime, preferredSessionLengthMinutes, domain, topic,
    studyDays, breakDays, strongSubjects, weakSubjects, prioritySubjects,
    difficultyPreference, learningStyle, motivation, timezone
  ]);

  const loadDraft = () => {
    const draft = localStorage.getItem('asp_goal_intake_draft');
    if (draft) {
      try {
        const d = JSON.parse(draft);
        setTitle(d.title || '');
        setGoalType(d.goalType || 'GATE');
        setTargetDate(d.targetDate || '');
        setDailyStudyHours(d.dailyStudyHours ?? 2);
        setWeeklyStudyDays(d.weeklyStudyDays ?? 5);
        setPreferredStudyTime(d.preferredStudyTime || 'Evening');
        setPreferredSessionLengthMinutes(d.preferredSessionLengthMinutes ?? 60);
        setDomain(d.domain || 'Computer Science');
        setTopic(d.topic || '');
        setStudyDays(d.studyDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
        setBreakDays(d.breakDays || ['Saturday', 'Sunday']);
        setStrongSubjects(d.strongSubjects || []);
        setWeakSubjects(d.weakSubjects || []);
        setPrioritySubjects(d.prioritySubjects || []);
        setDifficultyPreference(d.difficultyPreference || 'Intermediate');
        setLearningStyle(d.learningStyle || 'Mixed');
        setMotivation(d.motivation || '');
        setTimezone(d.timezone || 'UTC');
      } catch (err) {
        // Corrupted draft
      }
    }
    setShowDraftModal(false);
  };

  const discardDraft = () => {
    localStorage.removeItem('asp_goal_intake_draft');
    setShowDraftModal(false);
  };

  // Replace Goal Conflict Modal State
  const [existingGoalConflict, setExistingGoalConflict] = useState<{
    goalId: string;
    title: string;
    category: string;
  } | null>(null);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [isArchivingGoal, setIsArchivingGoal] = useState(false);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      toast.info('Generating AI Study Plan...', '🤖 AI Agents Activated');
      const res = await apiClient.post('/goals', payload);
      const goal = res.data.data.goal;
      const goalId = goal.id || goal._id;

      const genRes = await apiClient.post('/planner/generate', { goalId });
      return genRes.data.data;
    },
    retry: false,
    onSuccess: (data) => {
      localStorage.removeItem('asp_goal_intake_draft');
      toast.success('Study Goal Created! Launching Multi-Agent Pipeline...', '🎉 Goal Created');
      navigate(`/planner/job/${data.jobId}`);
    },
    onError: (err: any) => {
      if (err.response?.status === 409 || err.response?.data?.code === 'ACTIVE_GOAL_EXISTS') {
        const conflictData = err.response?.data?.data || {};
        setExistingGoalConflict({
          goalId: conflictData.goalId || '',
          title: conflictData.title || 'Active Study Plan',
          category: conflictData.category || goalType,
        });
        return;
      }
      const msg = err.response?.data?.message || 'Failed to submit study goal. Please try again.';
      setFormError(msg);
      toast.error(msg, 'Generation Error');
    }
  });

  const handleContinueExistingPlan = async () => {
    if (!existingGoalConflict?.goalId) {
      navigate('/dashboard');
      return;
    }
    try {
      const res = await apiClient.get(`/planner?goalId=${existingGoalConflict.goalId}&limit=1`);
      const plans = res.data?.data?.items || res.data?.items || [];
      if (plans.length > 0) {
        navigate(`/planner/${plans[0].id || plans[0]._id}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      navigate('/dashboard');
    }
  };

  const handleConfirmReplaceAndSubmit = async () => {
    if (!existingGoalConflict?.goalId) return;
    setIsArchivingGoal(true);
    try {
      await apiClient.put(`/goals/${existingGoalConflict.goalId}/archive`);
      toast.info('Archived previous active plan.', 'Goal Replaced');
      setExistingGoalConflict(null);
      setShowReplaceConfirm(false);
      handleSubmit();
    } catch (err: any) {
      toast.error('Failed to archive existing plan. Please try again.', 'Archive Error');
    } finally {
      setIsArchivingGoal(false);
    }
  };

  const handleNext = () => {
    setFormError('');
    if (step === 1) {
      if (!title.trim()) {
        setFormError('Please enter a goal title.');
        return;
      }
      if (!targetDate) {
        setFormError('Please select a target date.');
        return;
      }
      const selectedDate = new Date(targetDate);
      if (selectedDate.getTime() <= Date.now()) {
        setFormError('Target date must be in the future.');
        return;
      }
      if (!domain.trim()) {
        setFormError('Please enter a learning domain.');
        return;
      }
      if (!topic.trim()) {
        setFormError('Please enter a learning topic.');
        return;
      }

      setStep(2);
      return;
    }
    if (step === 2) {
      if (dailyStudyHours <= 0 || dailyStudyHours > 24) {
        setFormError('Daily study hours must be between 1 and 24.');
        return;
      }
      if (studyDays.length === 0) {
        setFormError('Please select at least one study day.');
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setFormError('');
    setStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    if (submitMutation.isPending) return;
    setFormError('');
    if (!domain.trim()) {
      setFormError('Please enter a learning domain.');
      return;
    }

    const payload = {
      title,
      goalType,
      targetDate,
      currentLevel: 'Intermediate',
      dailyStudyHours: Number(dailyStudyHours),
      weeklyStudyDays: Number(weeklyStudyDays),
      preferredStudyTime,
      preferredSessionLengthMinutes: Number(preferredSessionLengthMinutes),
      selectedSubjects: [domain.trim()],
      strongSubjects,
      weakSubjects,
      prioritySubjects,
      difficultyPreference,
      learningStyle,
      breakDays,
      motivation,
      timezone,
      language: 'en'
    };

    submitMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold mb-4">
          <Bot className="h-4 w-4" />
          Intelligent AI Planner
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Set Your Goal
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Describe what you want to master. Notion AI builds the schedule.
        </p>
      </div>

      {/* Wizard Panel */}
      <div className="max-w-2xl mx-auto w-full z-10 glass-panel rounded-2xl p-8 border border-slate-800 shadow-2xl flex-1 flex flex-col justify-between">
        <div>
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <span>Step {step} of 3</span>
              <span>{Math.round((step / 3) * 100)}% Complete</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-500 transition-all duration-300 rounded-full" 
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {formError && (
            <div className="mb-6 rounded-xl bg-red-950/40 border border-red-500/30 p-4 text-sm text-red-400 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* STEP 1: Conversational Intake */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">1. What are you studying for?</h2>
                <p className="text-xs text-slate-400">Enter a topic or exam goal, and Notion AI will extract details.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Study Goal Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 px-4 text-sm text-slate-100 outline-none transition focus:border-brand-500 focus:bg-slate-900"
                  placeholder="e.g. Master permutation in aptitude, Learn React Hooks, Master DBMS"
                />
              </div>

              {/* Dynamic AI Detection Feedback Card */}
              {title.trim().length > 3 && !manualSubjectOverride && (detection.subject || detection.topic) && (
                <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-brand-400 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
                          We recognized your learning topic
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                          Auto Inferred
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white mt-1">
                        Domain: <strong className="text-brand-300">{domain}</strong>
                        {topic && ` | Topic: ${topic}`}
                      </p>
                      {detection.duration && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Suggested duration: <strong className="text-emerald-400">{detection.duration} Days</strong>
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setManualSubjectOverride(true)}
                    className="text-xs text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                </div>
              )}

              {/* Manual Subject inputs (shown when override is active or confidence is low) */}
              {(manualSubjectOverride || (!detection.subject && title.trim().length > 3)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-900/20 border border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Learning Domain
                    </label>
                    <input
                      type="text"
                      required
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="e.g. Aptitude, Web Development, CS"
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-slate-100 outline-none transition focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Learning Topic
                    </label>
                    <input
                      type="text"
                      required
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Permutation & Combination, React Hooks"
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-sm text-slate-100 outline-none transition focus:border-brand-500"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Prep Category
                  </label>
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 px-4 text-sm text-slate-100 outline-none transition focus:border-brand-500 focus:bg-slate-900"
                  >
                    {EXAM_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 px-4 text-sm text-slate-100 outline-none transition focus:border-brand-500 focus:bg-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Dedicated Study Schedule Preferences */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">2. Your Schedule Preference</h2>
                <p className="text-xs text-slate-400">Configure how much time you dedicate each session.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Daily Study Hours (1-24)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    required
                    value={dailyStudyHours}
                    onChange={(e) => setDailyStudyHours(Number(e.target.value))}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 px-4 text-sm text-slate-100 outline-none transition focus:border-brand-500 focus:bg-slate-900"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Study Days
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {DAYS_OF_WEEK.map((day) => {
                        const isSelected = studyDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              let nextStudyDays = [...studyDays];
                              if (isSelected) {
                                if (studyDays.length > 1) {
                                  nextStudyDays = studyDays.filter(d => d !== day);
                                }
                              } else {
                                nextStudyDays = [...studyDays, day];
                              }
                              setStudyDays(nextStudyDays);
                              setWeeklyStudyDays(nextStudyDays.length);
                              setBreakDays(DAYS_OF_WEEK.filter(d => !nextStudyDays.includes(d)).map(d => FULL_DAYS_MAP[d]));
                            }}
                            className={`w-9 h-9 rounded-xl text-xs font-bold transition border flex items-center justify-center ${
                              isSelected 
                                ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/25' 
                                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Break Days
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {DAYS_OF_WEEK.map((day) => {
                        const isBreak = !studyDays.includes(day);
                        return (
                          <div
                            key={day}
                            className={`w-9 h-9 rounded-xl text-xs font-bold border transition flex items-center justify-center ${
                              isBreak 
                                ? 'bg-slate-900/80 border-slate-700 text-emerald-400' 
                                : 'bg-slate-950/20 border-slate-900 text-slate-600 pointer-events-none'
                            }`}
                          >
                            {day}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Preferred Time Window
                  </label>
                  <select
                    value={preferredStudyTime}
                    onChange={(e) => setPreferredStudyTime(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 px-4 text-sm text-slate-100 outline-none transition focus:border-brand-500 focus:bg-slate-900"
                  >
                    {PREFERRED_TIMES.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Preferred Session Length (Minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    required
                    value={preferredSessionLengthMinutes}
                    onChange={(e) => setPreferredSessionLengthMinutes(Number(e.target.value))}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 px-4 text-sm text-slate-100 outline-none transition focus:border-brand-500 focus:bg-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: summary, dynamic subject overrides, and launch */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">Ready to Generate Your Study Plan</h2>

              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-5">
                <div className="border-b border-slate-800/80 pb-4 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-brand-400 tracking-widest block">Goal</span>
                    <h3 className="text-lg font-bold text-white mt-0.5">{title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Category: <strong className="text-slate-200">{EXAM_TYPES.find(t => t.value === goalType)?.label}</strong>
                    </p>
                  </div>
                </div>

                {/* Intelligent Auto-Detected Subject Display */}
                {!manualSubjectOverride ? (
                  <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                          We recognized your learning topic
                        </span>
                        <p className="text-sm font-semibold text-white mt-0.5">
                          Domain: <strong className="text-brand-300">{domain}</strong> | Topic: <strong className="text-brand-300">{topic}</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setManualSubjectOverride(true)}
                      className="text-xs text-brand-400 hover:text-brand-300 font-bold underline"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/20 border border-slate-800 rounded-xl p-4">
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1">Learning Domain</label>
                      <input
                        type="text"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1">Learning Topic</label>
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-800/80 pt-4">
                  <div>
                    <span className="text-slate-500 block">Target Completion Date</span>
                    <span className="font-semibold text-slate-200">{targetDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Daily Dedicated Hours</span>
                    <span className="font-semibold text-slate-200">{dailyStudyHours} hours / day</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Preferred Study Window</span>
                    <span className="font-semibold text-slate-200">{preferredStudyTime}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Session Block Length</span>
                    <span className="font-semibold text-slate-200">{preferredSessionLengthMinutes} Minutes</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Study Days</span>
                    <span className="font-semibold text-slate-200">{studyDays.join(' ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Break Days</span>
                    <span className="font-semibold text-slate-200">
                      {breakDays.map(d => Object.keys(FULL_DAYS_MAP).find(k => FULL_DAYS_MAP[k] === d) || d).join(' ')}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-4 space-y-2 text-xs text-slate-400">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">We'll generate:</span>
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Personalized schedule</span>
                    <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Revision plan</span>
                    <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Practice questions</span>
                    <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Mock tests</span>
                    <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Buffer days</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Controls */}
        <div className="mt-8 flex justify-between gap-4 border-t border-slate-800/80 pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitMutation.isPending}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-800 bg-slate-900/20 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 bg-brand-500 px-6 py-3 rounded-xl text-sm font-semibold text-white transition hover:bg-brand-600 focus:ring-2 focus:ring-brand-500"
            >
              Next Step
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="flex items-center gap-2 bg-brand-500 px-6 py-3 rounded-xl text-sm font-semibold text-white transition hover:bg-brand-600 focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Activating AI Agents...
                </>
              ) : (
                <>
                  Generate My Study Plan
                  <Sparkles className="h-4 w-4 text-amber-300" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Draft Resume Modal Dialog */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-800 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Resume Your Goal Configuration?</h3>
            <p className="text-slate-400 text-sm mb-6">We found a saved goal session draft. Would you like to restore it or start fresh?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={loadDraft}
                className="flex-1 bg-brand-500 text-white rounded-xl py-3 text-sm font-semibold hover:bg-brand-600 transition"
              >
                Restore Draft
              </button>
              <button
                type="button"
                onClick={discardDraft}
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl py-3 text-sm font-semibold hover:bg-slate-800 transition"
              >
                Discard Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Goal Conflict Resolution Modal */}
      {existingGoalConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full space-y-5 shadow-2xl">
            {!showReplaceConfirm ? (
              <>
                <div className="flex items-center gap-3 border-b border-slate-900 pb-3">
                  <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/30 text-amber-400">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">Active Goal Found</h3>
                    <p className="text-xs text-slate-400">You already have an active study plan.</p>
                  </div>
                </div>

                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Existing Active Goal</span>
                  <p className="text-sm font-extrabold text-white">{existingGoalConflict.title}</p>
                  <span className="text-[10px] font-semibold text-brand-400">Category: {existingGoalConflict.category}</span>
                </div>

                <p className="text-xs text-slate-300">
                  What would you like to do?
                </p>

                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    onClick={handleContinueExistingPlan}
                    className="w-full py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
                  >
                    Continue Existing Plan
                  </button>
                  <button
                    onClick={() => setShowReplaceConfirm(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-bold text-xs transition"
                  >
                    Replace Existing Plan
                  </button>
                  <button
                    onClick={() => setExistingGoalConflict(null)}
                    className="w-full py-2 px-4 rounded-xl bg-transparent text-slate-400 hover:text-white font-semibold text-xs transition"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 border-b border-slate-900 pb-3">
                  <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/30 text-red-400">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">Confirm Replace Goal</h3>
                    <p className="text-xs text-slate-400">This action will modify your active status.</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                  This will archive your current active plan ("<strong className="text-white">{existingGoalConflict.title}</strong>") and generate a new one.
                </p>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    disabled={isArchivingGoal}
                    onClick={() => setShowReplaceConfirm(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-400"
                  >
                    Back
                  </button>
                  <button
                    disabled={isArchivingGoal}
                    onClick={handleConfirmReplaceAndSubmit}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-lg shadow-red-600/20 flex items-center gap-2"
                  >
                    {isArchivingGoal ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Confirm Replace
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
