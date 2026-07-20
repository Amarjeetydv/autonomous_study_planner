import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  onClick?: () => void;
}

export default function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor = 'text-brand-400',
  trend,
  trendType = 'positive',
  onClick,
}: StatCardProps) {
  const getTrendColor = () => {
    if (trendType === 'positive') return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
    if (trendType === 'negative') return 'text-red-400 bg-red-950/60 border-red-500/30';
    return 'text-slate-400 bg-slate-900 border-slate-800';
  };

  return (
    <div
      onClick={onClick}
      className={`glass-panel p-5 rounded-2xl border border-slate-900 space-y-2 transition-all ${
        onClick ? 'cursor-pointer hover:border-slate-800 hover:scale-[1.01]' : ''
      }`}
    >
      <div className="flex justify-between items-center text-slate-400">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</span>
        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <p className="text-2xl font-extrabold text-white">{value}</p>
        {trend && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getTrendColor()}`}>
            {trend}
          </span>
        )}
      </div>

      {subtext && <p className="text-xs text-slate-400 font-medium">{subtext}</p>}
    </div>
  );
}
