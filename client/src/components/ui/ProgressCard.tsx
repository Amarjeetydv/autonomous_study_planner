interface ProgressCardProps {
  label: string;
  percentage: number;
  sublabel?: string;
  badge?: string;
  color?: string;
}

export default function ProgressCard({
  label,
  percentage,
  sublabel,
  badge,
  color = 'bg-brand-500',
}: ProgressCardProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className="glass-panel p-4 rounded-xl border border-slate-900 space-y-3">
      <div className="flex justify-between items-center text-xs">
        <div>
          <span className="font-bold text-white block">{label}</span>
          {sublabel && <span className="text-[10px] text-slate-400">{sublabel}</span>}
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-semibold">
              {badge}
            </span>
          )}
          <span className="font-extrabold text-white text-sm">{clampedPercentage}%</span>
        </div>
      </div>

      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
}
