'use client';

import { useState } from 'react';
import { Calendar, Clock, Video, User } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import BottomNav from '@/components/BottomNav';
import {
  DashboardPageTransition,
  DashboardStaggerContainer,
  DashboardStaggerItem,
  DashboardCardHover,
} from '@/components/ui/DashboardMotion';

// ✅ Consistent date formatter to avoid hydration error
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

const sessions = [
  {
    id: 1,
    mentor: 'Sarah Chen',
    topic: 'System Design Basics',
    date: '2025-07-01',
    time: '2:00 PM',
    status: 'upcoming',
    type: '1-on-1 Mentorship',
  },
  {
    id: 2,
    mentor: 'Michael Rodriguez',
    topic: 'Leadership & Tech',
    date: '2025-06-10',
    time: '4:30 PM',
    status: 'past',
    type: 'Mock Interview',
  },
  {
    id: 3,
    mentor: 'Emily Watson',
    topic: 'Data-Driven PM',
    date: '2025-07-05',
    time: '6:00 PM',
    status: 'upcoming',
    type: '1-on-1 Mentorship',
  },
  {
    id: 4,
    mentor: 'Sarah Chen',
    topic: 'Advanced System Design',
    date: '2025-06-01',
    time: '12:00 PM',
    status: 'past',
    type: 'Mock Interview',
  },
];

const SessionCard = ({
  mentor,
  topic,
  date,
  time,
  type,
  status,
}: {
  mentor: string;
  topic: string;
  date: string;
  time: string;
  type: string;
  status: string;
}) => {
  return (
    <DashboardCardHover liftY={-2} className="rounded-2xl border border-[#E8D9CC] bg-[#FFFFFF] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-accent/40 hover:shadow-md transition-all">
      {/* Left: Info */}
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-[#FFFCF8] border border-[#E8D9CC] rounded-full flex items-center justify-center text-[#E85D04]">
          <User size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#2B211C] mb-1">{topic}</h3>
          <p className="text-sm text-[#70645C] mb-2">{type} with {mentor}</p>
          <div className="flex flex-wrap items-center text-sm text-[#70645C] gap-x-4 gap-y-1">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4 text-[#E85D04]" />
              <span>{formatDate(date)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-[#E85D04]" />
              <span>{time}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Button or Status */}
      <div className="md:self-auto self-end">
        {status === 'upcoming' ? (
          <button className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E85D04] to-[#E85D04] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all whitespace-nowrap cursor-pointer">
            <Video className="h-4 w-4" />
            <span>Join Session</span>
          </button>
        ) : (
          <span className="text-xs text-[#E85D04] border border-[#E85D04]/30 bg-[#E85D04]/10 px-3.5 py-1.5 rounded-full whitespace-nowrap font-mono font-medium">
            Completed
          </span>
        )}
      </div>
    </DashboardCardHover>
  );
};

export default function SessionsPage() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const filteredSessions = sessions.filter((s) => s.status === tab);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FFFCF8] text-[#2B211C] flex flex-col font-sans">
        <Navbar />
        <Sidebar userType="learner" />

        <div className="md:ml-64 ml-0 pt-16 md:pt-20 pb-24 md:pb-12 flex-1">
          <DashboardPageTransition className="container-custom space-y-10">
            {/* Header */}
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl md:text-4xl font-bold mb-1 text-[#2B211C]">
                Your <span className="text-[#E85D04]">Sessions</span>
              </h1>
              <p className="text-[#70645C] text-base">Track your upcoming and completed sessions</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-[#E8D9CC] pb-2 overflow-x-auto">
              <button
                onClick={() => setTab('upcoming')}
                className={`text-sm font-medium pb-2 transition-colors cursor-pointer ${
                  tab === 'upcoming'
                    ? 'text-[#E85D04] border-b-2 border-[#E85D04]'
                    : 'text-[#70645C] hover:text-[#2B211C]'
                }`}
              >
                Upcoming Sessions
              </button>
              <button
                onClick={() => setTab('past')}
                className={`text-sm font-medium pb-2 transition-colors cursor-pointer ${
                  tab === 'past'
                    ? 'text-[#E85D04] border-b-2 border-[#E85D04]'
                    : 'text-[#70645C] hover:text-[#2B211C]'
                }`}
              >
                Session History
              </button>
            </div>

            {/* Session List */}
            {filteredSessions.length > 0 ? (
              <DashboardStaggerContainer className="space-y-4 sm:space-y-6">
                {filteredSessions.map((session) => (
                  <DashboardStaggerItem key={session.id}>
                    <SessionCard {...session} />
                  </DashboardStaggerItem>
                ))}
              </DashboardStaggerContainer>
            ) : (
              <div className="text-center text-[#70645C] py-16 rounded-2xl border border-dashed border-[#E8D9CC] bg-[#FFFFFF]">
                No {tab === 'upcoming' ? 'upcoming' : 'past'} sessions yet.
              </div>
            )}
          </DashboardPageTransition>
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
