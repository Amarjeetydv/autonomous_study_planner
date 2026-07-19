import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Award, ArrowLeft, Shield, Flame, BookOpen, RefreshCw, 
  CheckCircle, CheckCircle2, Lock, Loader2 
} from 'lucide-react';
import apiClient from '../../services/api/client';

interface AchievementDef {
  _id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  unlockConditions: {
    conditionType: string;
    targetValue: number;
  };
}

interface UserAchievement {
  _id: string;
  achievementId: AchievementDef;
  unlockedAt: string | null;
  progress: number;
  claimed: boolean;
}

interface UserLevel {
  currentLevel: number;
  totalXP: number;
  currentXP: number;
  nextLevelXP: number;
}

export default function TrophyCase() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<'All' | 'Unlocked' | 'Locked'>('All');

  // Fetch master list of definitions
  const { data: allDefs, isLoading: isDefsLoading } = useQuery({
    queryKey: ['achievementDefinitionsList'],
    queryFn: async () => {
      const response = await apiClient.get('/achievements');
      return response.data.data.achievements as AchievementDef[];
    }
  });

  // Fetch user unlocked progress
  const { data: userAchs, isLoading: isUserAchsLoading } = useQuery({
    queryKey: ['userAchievementsProgress'],
    queryFn: async () => {
      const response = await apiClient.get('/achievements/unlocked');
      return response.data.data.achievements as UserAchievement[];
    }
  });

  // Fetch user level parameters
  const { data: userLevel, isLoading: isLevelLoading } = useQuery({
    queryKey: ['userLevelDetails'],
    queryFn: async () => {
      const response = await apiClient.get('/level');
      return response.data.data.level as UserLevel;
    }
  });

  // Recalculate level mutation
  const recalculateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/level/recalculate');
      return response.data.data.level;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userLevelDetails'] });
      queryClient.invalidateQueries({ queryKey: ['userAchievementsProgress'] });
    }
  });

  if (isDefsLoading || isUserAchsLoading || isLevelLoading || !userLevel || !allDefs) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
        <p className="text-sm">Accessing trophy vaults & XP balances...</p>
      </div>
    );
  }

  // Compile achievements with user progress
  const achievements = allDefs.map(def => {
    const userAch = userAchs?.find(ua => ua.achievementId?._id === def._id);
    return {
      definition: def,
      unlockedAt: userAch ? userAch.unlockedAt : null,
      progress: userAch ? userAch.progress : 0,
      claimed: userAch ? userAch.claimed : false,
    };
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5';
      case 'Epic': return 'text-purple-400 border-purple-500/20 bg-purple-500/5';
      case 'Rare': return 'text-blue-400 border-blue-500/20 bg-blue-500/5';
      default: return 'text-slate-400 border-slate-800 bg-slate-900/10';
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return <Flame className="h-6 w-6" />;
      case 'BookOpen': return <BookOpen className="h-6 w-6" />;
      case 'Bot': return <Award className="h-6 w-6 text-brand-400" />;
      case 'CheckCircle': return <CheckCircle className="h-6 w-6 text-emerald-400" />;
      default: return <Award className="h-6 w-6" />;
    }
  };

  const xpPercent = Math.min(100, Math.round((userLevel.currentXP / userLevel.nextLevelXP) * 100));

  const filteredAchs = achievements.filter(ach => {
    if (filterType === 'Unlocked') return !!ach.unlockedAt;
    if (filterType === 'Locked') return !ach.unlockedAt;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Lights */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto space-y-8 z-10 relative">
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
              <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-brand-400" />
                Trophy Case & Badges
              </h1>
              <p className="text-slate-400 text-xs mt-1">Unlock rewards by logging streaks, quiz scores, and daily revisions.</p>
            </div>
          </div>

          <button
            onClick={() => recalculateMutation.mutate()}
            disabled={recalculateMutation.isPending}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-slate-800 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} />
            Sync XP
          </button>
        </div>

        {/* Level Banner Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
            <Shield className="h-9 w-9" />
          </div>

          <div className="flex-1 space-y-3 w-full">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Current rank</span>
                <h2 className="text-lg font-extrabold text-white">Level {userLevel.currentLevel} Scholar</h2>
              </div>
              <span className="text-xs font-bold text-slate-400">{userLevel.currentXP} / {userLevel.nextLevelXP} XP</span>
            </div>

            <div className="w-full h-3 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-500 rounded-full transition-all duration-500" 
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filters and List */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {(['All', 'Unlocked', 'Locked'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterType(tab)}
                  className={`px-4 py-1.5 rounded-full border text-xs font-bold transition ${
                    filterType === tab 
                      ? 'bg-brand-500/10 text-brand-400 border-brand-500/20' 
                      : 'bg-slate-900 text-slate-400 border-transparent hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <span className="text-xs text-slate-500 font-semibold">{filteredAchs.length} Badges listed</span>
          </div>

          {/* Grid list */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredAchs.map((ach) => {
              const isUnlocked = !!ach.unlockedAt;
              const def = ach.definition;
              const rarityColor = getRarityColor(def.rarity);

              return (
                <div 
                  key={def._id} 
                  className={`glass-panel p-5 rounded-2xl border relative flex flex-col justify-between transition-all ${
                    isUnlocked 
                      ? 'border-slate-800 bg-slate-900/10' 
                      : 'border-slate-900/60 opacity-40 bg-slate-950/20'
                  }`}
                >
                  <div>
                    {/* Badge header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${rarityColor}`}>
                        {isUnlocked ? getIcon(def.icon) : <Lock className="h-5 w-5 text-slate-600" />}
                      </div>

                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold border ${rarityColor}`}>
                        +{def.xpReward} XP
                      </span>
                    </div>

                    <h3 className="font-extrabold text-white text-sm">{def.title}</h3>
                    <p className="text-slate-400 text-[11px] mt-1.5 leading-relaxed">{def.description}</p>
                  </div>

                  {/* Progress bars if locked */}
                  <div className="mt-5 pt-3 border-t border-slate-900 text-xs">
                    {isUnlocked ? (
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Unlocked</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-[10px] text-slate-500">
                        <div className="flex justify-between">
                          <span>Progress</span>
                          <span>{ach.progress} / {def.unlockConditions?.targetValue}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-slate-800" 
                            style={{ width: `${Math.min(100, Math.round((ach.progress / (def.unlockConditions?.targetValue || 1)) * 100))}%` }}
                          />
                        </div>
                      </div>
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
