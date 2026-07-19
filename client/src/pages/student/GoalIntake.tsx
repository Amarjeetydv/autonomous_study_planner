import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ArrowLeft, ArrowRight, Check, Loader2, AlertCircle
} from 'lucide-react';
import apiClient from '../../services/api/client';

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
const LEARNING_STYLES = ['Visual', 'Reading', 'Hands-on', 'Video', 'Text', 'Mixed'];
const DIFFICULTY_PREFS = ['Beginner', 'Intermediate', 'Advanced', 'Mixed'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function GoalIntake() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [goalType, setGoalType] = useState('GATE');
  const [targetDate, setTargetDate] = useState('');
  const [dailyStudyHours, setDailyStudyHours] = useState(2);
  const [weeklyStudyDays, setWeeklyStudyDays] = useState(5);
  const [preferredStudyTime, setPreferredStudyTime] = useState('Morning');
  const [preferredSessionLengthMinutes, setPreferredSessionLengthMinutes] = useState(60);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [strongSubjects, setStrongSubjects] = useState<string[]>([]);
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [prioritySubjects, setPrioritySubjects] = useState<string[]>([]);
  const [difficultyPreference, setDifficultyPreference] = useState('Intermediate');
  const [learningStyle, setLearningStyle] = useState('Mixed');
  const [breakDays, setBreakDays] = useState<string[]>([]);
  const [motivation, setMotivation] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');

  // Fetch available subjects
  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await apiClient.get('/subjects?limit=100');
      return response.data.data.items as Subject[];
    }
  });

  // Check for draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('asp_goal_intake_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.title || parsed.selectedSubjects?.length) {
          setShowDraftModal(true);
        }
      } catch (err) {
        // Invalid draft, ignore
      }
    }
  }, []);

  // Save draft whenever state changes
  useEffect(() => {
    const state = {
      title, goalType, targetDate, dailyStudyHours, weeklyStudyDays,
      preferredStudyTime, preferredSessionLengthMinutes, selectedSubjects,
      strongSubjects, weakSubjects, prioritySubjects, difficultyPreference,
      learningStyle, breakDays, motivation, timezone
    };
    localStorage.setItem('asp_goal_intake_draft', JSON.stringify(state));
  }, [
    title, goalType, targetDate, dailyStudyHours, weeklyStudyDays,
    preferredStudyTime, preferredSessionLengthMinutes, selectedSubjects,
    strongSubjects, weakSubjects, prioritySubjects, difficultyPreference,
    learningStyle, breakDays, motivation, timezone
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
        setPreferredStudyTime(d.preferredStudyTime || 'Morning');
        setPreferredSessionLengthMinutes(d.preferredSessionLengthMinutes ?? 60);
        setSelectedSubjects(d.selectedSubjects || []);
        setStrongSubjects(d.strongSubjects || []);
        setWeakSubjects(d.weakSubjects || []);
        setPrioritySubjects(d.prioritySubjects || []);
        setDifficultyPreference(d.difficultyPreference || 'Intermediate');
        setLearningStyle(d.learningStyle || 'Mixed');
        setBreakDays(d.breakDays || []);
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

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/goals', payload);
      const goal = res.data.data.goal;
      const goalId = goal.id || goal._id;

      const genRes = await apiClient.post('/planner/generate', { goalId });
      return genRes.data.data;
    },
    onSuccess: (data) => {
      localStorage.removeItem('asp_goal_intake_draft');
      navigate(`/planner/job/${data.jobId}`);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to submit study goal. Please try again.');
    }
  });

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
    }
    if (step === 2) {
      if (dailyStudyHours <= 0 || dailyStudyHours > 24) {
        setFormError('Daily study hours must be between 1 and 24.');
        return;
      }
      if (weeklyStudyDays <= 0 || weeklyStudyDays > 7) {
        setFormError('Weekly study days must be between 1 and 7.');
        return;
      }
    }
    if (step === 3) {
      if (selectedSubjects.length === 0) {
        setFormError('Please select at least one subject to study.');
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setFormError('');
    setStep((prev) => prev - 1);
  };

  const toggleSubjectSelect = (id: string) => {
    if (selectedSubjects.includes(id)) {
      setSelectedSubjects(selectedSubjects.filter((sid) => sid !== id));
      setStrongSubjects(strongSubjects.filter((sid) => sid !== id));
      setWeakSubjects(weakSubjects.filter((sid) => sid !== id));
      setPrioritySubjects(prioritySubjects.filter((sid) => sid !== id));
    } else {
      setSelectedSubjects([...selectedSubjects, id]);
    }
  };

  const toggleClassification = (id: string, listType: 'strong' | 'weak' | 'priority') => {
    if (!selectedSubjects.includes(id)) return;

    if (listType === 'strong') {
      if (strongSubjects.includes(id)) {
        setStrongSubjects(strongSubjects.filter((sid) => sid !== id));
      } else {
        setStrongSubjects([...strongSubjects, id]);
        setWeakSubjects(weakSubjects.filter((sid) => sid !== id)); // cannot be strong and weak
      }
    } else if (listType === 'weak') {
      if (weakSubjects.includes(id)) {
        setWeakSubjects(weakSubjects.filter((sid) => sid !== id));
      } else {
        setWeakSubjects([...weakSubjects, id]);
        setStrongSubjects(strongSubjects.filter((sid) => sid !== id)); // cannot be weak and strong
      }
    } else if (listType === 'priority') {
      if (prioritySubjects.includes(id)) {
        setPrioritySubjects(prioritySubjects.filter((sid) => sid !== id));
      } else {
        setPrioritySubjects([...prioritySubjects, id]);
      }
    }
  };

  const toggleBreakDay = (day: string) => {
    if (breakDays.includes(day)) {
      setBreakDays(breakDays.filter((d) => d !== day));
    } else {
      setBreakDays([...breakDays, day]);
    }
  };

  const handleSubmit = () => {
    setFormError('');
    const payload = {
      title,
      goalType,
      targetDate,
      currentLevel: 'Intermediate', // default mapping to align with schema validators
      dailyStudyHours: Number(dailyStudyHours),
      weeklyStudyDays: Number(weeklyStudyDays),
      preferredStudyTime,
      preferredSessionLengthMinutes: Number(preferredSessionLengthMinutes),
      selectedSubjects,
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
      <div className="max-w-3xl mx-auto w-full z-10 text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gradient">Set Your Study Goal</h1>
        <p className="text-slate-400 text-sm mt-1">Configure your personalized milestones to let our AI construct your plan.</p>
      </div>

      {/* Wizard Panel */}
      <div className="max-w-3xl mx-auto w-full z-10 glass-panel rounded-2xl p-8 border border-slate-800 shadow-2xl flex-1 flex flex-col justify-between">
        <div>
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <span>Step {step} of 5</span>
              <span>{Math.round((step / 5) * 100)}% Complete</span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-500 transition-all duration-300 rounded-full" 
                style={{ width: `${(step / 5) * 100}%` }}
              ></div>
            </div>
          </div>

          {formError && (
            <div className="mb-6 rounded-xl bg-red-950/40 border border-red-500/30 p-4 text-sm text-red-400 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* STEP 1: Core Goal Details */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">1. What are you preparing for?</h2>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Goal Title / Name
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 px-4 text-sm text-slate-100 outline-none transition focus:border-brand-500 focus:bg-slate-900"
                  placeholder="e.g. Master Calculus & Algorithms, Pass GATE 2027"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Exam / Prep Category
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
                    Target Date
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

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Timezone
                </label>
                <input
                  type="text"
                  disabled
                  value={timezone}
                  className="block w-full rounded-xl border border-slate-900 bg-slate-950/60 py-3 px-4 text-sm text-slate-500 cursor-not-allowed"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Automatically matched to local browser configuration.</span>
              </div>
            </div>
          )}

          {/* STEP 2: Schedules */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">2. Design your daily dedication</h2>

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

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Weekly Study Days (1-7)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    required
                    value={weeklyStudyDays}
                    onChange={(e) => setWeeklyStudyDays(Number(e.target.value))}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 px-4 text-sm text-slate-100 outline-none transition focus:border-brand-500 focus:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Preferred Time of Day
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
                  <span className="text-[10px] text-slate-500 mt-1 block">Specify study block length (e.g. 60 or 90 mins).</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Subject Selection & Classification */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-white">3. Curate your subjects list</h2>
                <span className="text-xs text-brand-400 font-semibold">{selectedSubjects.length} Selected</span>
              </div>

              {isLoadingSubjects ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                </div>
              ) : (
                <div className="max-h-[350px] overflow-y-auto pr-2 space-y-4">
                  {subjectsData && subjectsData.length > 0 ? (
                    subjectsData.map((sub) => {
                      const isSelected = selectedSubjects.includes(sub.id);
                      const isStrong = strongSubjects.includes(sub.id);
                      const isWeak = weakSubjects.includes(sub.id);
                      const isPriority = prioritySubjects.includes(sub.id);

                      return (
                        <div 
                          key={sub.id} 
                          className={`p-4 rounded-xl border transition-all ${
                            isSelected ? 'bg-slate-900/80 border-slate-700' : 'bg-slate-900/20 border-slate-900/80'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSubjectSelect(sub.id)}
                                className="rounded text-brand-500 focus:ring-brand-500 bg-slate-950 border-slate-800"
                              />
                              <div>
                                <span className="font-bold text-sm text-white block">{sub.name}</span>
                                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                                  {sub.code} • {sub.category}
                                </span>
                              </div>
                            </label>
                            <span 
                              className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold tracking-wider text-slate-400 bg-slate-800"
                              style={{ color: sub.color }}
                            >
                              {sub.difficulty}
                            </span>
                          </div>

                          {/* Classification switches */}
                          {isSelected && (
                            <div className="flex gap-2 mt-3 pt-2 border-t border-slate-800/60">
                              <button
                                type="button"
                                onClick={() => toggleClassification(sub.id, 'strong')}
                                className={`text-[10px] px-3 py-1.5 rounded-lg border font-semibold transition ${
                                  isStrong 
                                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40' 
                                    : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                Strong Subject
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleClassification(sub.id, 'weak')}
                                className={`text-[10px] px-3 py-1.5 rounded-lg border font-semibold transition ${
                                  isWeak 
                                    ? 'bg-amber-950/40 text-amber-400 border-amber-500/40' 
                                    : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                Weak Subject
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleClassification(sub.id, 'priority')}
                                className={`text-[10px] px-3 py-1.5 rounded-lg border font-semibold transition ${
                                  isPriority 
                                    ? 'bg-brand-950/40 text-brand-400 border-brand-500/40' 
                                    : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                Priority
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-sm">
                      No subjects configured in system. Please run database seeding.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Preferences & Customizations */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">4. Personalize study characteristics</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Difficulty Level Preference
                  </label>
                  <select
                    value={difficultyPreference}
                    onChange={(e) => setDifficultyPreference(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 px-4 text-sm text-slate-100 outline-none transition focus:border-brand-500 focus:bg-slate-900"
                  >
                    {DIFFICULTY_PREFS.map((pref) => (
                      <option key={pref} value={pref}>{pref}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Learning Style
                  </label>
                  <select
                    value={learningStyle}
                    onChange={(e) => setLearningStyle(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 px-4 text-sm text-slate-100 outline-none transition focus:border-brand-500 focus:bg-slate-900"
                  >
                    {LEARNING_STYLES.map((style) => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Preferred Break Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => {
                    const isSelected = breakDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleBreakDay(day)}
                        className={`text-xs px-3 py-2 rounded-xl border font-medium transition ${
                          isSelected 
                            ? 'bg-brand-500 text-white border-brand-500' 
                            : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:border-slate-700'
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
                  Motivation Statement (Optional)
                </label>
                <textarea
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  rows={3}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3 px-4 text-sm text-slate-100 outline-none transition focus:border-brand-500 focus:bg-slate-900 resize-none"
                  placeholder="Share what drives you to finish this plan..."
                />
              </div>
            </div>
          )}

          {/* STEP 5: Review & Submit */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">5. Review details before compiling</h2>

              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="border-b border-slate-800/80 pb-4">
                  <span className="text-[10px] uppercase font-bold text-brand-400 tracking-widest">Goal Focus</span>
                  <h3 className="text-xl font-bold text-white mt-1">{title}</h3>
                  <span className="text-xs text-slate-400">{EXAM_TYPES.find(t => t.value === goalType)?.label}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs block">Target Completion Date</span>
                    <span className="font-semibold text-slate-200">{targetDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">Daily Commited Hours</span>
                    <span className="font-semibold text-slate-200">{dailyStudyHours} hours / day</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">Preferred Window</span>
                    <span className="font-semibold text-slate-200">{preferredStudyTime}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">Session Block length</span>
                    <span className="font-semibold text-slate-200">{preferredSessionLengthMinutes} Minutes</span>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-4">
                  <span className="text-slate-500 text-xs block mb-2">Selected Subjects ({selectedSubjects.length})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSubjects.map((sid) => {
                      const sub = subjectsData?.find((s) => s.id === sid);
                      if (!sub) return null;
                      const isStrong = strongSubjects.includes(sid);
                      const isWeak = weakSubjects.includes(sid);
                      return (
                        <span 
                          key={sid} 
                          className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-300 font-medium flex items-center gap-1 border border-slate-800"
                        >
                          {sub.name}
                          {isStrong && <span className="text-emerald-400 font-bold">(Strong)</span>}
                          {isWeak && <span className="text-amber-400 font-bold">(Weak)</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {(breakDays.length > 0 || motivation) && (
                  <div className="border-t border-slate-800/80 pt-4 space-y-3">
                    {breakDays.length > 0 && (
                      <div>
                        <span className="text-slate-500 text-xs block mb-1">Rest Days</span>
                        <span className="text-xs text-slate-400">{breakDays.join(', ')}</span>
                      </div>
                    )}
                    {motivation && (
                      <div>
                        <span className="text-slate-500 text-xs block mb-1">Motivation Code</span>
                        <p className="text-xs text-slate-400 italic">"{motivation}"</p>
                      </div>
                    )}
                  </div>
                )}
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

          {step < 5 ? (
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
                  Saving Goal...
                </>
              ) : (
                <>
                  Confirm & Submit
                  <Check className="h-4 w-4" />
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
    </div>
  );
}
