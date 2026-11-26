'use client';

import { Trophy, Star, Target, Award, Medal, Crown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import BottomNav from '@/components/BottomNav';

export default function AchievementsPage() {
  const achievements = [
    {
      id: 1,
      title: 'First Interview',
      description: 'Complete your first AI mock interview',
      icon: Trophy,
      earned: true,
      earnedDate: '2024-01-15',
      points: 100,
      rarity: 'common'
    },
    {
      id: 2,
      title: 'Interview Specialist',
      description: 'Complete 10 mock interviews',
      icon: Star,
      earned: true,
      earnedDate: '2024-01-20',
      points: 500,
      rarity: 'rare'
    },
    {
      id: 3,
      title: 'Perfect Score',
      description: 'Achieve 100% score in any interview',
      icon: Target,
      earned: false,
      points: 1000,
      rarity: 'epic'
    },
    {
      id: 4,
      title: 'Mentor Connection',
      description: 'Book your first mentor session',
      icon: Award,
      earned: true,
      earnedDate: '2024-01-18',
      points: 200,
      rarity: 'common'
    },
    {
      id: 5,
      title: 'Skill Master',
      description: 'Improve 5 different skills',
      icon: Medal,
      earned: false,
      points: 750,
      rarity: 'rare'
    },
    {
      id: 6,
      title: 'Interview Legend',
      description: 'Complete 50 mock interviews',
      icon: Crown,
      earned: false,
      points: 2000,
      rarity: 'legendary'
    }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'text-[#70645C] border-[#E8D9CC] bg-[#FFFCF8]';
      case 'rare':
        return 'text-[#E85D04] border-[#E8D9CC] bg-[#FFF0E6]';
      case 'epic':
        return 'text-purple-700 border-purple-200 bg-purple-50';
      case 'legendary':
        return 'text-amber-700 border-amber-300 bg-amber-50';
      default:
        return 'text-[#70645C] border-[#E8D9CC] bg-[#FFFCF8]';
    }
  };

  const totalPoints = achievements.filter(a => a.earned).reduce((sum, a) => sum + a.points, 0);
  const earnedCount = achievements.filter(a => a.earned).length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F8F0E6] text-[#2B211C] flex flex-col font-sans selection:bg-[#FFF0E6] selection:text-[#E85D04]">
        <Navbar />
        <Sidebar userType="learner" />

        <div className="md:ml-64 ml-0 pt-16 md:pt-20 pb-24 md:pb-12">
          <div className="max-w-none w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#E8D9CC] text-xs font-semibold text-[#E85D04] uppercase tracking-wider mb-2 shadow-xs">
                Milestones & Badges
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#2B211C]">
                Your <span className="bg-gradient-to-r from-[#E85D04] to-[#E85D04] bg-clip-text text-transparent">Achievements</span>
              </h1>
              <p className="text-[#70645C] text-base mt-1">Track your progress and unlock milestone rewards</p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-[#E8D9CC] bg-[#FFFFFF] text-center p-6 shadow-xs">
                <Trophy className="h-8 w-8 text-[#E85D04] mx-auto mb-3" />
                <div className="text-3xl font-extrabold text-[#2B211C]">{earnedCount}</div>
                <div className="text-[#70645C] text-sm mt-1">Achievements Earned</div>
              </div>
              <div className="rounded-2xl border border-[#E8D9CC] bg-[#FFFFFF] text-center p-6 shadow-xs">
                <Star className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                <div className="text-3xl font-extrabold text-[#2B211C]">{totalPoints}</div>
                <div className="text-[#70645C] text-sm mt-1">Total Points</div>
              </div>
              <div className="rounded-2xl border border-[#E8D9CC] bg-[#FFFFFF] text-center p-6 shadow-xs">
                <Target className="h-8 w-8 text-[#E85D04] mx-auto mb-3" />
                <div className="text-3xl font-extrabold text-[#2B211C]">
                  {Math.round((earnedCount / achievements.length) * 100)}%
                </div>
                <div className="text-[#70645C] text-sm mt-1">Completion Rate</div>
              </div>
            </div>

            {/* Achievements Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((a) => {
                const Icon = a.icon;
                const rarityStyle = getRarityColor(a.rarity);

                return (
                  <div
                    key={a.id}
                    className={`text-center border rounded-2xl p-6 transition-all duration-300 ${
                      a.earned
                        ? 'bg-[#FFFFFF] border-[#E8D9CC] shadow-sm'
                        : 'bg-[#FFFCF8]/70 border-[#E8D9CC]/70 opacity-60'
                    }`}
                  >
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl border flex items-center justify-center ${
                      a.earned ? 'bg-[#FFF0E6] border-[#E8D9CC] text-[#E85D04]' : 'bg-[#FFFCF8] border-[#E8D9CC] text-[#70645C]'
                    }`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-base font-bold text-[#2B211C] mb-1.5">{a.title}</h3>
                    <p className="text-xs text-[#70645C] mb-4 leading-relaxed">{a.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2.5 py-0.5 rounded-full border capitalize font-semibold ${rarityStyle}`}>
                        {a.rarity}
                      </span>
                      <span className="text-[#E85D04] font-bold">{a.points} pts</span>
                    </div>
                    {a.earned && a.earnedDate && (
                      <div className="mt-3 pt-3 border-t border-[#E8D9CC]">
                        <span className="text-xs text-[#70645C]">
                          Earned on {new Date(a.earnedDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Next Milestones */}
            <div className="rounded-2xl border border-[#E8D9CC] bg-[#FFFFFF] p-6 shadow-xs">
              <h2 className="text-lg font-bold text-[#2B211C] mb-4">Next Milestones</h2>
              <div className="space-y-3">
                {achievements
                  .filter((a) => !a.earned)
                  .slice(0, 3)
                  .map((a) => {
                    const Icon = a.icon;
                    return (
                      <div
                        key={a.id}
                        className="flex items-center justify-between p-4 bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl hover:border-[#E85D04] transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5 text-[#70645C]" />
                          <div>
                            <div className="font-semibold text-sm text-[#2B211C]">{a.title}</div>
                            <div className="text-xs text-[#70645C]">{a.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[#E85D04] font-bold text-xs">{a.points} pts</div>
                          <div className="text-[11px] text-[#70645C] capitalize">{a.rarity}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
