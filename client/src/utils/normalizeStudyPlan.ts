export interface NormalizedSubjectPriority {
  subjectId: string;
  subjectName: string;
  priority: number;
  examWeightage: string;
  rationale: string;
}

export interface NormalizedDailyTask {
  task: string;
  duration: string;
  type: string;
}

export interface NormalizedWeeklyTask {
  focus: string;
  hoursAllocated: number;
}

export interface NormalizedMonthlyTask {
  milestone: string;
  targetWeek: number;
}

export interface NormalizedRevisionTask {
  topic: string;
  reviewIntervalDays: number;
  date: string;
}

export interface NormalizedQuizTask {
  examType: string;
  scheduledDate: string;
  durationMinutes: number;
}

export interface NormalizedStudyPlan {
  id: string;
  goalId: string;
  studentId: string;
  status: string;
  promptVersion: string;
  goalAnalysis: {
    workloadRating: string;
    weeklyCommitmentMinutes: number;
    suggestedTimelineWeeks: number;
    riskFactors: string[];
    weakAreas: string[];
  };
  studyPlan: {
    prioritizedSubjects: NormalizedSubjectPriority[];
    rankingRationale: string;
  };
  scheduler: {
    dailyTasks: NormalizedDailyTask[];
    weeklyTasks: NormalizedWeeklyTask[];
    monthlyTasks: NormalizedMonthlyTask[];
    bufferAllocation: string;
    RestDays: string[];
  };
  revisionPlan: {
    revisionPlan: NormalizedRevisionTask[];
    logic: string;
  };
  quizPlan: {
    quizSchedule: NormalizedQuizTask[];
  };
  motivation: {
    motivationalSummary: string;
    suggestedProductivityTips: string[];
  };
}

/**
 * Normalization Layer: Transforms raw AI planner output into a strict canonical schema
 * so React components never need to guess object structures or render raw objects.
 */
export function normalizeStudyPlan(raw: any): NormalizedStudyPlan {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      goalId: '',
      studentId: '',
      status: 'draft',
      promptVersion: '1.0',
      goalAnalysis: {
        workloadRating: 'Medium',
        weeklyCommitmentMinutes: 900,
        suggestedTimelineWeeks: 12,
        riskFactors: [],
        weakAreas: [],
      },
      studyPlan: {
        prioritizedSubjects: [],
        rankingRationale: '',
      },
      scheduler: {
        dailyTasks: [],
        weeklyTasks: [],
        monthlyTasks: [],
        bufferAllocation: '',
        RestDays: [],
      },
      revisionPlan: {
        revisionPlan: [],
        logic: '',
      },
      quizPlan: {
        quizSchedule: [],
      },
      motivation: {
        motivationalSummary: '',
        suggestedProductivityTips: [],
      },
    };
  }

  const toCleanString = (val: any, fallback: string = ''): string => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (typeof val === 'object') {
      if (val.purpose) return `${val.day ? `Day ${val.day}: ` : ''}${val.purpose}`;
      if (val.strategy) return val.strategy;
      if (val.description) return val.description;
      if (val.milestone) return val.milestone;
      if (val.task) return val.task;
      if (val.text) return val.text;
      if (val.title) return val.title;
      if (val.name) return val.name;
      return JSON.stringify(val);
    }
    return fallback;
  };

  const parseRestDays = (days: any): string[] => {
    if (Array.isArray(days)) {
      return days.map((d) => toCleanString(d)).filter(Boolean);
    }
    const str = toCleanString(days);
    return str ? [str] : [];
  };

  const goalAnalysisRaw = raw.goalAnalysis || {};
  const goalAnalysis = {
    workloadRating: toCleanString(goalAnalysisRaw.workloadRating, 'Medium'),
    weeklyCommitmentMinutes:
      typeof goalAnalysisRaw.weeklyCommitmentMinutes === 'number'
        ? goalAnalysisRaw.weeklyCommitmentMinutes
        : 900,
    suggestedTimelineWeeks:
      typeof goalAnalysisRaw.suggestedTimelineWeeks === 'number'
        ? goalAnalysisRaw.suggestedTimelineWeeks
        : 12,
    riskFactors: Array.isArray(goalAnalysisRaw.riskFactors)
      ? goalAnalysisRaw.riskFactors.map((r: any) => toCleanString(r))
      : [],
    weakAreas: Array.isArray(goalAnalysisRaw.weakAreas)
      ? goalAnalysisRaw.weakAreas.map((w: any) => toCleanString(w))
      : [],
  };

  const studyPlanRaw = raw.studyPlan || {};
  const prioritizedSubjectsRaw = Array.isArray(studyPlanRaw.prioritizedSubjects)
    ? studyPlanRaw.prioritizedSubjects
    : [];
  const prioritizedSubjects: NormalizedSubjectPriority[] = prioritizedSubjectsRaw.map(
    (sub: any, idx: number) => ({
      subjectId: toCleanString(sub.subjectId || sub.id, `sub_${idx}`),
      subjectName: toCleanString(sub.subjectName || sub.name || sub.title, `Subject ${idx + 1}`),
      priority: typeof sub.priority === 'number' ? sub.priority : idx + 1,
      examWeightage: toCleanString(sub.examWeightage, 'N/A'),
      rationale: toCleanString(sub.rationale || sub.description, 'High priority study area.'),
    })
  );

  const schedulerRaw = raw.scheduler || {};
  const dailyTasksRaw = Array.isArray(schedulerRaw.dailyTasks) ? schedulerRaw.dailyTasks : [];
  const dailyTasks: NormalizedDailyTask[] = dailyTasksRaw.map((dt: any) => ({
    task: toCleanString(dt.task || dt.title || dt.activity, 'Study Task'),
    duration: toCleanString(dt.duration || dt.hoursAllocated || dt.time, '1 hr'),
    type: toCleanString(dt.type || dt.category, 'Core Study'),
  }));

  const weeklyTasksRaw = Array.isArray(schedulerRaw.weeklyTasks) ? schedulerRaw.weeklyTasks : [];
  const weeklyTasks: NormalizedWeeklyTask[] = weeklyTasksRaw.map((wt: any) => ({
    focus: toCleanString(wt.focus || wt.task || wt.subject, 'Weekly Focus'),
    hoursAllocated:
      typeof wt.hoursAllocated === 'number'
        ? wt.hoursAllocated
        : parseFloat(wt.duration) || 5,
  }));

  const monthlyTasksRaw = Array.isArray(schedulerRaw.monthlyTasks) ? schedulerRaw.monthlyTasks : [];
  const monthlyTasks: NormalizedMonthlyTask[] = monthlyTasksRaw.map((mt: any, idx: number) => ({
    milestone: toCleanString(mt.milestone || mt.goal || mt.task, 'Milestone'),
    targetWeek: typeof mt.targetWeek === 'number' ? mt.targetWeek : idx + 1,
  }));

  const bufferAllocation = toCleanString(schedulerRaw.bufferAllocation, '');
  const RestDays = parseRestDays(schedulerRaw.RestDays);

  const revisionRaw = raw.revisionPlan || {};
  const revListRaw = Array.isArray(revisionRaw.revisionPlan) ? revisionRaw.revisionPlan : [];
  const revisionPlanList: NormalizedRevisionTask[] = revListRaw.map((rev: any) => ({
    topic: toCleanString(rev.topic || rev.subject, 'Topic Review'),
    reviewIntervalDays:
      typeof rev.reviewIntervalDays === 'number'
        ? rev.reviewIntervalDays
        : parseInt(rev.interval) || 7,
    date: toCleanString(rev.date || rev.scheduledDate, 'Scheduled'),
  }));

  const quizRaw = raw.quizPlan || {};
  const quizListRaw = Array.isArray(quizRaw.quizSchedule)
    ? quizRaw.quizSchedule
    : Array.isArray(quizRaw.quizPlan)
    ? quizRaw.quizPlan
    : [];
  const quizSchedule: NormalizedQuizTask[] = quizListRaw.map((quiz: any) => ({
    examType: toCleanString(quiz.examType || quiz.type || quiz.topic, 'Mock Diagnostic Exam'),
    scheduledDate: toCleanString(quiz.scheduledDate || quiz.targetDate, 'TBD'),
    durationMinutes:
      typeof quiz.durationMinutes === 'number'
        ? quiz.durationMinutes
        : parseInt(quiz.duration) || 45,
  }));

  const motivationRaw = raw.motivation || {};
  const motivationalSummary = toCleanString(motivationRaw.motivationalSummary, '');
  const suggestedProductivityTips = Array.isArray(motivationRaw.suggestedProductivityTips)
    ? motivationRaw.suggestedProductivityTips.map((t: any) => toCleanString(t)).filter(Boolean)
    : [];

  return {
    id: toCleanString(raw.id || raw._id),
    goalId: toCleanString(raw.goalId),
    studentId: toCleanString(raw.studentId),
    status: toCleanString(raw.status, 'active'),
    promptVersion: toCleanString(raw.promptVersion, '1.0'),
    goalAnalysis,
    studyPlan: {
      prioritizedSubjects,
      rankingRationale: toCleanString(studyPlanRaw.rankingRationale, ''),
    },
    scheduler: {
      dailyTasks,
      weeklyTasks,
      monthlyTasks,
      bufferAllocation,
      RestDays,
    },
    revisionPlan: {
      revisionPlan: revisionPlanList,
      logic: toCleanString(revisionRaw.logic, ''),
    },
    quizPlan: {
      quizSchedule,
    },
    motivation: {
      motivationalSummary,
      suggestedProductivityTips,
    },
  };
}
