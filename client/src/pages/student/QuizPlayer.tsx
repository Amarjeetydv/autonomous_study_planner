import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Clock, ArrowLeft, ArrowRight, Flag, CheckCircle, 
  HelpCircle, Loader2 
} from 'lucide-react';
import apiClient from '../../services/api/client';

interface QuizOption {
  label: string;
  isCorrect?: boolean;
}

interface QuizQuestion {
  questionText: string;
  questionType: 'mcq' | 'tf' | 'fib';
  options: QuizOption[];
  explanation?: string;
  marks: number;
}

interface Quiz {
  _id: string;
  title: string;
  description: string;
  estimatedTime: number; // in minutes
  questions: QuizQuestion[];
}

export default function QuizPlayer() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900); // 15 mins default
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);

  // Fetch quiz detail
  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ['quizPlayerDetail', quizId],
    queryFn: async () => {
      const response = await apiClient.get(`/quizzes/${quizId}`);
      return response.data.data.quiz as Quiz;
    },
    enabled: !!quizId
  });

  // Initialize timer once quiz loads
  useEffect(() => {
    if (quiz) {
      setSecondsRemaining((quiz.estimatedTime || 15) * 60);
    }
  }, [quiz]);

  // Decrement timer
  useEffect(() => {
    if (secondsRemaining <= 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  // Submit attempt mutation
  const submitMutation = useMutation({
    mutationFn: async (payload: { answers: { questionIndex: number; answer: string }[]; completionTime: number }) => {
      const response = await apiClient.post(`/quizzes/${quizId}/submit`, payload);
      return response.data.data.attempt;
    },
    onSuccess: (data) => {
      navigate(`/quizzes/attempt/${data._id}`);
    }
  });

  const handleSelectAnswer = (optionLabel: string) => {
    setSelectedAnswers(prev => ({ ...prev, [currentIdx]: optionLabel }));
  };

  const toggleFlagQuestion = () => {
    if (flaggedQuestions.includes(currentIdx)) {
      setFlaggedQuestions(flaggedQuestions.filter(i => i !== currentIdx));
    } else {
      setFlaggedQuestions([...flaggedQuestions, currentIdx]);
    }
  };

  const handleNext = () => {
    if (quiz && currentIdx < quiz.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const compilePayload = () => {
    const formattedAnswers = Object.entries(selectedAnswers).map(([idxStr, ans]) => ({
      questionIndex: Number(idxStr),
      answer: ans
    }));

    const totalSeconds = (quiz?.estimatedTime || 15) * 60;
    const spentSeconds = totalSeconds - secondsRemaining;

    return {
      answers: formattedAnswers,
      completionTime: Math.max(5, spentSeconds)
    };
  };

  const handleSubmit = () => {
    submitMutation.mutate(compilePayload());
  };

  const handleAutoSubmit = () => {
    submitMutation.mutate(compilePayload());
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
        <p className="text-sm">Assembling quiz questions...</p>
      </div>
    );
  }

  if (error || !quiz || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4 px-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h3 className="text-lg font-bold text-white">Quiz Unavailable</h3>
        <p className="text-sm text-center max-w-sm">The quiz could not be initialized or contains no questions.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-brand-500 text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-brand-600 transition"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIdx];
  const progressPercent = Math.round(((currentIdx + 1) / quiz.questions.length) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-between">
      {/* Lights */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/5 blur-[120px] pointer-events-none"></div>

      {/* Top Header bar */}
      <div className="max-w-4xl mx-auto w-full z-10 flex justify-between items-center border-b border-slate-900 pb-4 mb-6">
        <div>
          <h1 className="text-lg font-extrabold text-white">{quiz.title}</h1>
          <p className="text-slate-500 text-[10px] uppercase mt-0.5">Question {currentIdx + 1} of {quiz.questions.length}</p>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold ${
          secondsRemaining < 120 
            ? 'bg-red-950/20 text-red-400 border-red-500/20 animate-pulse' 
            : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}>
          <Clock className="h-4 w-4" />
          <span className="text-sm font-mono">{formatTime(secondsRemaining)}</span>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="max-w-4xl mx-auto w-full z-10 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-6">
        {/* Question Panel */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-900 space-y-6 flex flex-col justify-between min-h-[350px]">
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                {currentQuestion.questionType.toUpperCase()}
              </span>
              <button
                onClick={toggleFlagQuestion}
                className={`flex items-center gap-1.5 text-xs font-semibold transition ${
                  flaggedQuestions.includes(currentIdx) ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Flag className="h-4 w-4" />
                {flaggedQuestions.includes(currentIdx) ? 'Flagged' : 'Flag Question'}
              </button>
            </div>
            <h2 className="text-base font-bold text-white leading-relaxed">{currentQuestion.questionText}</h2>
          </div>

          {/* Options */}
          <div className="space-y-3 pt-4 border-t border-slate-900/60">
            {currentQuestion.options.map((opt, oIdx) => {
              const isSelected = selectedAnswers[currentIdx] === opt.label;
              return (
                <button
                  key={oIdx}
                  onClick={() => handleSelectAnswer(opt.label)}
                  className={`w-full text-left p-4 rounded-xl border text-xs font-semibold transition flex items-center justify-between ${
                    isSelected 
                      ? 'bg-brand-500/10 text-brand-400 border-brand-500/30' 
                      : 'bg-slate-900/30 text-slate-300 border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <CheckCircle className="h-4 w-4 text-brand-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Jump Menu */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-900 space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Quiz Map</h3>
          
          <div className="grid grid-cols-5 gap-2">
            {quiz.questions.map((_, idx) => {
              const isCurrent = currentIdx === idx;
              const isAnswered = selectedAnswers[idx] !== undefined;
              const isFlagged = flaggedQuestions.includes(idx);

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-9 w-9 rounded-lg font-bold text-xs flex items-center justify-center border transition ${
                    isCurrent ? 'bg-brand-500 text-white border-brand-500' :
                    isFlagged ? 'bg-amber-950/40 text-amber-400 border-amber-500/30' :
                    isAnswered ? 'bg-slate-850 text-slate-300 border-slate-800' :
                    'bg-slate-900/40 text-slate-600 border-slate-900 hover:border-slate-800'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-900 space-y-4">
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="w-full bg-brand-500 text-white rounded-xl py-3 text-xs font-bold hover:bg-brand-600 transition"
            >
              Submit Quiz
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Footers */}
      <div className="max-w-4xl mx-auto w-full z-10 flex justify-between items-center border-t border-slate-900 pt-4">
        <button
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={currentIdx === quiz.questions.length - 1}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition disabled:opacity-30"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Submit Confirm Overlay Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-sm w-full border border-slate-800 shadow-2xl text-center">
            <HelpCircle className="h-10 w-10 text-brand-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">Submit Diagnostic Answers?</h3>
            <p className="text-slate-400 text-xs mt-1 mb-6">
              You have answered {Object.keys(selectedAnswers).length} of {quiz.questions.length} questions.
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="flex-1 bg-brand-500 text-white rounded-xl py-2.5 text-xs font-bold hover:bg-brand-600 transition disabled:opacity-50"
              >
                {submitMutation.isPending ? 'Grading...' : 'Yes, Submit'}
              </button>
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 bg-slate-900 border border-slate-850 text-slate-400 rounded-xl py-2.5 text-xs font-semibold hover:bg-slate-850 hover:text-white transition"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icon helper
function AlertCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  );
}
