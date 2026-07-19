import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, Circle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../../services/api/client';

interface StageState {
  id: string;
  name: string;
  description: string;
  progress: number;
}

const STAGES: StageState[] = [
  { id: 'goalAnalyzer', name: 'Goal Analyzer', description: 'Assessing study workload and target timeline', progress: 15 },
  { id: 'subjectPrioritizer', name: 'Subject Prioritizer', description: 'Ranking topic weightage and weaknesses', progress: 30 },
  { id: 'scheduleGenerator', name: 'Schedule Generator', description: 'Structuring daily, weekly study blocks', progress: 50 },
  { id: 'revisionPlanner', name: 'Revision Planner', description: 'Injecting spaced repetition study checks', progress: 70 },
  { id: 'mockTestPlanner', name: 'Mock Test Planner', description: 'Scheduling practice quizzes and diagnostic exams', progress: 90 },
  { id: 'motivation', name: 'Motivation Agent', description: 'Formulating productivity tips and final review', progress: 100 }
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

  // Connection/stream listener
  useEffect(() => {
    if (!jobId) return;

    // Retrieve token for SSE query parameter auth fallback
    const token = localStorage.getItem('asp_access_token') || '';

    // Construct stream URL
    const streamUrl = `${API_BASE_URL}/planner/job/${jobId}/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(streamUrl);

    // Track elapsed time
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    eventSource.addEventListener('connected', () => {
      setStatus('running');
    });

    eventSource.addEventListener('progress', (event) => {
      try {
        const data = JSON.parse(event.data);
        setCurrentStageId(data.stage);
        setProgress(data.progress);
        setStatus('running');

        // Mark previous stages as completed
        const stageIndex = STAGES.findIndex(s => s.id === data.stage);
        if (stageIndex !== -1) {
          const completed = STAGES.slice(0, stageIndex).map(s => s.id);
          setCompletedStages(completed);
        }
      } catch (err) {
        // parsing error
      }
    });

    eventSource.addEventListener('completed', (event) => {
      try {
        const data = JSON.parse(event.data);
        setProgress(100);
        setStatus('completed');
        clearInterval(timer);
        
        // Wait 1.5s for completed animation then redirect to plan viewer
        setTimeout(() => {
          eventSource.close();
          navigate(`/planner/${data.planId}`);
        }, 1500);
      } catch (err) {
        // parsing error
      }
    });

    eventSource.addEventListener('error', (event: any) => {
      try {
        const data = JSON.parse(event.data || '{}');
        setStatus('failed');
        setErrorMessage(data.message || 'Generation failed. Please try resetting.');
      } catch (err) {
        setStatus('failed');
        setErrorMessage('Stream failed. Your plan is generating but the connection dropped.');
      }
      clearInterval(timer);
      eventSource.close();
    });

    return () => {
      clearInterval(timer);
      eventSource.close();
    };
  }, [jobId, navigate]);

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
    // Basic estimation: total expected run is 15 seconds.
    const estTotal = 15;
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
            {status === 'queued' && 'Initializing Queue...'}
            {status === 'running' && `Stage: ${STAGES.find(s => s.id === currentStageId)?.name || 'Processing'}`}
            {status === 'completed' && 'Curriculum Assembled!'}
            {status === 'failed' && 'Assembly Failed'}
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
          <div className="rounded-xl bg-red-950/40 border border-red-500/30 p-4 mt-4 text-xs text-red-400 flex flex-col gap-3">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => navigate('/goals/new')}
              className="flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/35 border border-red-500/30 rounded-lg py-2 font-semibold transition text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Reconfigure Goal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
