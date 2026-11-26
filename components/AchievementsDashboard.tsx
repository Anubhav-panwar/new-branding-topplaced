'use client';

import { useState, useEffect } from 'react';
import { Trophy, Star, Award, Share2, Download, Lock, Calendar, Target } from 'lucide-react';
import SocialShare from './SocialShare';

interface Achievement {
  _id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  tier: string;
}

interface UserAchievement {
  _id: string;
  achievementId: Achievement;
  unlockedAt: string;
  isShared: boolean;
  certificateUrl?: string;
  metadata: any;
}

interface UserStats {
  totalAchievements: number;
  totalPoints: number;
  achievementsByTier: Record<string, number>;
  recentAchievements: UserAchievement[];
}

export default function AchievementsDashboard() {
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'unlocked' | 'all'>('unlocked');
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    achievement: Achievement | null;
    shareUrl: string;
  }>({ isOpen: false, achievement: null, shareUrl: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [userAchievementsRes, allAchievementsRes, userStatsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/achievements/user`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/achievements`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/achievements/stats`, { headers })
      ]);

      if (userAchievementsRes.ok) {
        const data = await userAchievementsRes.json();
        setUserAchievements(data);
      }

      if (allAchievementsRes.ok) {
        const data = await allAchievementsRes.json();
        setAllAchievements(data);
      }

      if (userStatsRes.ok) {
        const data = await userStatsRes.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (achievement: Achievement) => {
    const shareUrl = `${window.location.origin}/achievements/${achievement._id}`;
    setShareModal({
      isOpen: true,
      achievement,
      shareUrl
    });
  };

  const handleGenerateCertificate = async (achievementId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/achievements/certificate/${achievementId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        window.open(data, '_blank');
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-amber-700';
      case 'silver': return 'text-slate-600';
      case 'gold': return 'text-amber-500';
      case 'platinum': return 'text-indigo-600';
      default: return 'text-slate-600';
    }
  };

  const getTierBg = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-50/80 border-orange-200';
      case 'silver': return 'bg-slate-50 border-slate-200';
      case 'gold': return 'bg-amber-50/80 border-amber-200';
      case 'platinum': return 'bg-indigo-50/80 border-indigo-200';
      default: return 'bg-white border-[#F1D2B8]';
    }
  };

  const unlockedAchievementIds = userAchievements.map(ua => ua.achievementId?._id);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>

        {/* Social Share Modal */}
        <SocialShare
          isOpen={shareModal.isOpen}
          onClose={() => setShareModal({ isOpen: false, achievement: null, shareUrl: '' })}
          achievement={shareModal.achievement!}
          shareUrl={shareModal.shareUrl}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight mb-1">Achievements</h1>
          <p className="text-sm text-[#64748B]">Track your progress and unlock rewards</p>
        </div>
        <div className="flex items-center space-x-2 bg-white border border-[#F1D2B8] px-4 py-2 rounded-xl shadow-xs">
          <Trophy className="text-[#F26A0A]" size={26} />
          <span className="text-2xl font-black text-[#111827]">{userStats?.totalPoints || 0}</span>
          <span className="text-xs text-[#64748B] font-semibold">points</span>
        </div>
      </div>

      {/* Stats Cards */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#F1D2B8] rounded-2xl p-4 text-center shadow-xs">
            <div className="text-2xl font-black text-[#F26A0A] mb-1">
              {userStats.totalAchievements}
            </div>
            <div className="text-xs text-[#64748B]">Total Unlocked</div>
          </div>
          <div className="bg-white border border-[#F1D2B8] rounded-2xl p-4 text-center shadow-xs">
            <div className="text-2xl font-black text-amber-500 mb-1">
              {userStats.achievementsByTier.gold || 0}
            </div>
            <div className="text-xs text-[#64748B]">Gold Tier</div>
          </div>
          <div className="bg-white border border-[#F1D2B8] rounded-2xl p-4 text-center shadow-xs">
            <div className="text-2xl font-black text-slate-600 mb-1">
              {userStats.achievementsByTier.silver || 0}
            </div>
            <div className="text-xs text-[#64748B]">Silver Tier</div>
          </div>
          <div className="bg-white border border-[#F1D2B8] rounded-2xl p-4 text-center shadow-xs">
            <div className="text-2xl font-black text-orange-600 mb-1">
              {userStats.achievementsByTier.bronze || 0}
            </div>
            <div className="text-xs text-[#64748B]">Bronze Tier</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-[#F1F5F9] p-1 rounded-xl w-fit border border-[#F1D2B8]">
        <button
          onClick={() => setActiveTab('unlocked')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'unlocked'
              ? 'bg-white text-[#F26A0A] shadow-xs'
              : 'text-[#64748B] hover:text-[#111827]'
          }`}
        >
          Unlocked ({userAchievements.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-white text-[#F26A0A] shadow-xs'
              : 'text-[#64748B] hover:text-[#111827]'
          }`}
        >
          All ({allAchievements.length})
        </button>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'unlocked' ? (
          userAchievements.map((userAchievement) => {
            const achievement = userAchievement.achievementId;
            if (!achievement) return null;
            return (
              <div
                key={userAchievement._id}
                className={`rounded-2xl border p-6 shadow-xs transition-all hover:shadow-md ${getTierBg(achievement.tier)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleShare(achievement)}
                      className="p-2 hover:bg-white rounded-lg text-[#64748B] hover:text-[#F26A0A] transition-colors"
                      title="Share Achievement"
                    >
                      <Share2 size={16} />
                    </button>
                    <button
                      onClick={() => handleGenerateCertificate(achievement._id)}
                      className="p-2 hover:bg-white rounded-lg text-[#64748B] hover:text-[#F26A0A] transition-colors"
                      title="Generate Certificate"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-base font-bold text-[#111827] mb-1.5">{achievement.title}</h3>
                <p className="text-[#64748B] text-xs mb-3 leading-relaxed">{achievement.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Star size={14} className={getTierColor(achievement.tier)} />
                    <span className={`text-xs font-bold ${getTierColor(achievement.tier)}`}>
                      {achievement.tier.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Trophy size={14} className="text-[#F26A0A]" />
                    <span className="text-xs font-bold text-[#111827]">{achievement.points}</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-[#F1D2B8]">
                  <div className="flex items-center text-[11px] text-[#64748B]">
                    <Calendar size={12} className="mr-1" />
                    Unlocked {new Date(userAchievement.unlockedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          allAchievements.map((achievement) => {
            const isUnlocked = unlockedAchievementIds.includes(achievement._id);
            return (
              <div
                key={achievement._id}
                className={`rounded-2xl border p-6 transition-all ${
                  isUnlocked ? `${getTierBg(achievement.tier)} shadow-xs` : 'bg-white border-[#F1D2B8] opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">
                    {isUnlocked ? achievement.icon : '🔒'}
                  </div>
                  {!isUnlocked && (
                    <Lock size={16} className="text-[#64748B]" />
                  )}
                </div>
                
                <h3 className="text-base font-bold text-[#111827] mb-1.5">{achievement.title}</h3>
                <p className="text-[#64748B] text-xs mb-3 leading-relaxed">{achievement.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Star size={14} className={getTierColor(achievement.tier)} />
                    <span className={`text-xs font-bold ${getTierColor(achievement.tier)}`}>
                      {achievement.tier.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Trophy size={14} className="text-[#F26A0A]" />
                    <span className="text-xs font-bold text-[#111827]">{achievement.points}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {activeTab === 'unlocked' && userAchievements.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-[#F1D2B8]">
          <Target size={44} className="text-[#64748B] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#111827] mb-1">No achievements yet</h3>
          <p className="text-xs text-[#64748B]">Complete interviews and improve your skills to unlock achievements!</p>
        </div>
      )}
    </div>
  );
}
