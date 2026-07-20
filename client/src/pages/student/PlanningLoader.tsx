import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, Circle, AlertTriangle, RefreshCw, Home } from 'lucide-react';
import apiClient, { API_BASE_URL } from '../../services/api/client';
import { toast } from '../../services/toast';

interface StageState {
  id: string;
  name: string;
  description: string;
  progress: number;
}

const STAGES: StageState[] = [
  { id: 'goalAnalyzer', name: 'Understanding your goal...', description: 'Assessing study workload and target timeline', progress: 15 },
  { id: 'subjectPrioritizer', name: 'Designing your study roadmap...', description: 'Ranking topic weightage and key focus areas', progress: 30 },
  { id: 'scheduleGenerator', name: 'Balancing daily workload...', description: 'Structuring daily and weekly study blocks', progress: 50 },
  { id: 'revisionPlanner', name: 'Scheduling revision sessions...', description: 'Injecting spaced repetition review intervals', progress: 70 },
  { id: 'mockTestPlanner', name: 'Preparing practice tests...', description: 'Scheduling practice quizzes and diagnostic checks', progress: 90 },
  { id: 'motivation', name: 'Finalizing your personalized plan...', description: 'Formulating productivity tips and final review', progress: 100 }
];

export default function PlanningLoader() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [currentStageId, setCurrentStageId] = useState<string>('goalAnalyzer');
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<'queued' | 'running' | 'completed' | 'failed'>('queued');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [goalId, setGoalId] = useState<string>('');
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isRetryingCreation, setIsRetryingCreation] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryAttemptRef = useRef<number>(0);
  const statusRef = useRef<'queued' | 'running' | 'completed' | 'failed'>(status);

  const updateStatus = (newStatus: 'queued' | 'running' | 'completed' | 'failed') => {
    statusRef.current = newStatus;
    setStatus(newStatus);
  };

  // 1. Fetch initial job state on mount to support refresh recovery & find goalId
  useEffect(() => {
    if (!jobId) return;

    const fetchJob = async () => {
      try {
        const response = await apiClient.get(`/planner/job/${jobId}`);
        const job = response.data?.data?.job;
        if (job) {
          setGoalId(job.goalId);
          if (job.status === 'completed') {
            setProgress(100);
            updateStatus('completed');
            if (job.resultPlanId) {
              navigate(`/planner/${job.resultPlanId}`);
            }
          } else if (job.status === 'failed') {
            updateStatus('failed');
            setErrorMessage(job.errorMessage || 'AI planning job failed.');
          } else if (job.status === 'cancelled') {
            updateStatus('failed');
            setErrorMessage('Planning job was cancelled.');
          } else {
            // queued or running
            updateStatus(job.status);
            if (job.progressPercentage) {
              setProgress(job.progressPercentage);
            }
            if (job.currentStage) {
              setCurrentStageId(job.currentStage);
              const stageIndex = STAGES.findIndex(s => s.id === job.currentStage);
              if (stageIndex !== -1) {
                setCompletedStages(STAGES.slice(0, stageIndex).map(s => s.id));
              }
            }
          }
        }
      } catch (err) {
        // Silent error handle in production
      }
    };

    fetchJob();
  }, [jobId, navigate]);

  // 2. Stream connection and timeouts
  useEffect(() => {
    if (!jobId || statusRef.current === 'completed' || status === 'completed') {
      console.log("[PlanningLoader] Skipping stream because job is already completed");
      return;
    }
    console.log("[PlanningLoader] Initialized for Job ID:", jobId);
    const token = localStorage.getItem('asp_access_token') || '';
    const streamUrl = `${API_BASE_URL}/planner/job/${jobId}/stream?token=${encodeURIComponent(token)}`;
    console.log("[PlanningLoader] Connecting to EventSource URL:", streamUrl);

    // Track elapsed time & handle 90s timeout
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => {
          const nextValue = prev + 1;
          if (nextValue >= 90) {
            console.log("[PlanningLoader] Timeout event triggered at 90s");
            handleErrorState("We couldn't finish creating your study plan. This usually happens because the AI service took too long to respond. Please try again in a few moments.");
            return 90;
          }
          return nextValue;
        });
      }, 1000);
    }

    const connectSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.addEventListener('connected', () => {
        console.log("[PlanningLoader] Received EventSource 'connected' event");
        updateStatus('running');
        setIsReconnecting(false);
        retryAttemptRef.current = 0;
        setRetryAttempt(0);
      });

      es.addEventListener('progress', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[PlanningLoader] Received EventSource 'progress' event:", data);
          setCurrentStageId(data.stage);
          setProgress(data.progress);
          updateStatus('running');
          setIsReconnecting(false);
          retryAttemptRef.current = 0;
          setRetryAttempt(0);

          const stageIndex = STAGES.findIndex(s => s.id === data.stage);
          if (stageIndex !== -1) {
            const completed = STAGES.slice(0, stageIndex).map(s => s.id);
            setCompletedStages(completed);
          }
        } catch (err) {
          console.error("[PlanningLoader] Failed to parse progress JSON:", err);
        }
      });

      es.addEventListener('completed', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[PlanningLoader] Received EventSource 'completed' event:", data);
          setProgress(100);
          updateStatus('completed');
          clearTimers();

          console.log("[PlanningLoader] Navigation trigger queued for /planner/" + data.planId);
          navTimeoutRef.current = setTimeout(() => {
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
            }
            navigate(`/planner/${data.planId}`);
          }, 1500);
        } catch (err) {
          console.error("[PlanningLoader] Failed to parse completed JSON:", err);
        }
      });

      es.addEventListener('error', (event: any) => {
        console.warn("[PlanningLoader] Received EventSource 'error' event:", event);
        try {
          const data = JSON.parse(event.data || '{}');
          console.log("[PlanningLoader] Parsed error event data:", data);
          if (data.status === 'failed' || data.status === 'cancelled') {
            handleErrorState(data.message || 'Generation aborted due to errors.');
            return;
          }
        } catch (err) {
          // Parse failed
        }

        es.close();
        handleReconnection();
      });
    };

    const handleReconnection = () => {
      const nextAttempt = retryAttemptRef.current + 1;
      retryAttemptRef.current = nextAttempt;
      setRetryAttempt(nextAttempt);

      if (nextAttempt > 5) {
        handleErrorState('Lost connection while generating your study plan.');
        return;
      }

      setIsReconnecting(true);
      const backoffDelay = Math.pow(2, nextAttempt - 1) * 1000;
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connectSSE();
      }, backoffDelay);
    };

    const handleErrorState = (msg: string) => {
      updateStatus('failed');
      setErrorMessage(msg);
      clearTimers();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      clearTimers();
    };
  }, [jobId, navigate]);

  const clearTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (navTimeoutRef.current) {
      clearTimeout(navTimeoutRef.current);
      navTimeoutRef.current = null;
    }
  };

  const handleRetryPlanning = async () => {
    if (!goalId) {
      toast.error('Goal context lost. Please reconfigure your goal.');
      navigate('/goals/new');
      return;
    }

    try {
      setIsRetryingCreation(true);
      setErrorMessage('');
      setElapsedSeconds(0);
      retryAttemptRef.current = 0;
      setRetryAttempt(0);
      setIsReconnecting(false);

      toast.info('Re-initializing study plan queue...', '🤖 Retrying Generation');
      const response = await apiClient.post('/planner/generate', { goalId });
      const newJob = response.data?.data;
      if (newJob?.jobId) {
        setStatus('queued');
        setProgress(0);
        setCurrentStageId('goalAnalyzer');
        setCompletedStages([]);
        navigate(`/planner/job/${newJob.jobId}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to restart generation queue.';
      setErrorMessage(msg);
      toast.error(msg, 'Retry Failed');
    } finally {
      setIsRetryingCreation(false);
    }
  };

  const getStageStatus = (stageId: string) => {
    if (status === 'failed' && stageId === currentStageId) {
      return 'failed';
    }
    if (status === 'completed' || completedStages.includes(stageId)) {
      return 'completed';
    }
    if (stageId === currentStageId && status === 'running') {
      return 'running';
    }
    return 'waiting';
  };

  const getEstimatedRemainingTime = () => {
    const estTotal = 90;
    const remaining = Math.max(estTotal - elapsedSeconds, 1);
    if (status === 'completed') return 'Finished';
    if (status === 'failed') return 'Failed';
    return `${remaining}s remaining`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Lights */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[150px] pointer-events-none"></div>

      <div className="max-w-xl mx-auto w-full z-10 text-center mb-6">
        <h1 className="text-3xl font-extrabold text-gradient">AI Plan Generator</h1>
        <p className="text-slate-400 text-sm mt-1">Our agents are assembling your customized study curriculum.</p>
      </div>

      <div className="max-w-xl mx-auto w-full z-10 glass-panel rounded-2xl p-8 border border-slate-800 shadow-2xl flex-1 flex flex-col justify-between">
        {/* Loading Circle & Stats */}
        <div className="text-center py-6">
          <div className="relative inline-flex items-center justify-center mb-6">
            {/* SVG Circular Progress */}
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-900"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="6"
                className="text-brand-500 transition-all duration-500 ease-out"
                fill="transparent"
                strokeDasharray={351.8}
                strokeDashoffset={351.8 - (351.8 * progress) / 100}
              />
            </svg>
            <div className="absolute text-2xl font-bold text-white">
              {progress}%
            </div>
          </div>

          <h3 className="text-lg font-bold text-white">
            {isReconnecting && `Reconnecting to AI planning service... (Attempt ${retryAttempt}/5)`}
            {!isReconnecting && status === 'queued' && 'Initializing Queue...'}
            {!isReconnecting && status === 'running' && `Stage: ${STAGES.find(s => s.id === currentStageId)?.name || 'Processing'}`}
            {!isReconnecting && status === 'completed' && 'Curriculum Assembled!'}
            {!isReconnecting && status === 'failed' && 'Assembly Failed'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {status === 'running' && getEstimatedRemainingTime()}
            {status === 'queued' && 'Waiting for worker allocation'}
            {status === 'failed' && 'Generation aborted due to errors'}
          </p>
        </div>

        {/* Timeline Block */}
        <div className="my-6 border-t border-slate-900 pt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Planning Pipeline</h4>
          <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-900">
            {STAGES.map((stage) => {
              const stageStatus = getStageStatus(stage.id);

              return (
                <div key={stage.id} className="flex items-start gap-4 relative">
                  <div className="z-10 bg-slate-950 rounded-full p-1 -ml-1">
                    {stageStatus === 'completed' && (
                      <CheckCircle2 className="h-6 w-6 text-emerald-400 fill-emerald-950/20" />
                    )}
                    {stageStatus === 'running' && (
                      <Loader2 className="h-6 w-6 text-brand-500 animate-spin" />
                    )}
                    {stageStatus === 'waiting' && (
                      <Circle className="h-6 w-6 text-slate-800" />
                    )}
                    {stageStatus === 'failed' && (
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                    )}
                  </div>
                  <div>
                    <h5 className={`text-sm font-bold ${
                      stageStatus === 'running' ? 'text-brand-400' : 
                      stageStatus === 'completed' ? 'text-slate-300' : 'text-slate-500'
                    }`}>
                      {stage.name}
                    </h5>
                    {stageStatus === 'running' && (
                      <p className="text-xs text-slate-400 mt-0.5 animate-pulse">{stage.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error panel */}
        {status === 'failed' && (
          <div className="rounded-xl bg-red-950/40 border border-red-500/30 p-5 mt-4 text-xs text-red-400 flex flex-col gap-4">
            <div className="flex gap-2.5">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{errorMessage}</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <button
                onClick={handleRetryPlanning}
                disabled={isRetryingCreation}
                className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/40 text-white font-bold py-2.5 px-4 rounded-xl transition shadow-lg shadow-brand-500/25"
              >
                <RefreshCw className={`h-4 w-4 ${isRetryingCreation ? 'animate-spin' : ''}`} />
                {isRetryingCreation ? 'Starting Queue...' : 'Retry Generation'}
              </button>

              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl py-2.5 px-4 font-bold text-slate-300 transition"
              >
                <Home className="h-4 w-4" />
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
