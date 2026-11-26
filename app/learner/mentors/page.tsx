'use client';

import {
  Star,
  Calendar,
  DollarSign,
  MapPin,
  Filter
} from 'lucide-react';

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

export default function MentorsPage() {
  const mentors = [
    {
      id: 1,
      name: 'Sarah Chen',
      title: 'Senior Software Engineer at Google',
      avatar: '👩‍💻',
      rating: 4.9,
      reviews: 124,
      hourlyRate: 150,
      location: 'San Francisco, CA',
      skills: ['System Design', 'JavaScript', 'React', 'Node.js'],
      bio: 'Helping developers land FAANG roles with 8+ years at top tech companies.'
    },
    {
      id: 2,
      name: 'Michael Rodriguez',
      title: 'Principal Engineer at Microsoft',
      avatar: '👨‍💻',
      rating: 4.8,
      reviews: 89,
      hourlyRate: 200,
      location: 'Seattle, WA',
      skills: ['System Architecture', 'Cloud Computing', 'Leadership', 'C#'],
      bio: 'Former startup founder, now leading distributed systems at Microsoft.'
    },
    {
      id: 3,
      name: 'Emily Watson',
      title: 'Product Manager at Meta',
      avatar: '👩‍💼',
      rating: 4.9,
      reviews: 156,
      hourlyRate: 175,
      location: 'Menlo Park, CA',
      skills: ['Product Strategy', 'Data Analysis', 'User Research', 'Growth'],
      bio: 'Launched products used by millions. Specialized in 0-1 product development.'
    }
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FFFCF8] text-[#2B211C]">
        <Navbar />
        <Sidebar userType="learner" />

        <div className="md:ml-64 ml-0 pt-16 md:pt-20 pb-24 md:pb-12">
          <DashboardPageTransition className="container-custom space-y-10">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-1">
                  Find Your <span className="gradient-text">Mentor</span>
                </h1>
                <p className="text-[#70645C] text-lg">Connect with industry experts for personalized guidance</p>
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 border border-[#E8D9CC] bg-[#FFFFFF] rounded-xl hover:border-[#E85D04] hover:bg-[#FFFCF8] transition shadow-sm">
                <Filter className="h-4 w-4 text-[#E85D04]" />
                <span className="text-sm font-medium">Filters</span>
              </button>
            </div>

            {/* Filters */}
            <DashboardCardHover liftY={-2} className="rounded-2xl bg-[#FFFFFF] border border-[#E8D9CC] shadow-sm p-6">
              <div className="grid md:grid-cols-4 gap-4">
                <select className="px-4 py-2 bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl text-sm text-[#2B211C] focus:outline-none focus:border-[#E85D04]">
                  <option>All Skills</option>
                  <option>System Design</option>
                  <option>JavaScript</option>
                  <option>Product Management</option>
                </select>
                <select className="px-4 py-2 bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl text-sm text-[#2B211C] focus:outline-none focus:border-[#E85D04]">
                  <option>Price Range</option>
                  <option>$50 - $100</option>
                  <option>$100 - $200</option>
                  <option>$200+</option>
                </select>
                <select className="px-4 py-2 bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl text-sm text-[#2B211C] focus:outline-none focus:border-[#E85D04]">
                  <option>Company</option>
                  <option>Google</option>
                  <option>Meta</option>
                  <option>Microsoft</option>
                </select>
                <select className="px-4 py-2 bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl text-sm text-[#2B211C] focus:outline-none focus:border-[#E85D04]">
                  <option>Availability</option>
                  <option>This Week</option>
                  <option>Next Week</option>
                  <option>This Month</option>
                </select>
              </div>
            </DashboardCardHover>

            {/* Mentor Cards */}
            <DashboardStaggerContainer className="grid lg:grid-cols-2 gap-8">
              {mentors.map((mentor) => (
                <DashboardStaggerItem key={mentor.id}>
                  <DashboardCardHover
                    liftY={-3}
                    className="rounded-2xl bg-[#FFFFFF] border border-[#E8D9CC] shadow-sm p-6 hover:border-[#E85D04]/40 transition-all duration-300 h-full flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="w-16 h-16 bg-[#E85D04] rounded-full flex items-center justify-center text-2xl shadow-sm">
                          {mentor.avatar}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-[#2B211C]">{mentor.name}</h3>
                          <p className="text-sm text-[#70645C] mb-2">{mentor.title}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-[#70645C] mb-2">
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="font-medium text-[#2B211C]">{mentor.rating}</span>
                              <span>({mentor.reviews} reviews)</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4 text-[#E85D04]" />
                              <span>${mentor.hourlyRate}/hr</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4 text-[#70645C]" />
                              <span>{mentor.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-[#70645C] mb-4 leading-relaxed">{mentor.bio}</p>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {mentor.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1 bg-[#FFFCF8] text-[#E85D04] border border-[#E8D9CC] text-xs rounded-full font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <button className="btn-primary flex-1 flex items-center justify-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Book Session</span>
                      </button>
                      <button className="px-4 py-2 border border-[#E8D9CC] rounded-xl hover:border-[#E85D04] hover:bg-[#FFFCF8] transition text-sm font-medium">
                        View Profile
                      </button>
                    </div>
                  </DashboardCardHover>
                </DashboardStaggerItem>
              ))}
            </DashboardStaggerContainer>

            {/* Load More */}
            <div className="text-center pt-2">
              <button className="btn-secondary px-6 py-3 text-sm">
                Load More Mentors
              </button>
            </div>
          </DashboardPageTransition>
        </div>
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
