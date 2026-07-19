import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Flame, Sparkles, Loader2 } from 'lucide-react';
import apiClient from '../../services/api/client';

interface DailyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedCount: number;
  missedCount: number;
  skippedCount: number;
}

export default function DailyCheckInModal({ 
  isOpen, 
  onClose,
  completedCount,
  missedCount,
  skippedCount
}: DailyCheckInModalProps) {
  const queryClient = useQueryClient();
  const [mood, setMood] = useState<'Excellent' | 'Good' | 'Neutral' | 'Stressed' | 'Burnout'>('Good');
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [focusLevel, setFocusLevel] = useState<number>(3);
  const [confidenceLevel, setConfidenceLevel] = useState<number>(3);
  const [difficultyLevel, setDifficultyLevel] = useState<number>(3);
  const [productivityRating, setProductivityRating] = useState<number>(3);
  const [plannedHours, setPlannedHours] = useState<number>(4);
  const [actualHours, setActualHours] = useState<number>(4);
  const [notes, setNotes] = useState<string>('');

  const [selectedBlockers, setSelectedBlockers] = useState<string[]>([]);
  const [aiResponse, setAiResponse] = useState<any | null>(null);

  const blockersList = [
    'Fatigue / Lack of Sleep',
    'Unclear Study Materials',
    'Distracting Environment',
    'High Topic Difficulty',
    'Time Constraints',
    'None'
  ];

  const toggleBlocker = (blocker: string) => {
    if (blocker === 'None') {
      setSelectedBlockers(['None']);
      return;
    }
    const filtered = selectedBlockers.filter(b => b !== 'None');
    if (filtered.includes(blocker)) {
      setSelectedBlockers(filtered.filter(b => b !== blocker));
    } else {
      setSelectedBlockers([...filtered, blocker]);
    }
  };

  // Submit checkin mutation
  const checkinMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await apiClient.post('/check-ins', payload);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['todayCheckIn'] });
      queryClient.invalidateQueries({ queryKey: ['streakData'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsData'] });
      setAiResponse(data.checkIn.aiInsights);
    }
  });

  const handleSubmit = () => {
    checkinMutation.mutate({
      date: new Date().toISOString(),
      mood,
      energyLevel,
      focusLevel,
      confidenceLevel,
      difficultyLevel,
      productivityRating,
      plannedStudyHours: Number(plannedHours),
      actualStudyHours: Number(actualHours),
      completedTasks: completedCount,
      missedTasks: missedCount,
      skippedTasks: skippedCount,
      blockers: selectedBlockers,
      notes
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="glass-panel p-6 rounded-2xl max-w-xl w-full border border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {aiResponse ? (
          // Success & AI Insights screen
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <Flame className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Daily Logs Recorded</h3>
              <p className="text-xs text-slate-400 mt-1">Consistency metrics updated. Here is your AI feedback summary:</p>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="flex gap-2">
                <Sparkles className="h-5 w-5 text-brand-400 shrink-0" />
                <p className="text-slate-200 font-semibold italic">"{aiResponse.summary}"</p>
              </div>

              {aiResponse.insights?.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Observations</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300">
                    {aiResponse.insights.map((ins: string, idx: number) => (
                      <li key={idx}>{ins}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiResponse.suggestions?.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Suggestions</span>
                  <ul className="list-disc pl-4 space-y-1 text-brand-300 font-medium">
                    {aiResponse.suggestions.map((sug: string, idx: number) => (
                      <li key={idx}>{sug}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiResponse.hourAdjustment !== 0 && (
                <p className="text-amber-400 font-semibold mt-2">
                  💡 Recommendation: Offset study allocation by {aiResponse.hourAdjustment} minutes tomorrow to avoid burnout.
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full bg-brand-500 text-white rounded-xl py-3.5 text-xs font-semibold hover:bg-brand-600 transition"
            >
              Continue to Dashboard
            </button>
          </div>
        ) : (
          // Input Form Screen
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white">Daily Study Check-in</h2>
              <p className="text-xs text-slate-400 mt-1">Reflect on your focus, logs, and energy today to optimize tomorrow.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  General Mood
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['Excellent', 'Good', 'Neutral', 'Stressed', 'Burnout'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMood(m)}
                      className={`text-xs py-2 px-1 rounded-lg border font-semibold text-center transition ${
                        mood === m 
                          ? 'bg-brand-500/20 text-brand-400 border-brand-500/30' 
                          : 'bg-slate-900/40 text-slate-400 border-slate-900 hover:border-slate-850'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Planned Hours
                  </label>
                  <input
                    type="number"
                    value={plannedHours}
                    onChange={(e) => setPlannedHours(Number(e.target.value))}
                    className="block w-full rounded-xl border border-slate-850 bg-slate-900/30 py-2.5 px-4 text-xs text-slate-100 outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Actual Hours
                  </label>
                  <input
                    type="number"
                    value={actualHours}
                    onChange={(e) => setActualHours(Number(e.target.value))}
                    className="block w-full rounded-xl border border-slate-850 bg-slate-900/30 py-2.5 px-4 text-xs text-slate-100 outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Rating sliders */}
            <div className="space-y-4 pt-3 border-t border-slate-900">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Energy Level', val: energyLevel, set: setEnergyLevel },
                  { label: 'Focus level', val: focusLevel, set: setFocusLevel },
                  { label: 'Confidence Level', val: confidenceLevel, set: setConfidenceLevel },
                  { label: 'Topic Difficulty', val: difficultyLevel, set: setDifficultyLevel },
                  { label: 'Productivity level', val: productivityRating, set: setProductivityRating }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="text-brand-400 font-bold">{item.val} / 5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={item.val}
                      onChange={(e) => item.set(Number(e.target.value))}
                      className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-brand-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Blockers */}
            <div className="pt-3 border-t border-slate-900">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Blockers Faced Today
              </label>
              <div className="flex flex-wrap gap-2">
                {blockersList.map((blocker) => (
                  <button
                    key={blocker}
                    type="button"
                    onClick={() => toggleBlocker(blocker)}
                    className={`text-xs py-1.5 px-3 rounded-lg border font-semibold transition ${
                      selectedBlockers.includes(blocker)
                        ? 'bg-brand-500/20 text-brand-400 border-brand-500/30'
                        : 'bg-slate-900/40 text-slate-400 border-slate-900 hover:border-slate-850'
                    }`}
                  >
                    {blocker}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Reflections & Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Log study breakthroughs, focus patterns, or blockers details..."
                className="block w-full rounded-xl border border-slate-850 bg-slate-900/30 py-2.5 px-4 text-xs text-slate-100 outline-none focus:border-brand-500 resize-none"
              />
            </div>

            {/* Footer triggers */}
            <div className="flex gap-3 pt-3 border-t border-slate-900">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={checkinMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-500 text-white rounded-xl py-3.5 text-xs font-bold hover:bg-brand-600 transition disabled:opacity-50"
              >
                {checkinMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Feedback...
                  </>
                ) : (
                  'Log Check-in'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-900 border border-slate-850 text-slate-400 rounded-xl px-5 py-3.5 text-xs font-semibold hover:bg-slate-850 hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
