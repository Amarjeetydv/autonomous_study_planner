import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, Award, CheckCircle, XCircle, Clock, Sparkles, 
  AlertTriangle, Loader2 
} from 'lucide-react';
import apiClient from '../../services/api/client';

interface AnswerDetail {
  questionIndex: number;
  answer: string;
  isCorrect: boolean;
}

interface QuizOption {
  label: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  questionText: string;
  questionType: string;
  options: QuizOption[];
  explanation?: string;
  marks: number;
}

interface QuizAttempt {
  _id: string;
  quizId: {
    title: string;
    description: string;
    questions: QuizQuestion[];
  };
  score: number;
  accuracy: number;
  completionTime: number; // in seconds
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers: number;
  weakConcepts: string[];
  aiFeedback: string;
  masteryChanges: {
    oldScore: number;
    newScore: number;
  };
  answers: AnswerDetail[];
}

export default function QuizResult() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  // Fetch attempt evaluation results
  const { data: attempt, isLoading, error } = useQuery({
    queryKey: ['quizAttemptResult', attemptId],
    queryFn: async () => {
      const response = await apiClient.get(`/quizzes/attempts/${attemptId}`);
      return response.data.data.attempt as QuizAttempt;
    },
    enabled: !!attemptId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
        <p className="text-sm">Calculating diagnostic reports & fetching AI analysis...</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4 px-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h3 className="text-lg font-bold text-white">Result Unavailable</h3>
        <p className="text-sm text-center max-w-sm">The attempt results could not be fetched or do not exist.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-brand-500 text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-brand-600 transition"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const formatSeconds = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs} seconds`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto space-y-8 z-10 relative">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-3 rounded-xl border border-slate-900 bg-slate-900/40 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-white">Diagnostic Report</h1>
              <p className="text-slate-400 text-xs mt-1">Quiz: <span className="text-slate-200 font-medium">{attempt.quizId?.title || 'Practice Assessment'}</span></p>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-slate-800 hover:text-white transition"
          >
            Dashboard
          </button>
        </div>

        {/* Results Matrix Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-xl border border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Score</span>
            <div className="flex items-center gap-2 mt-2">
              <Award className="h-6 w-6 text-brand-400" />
              <span className="text-2xl font-extrabold text-white">{attempt.score} Marks</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Accuracy</span>
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
              <span className="text-2xl font-extrabold text-white">{attempt.accuracy}%</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Time Taken</span>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="h-6 w-6 text-indigo-400" />
              <span className="text-xl font-extrabold text-white">{formatSeconds(attempt.completionTime)}</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Mastery Adjust</span>
            <div className="flex items-center gap-2 mt-1.5">
              <Sparkles className="h-6 w-6 text-amber-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-200">
                Was <span className="text-red-400 font-bold">{attempt.masteryChanges?.oldScore || 0}%</span> ➔ Now <span className="text-emerald-400 font-bold">{attempt.masteryChanges?.newScore || 0}%</span>
              </span>
            </div>
          </div>
        </div>

        {/* AI diagnositc breakdown */}
        {attempt.aiFeedback && (
          <div className="glass-panel p-6 rounded-2xl border border-brand-500/20 bg-brand-500/5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand-300">AI Diagnostician Observations</span>
            </div>
            <p className="text-sm text-slate-200 italic pl-3 border-l-2 border-brand-500/40">"{attempt.aiFeedback}"</p>
            
            {attempt.weakConcepts?.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Identified Weak Subconcepts</span>
                <div className="flex flex-wrap gap-2">
                  {attempt.weakConcepts.map((concept, idx) => (
                    <span key={idx} className="bg-red-950/30 text-red-400 border border-red-500/20 rounded px-2.5 py-1 text-[10px] font-semibold">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Graded questions review list */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white border-b border-slate-900 pb-3">Questions Graded Breakdown</h2>
          
          <div className="space-y-4">
            {attempt.quizId?.questions?.map((q, idx) => {
              const studentAns = attempt.answers?.find(a => a.questionIndex === idx);
              const correctOpt = q.options?.find(o => o.isCorrect);
              const isCorrect = studentAns ? studentAns.isCorrect : false;

              return (
                <div key={idx} className={`p-5 rounded-xl border ${
                  isCorrect 
                    ? 'bg-emerald-950/5 border-emerald-500/10' 
                    : 'bg-red-950/5 border-red-500/10'
                }`}>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h4 className="text-xs font-bold text-white leading-relaxed">{idx + 1}. {q.questionText}</h4>
                    <span className="shrink-0">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 pl-3 border-l border-slate-800">
                    <p>
                      <span className="font-semibold">Correct Option:</span>{' '}
                      <span className="text-emerald-400">{correctOpt ? correctOpt.label : 'N/A'}</span>
                    </p>
                    <p>
                      <span className="font-semibold">Your Answer:</span>{' '}
                      <span className={isCorrect ? 'text-emerald-400' : 'text-red-400'}>
                        {studentAns ? (studentAns.answer || '[Skipped]') : '[Skipped]'}
                      </span>
                    </p>
                    {q.explanation && (
                      <p className="mt-3 text-[11px] text-slate-400 bg-slate-900/40 p-2.5 rounded-lg border border-slate-850">
                        <span className="font-bold text-[10px] text-slate-500 block uppercase mb-0.5">Explanation</span>
                        {q.explanation}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
