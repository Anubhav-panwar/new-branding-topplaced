'use client';

import { useEffect, useState, useMemo } from 'react';
import { Mic, Brain, Sparkles, Volume2, UserCheck, Eye, Activity } from 'lucide-react';

export type AIAvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface AIAvatarProps {
  isActive: boolean;
  state?: AIAvatarState;
  theme?: 'light' | 'dark';
  interviewerName?: string;
  interviewerRole?: string;
}

export default function AIAvatar({
  isActive,
  state,
  theme = 'dark',
  interviewerName = 'Sarah',
  interviewerRole = 'Principal Interviewer'
}: AIAvatarProps) {
  // Determine actual state
  const currentState: AIAvatarState = useMemo(() => {
    if (state) return state;
    return isActive ? 'speaking' : 'listening';
  }, [state, isActive]);

  const [breathingPhase, setBreathingPhase] = useState(0);
  const [speechBars, setSpeechBars] = useState<number[]>([12, 18, 28, 22, 14]);
  const [pupilPosition, setPupilPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Ambient natural breathing loop
  useEffect(() => {
    const breathingInterval = setInterval(() => {
      setBreathingPhase((prev) => (prev + 1) % 120);
    }, 80);

    return () => clearInterval(breathingInterval);
  }, []);

  // Eye micro-tracking when listening to candidate
  useEffect(() => {
    if (currentState === 'listening') {
      const eyeInterval = setInterval(() => {
        setPupilPosition({
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 3,
        });
      }, 1400);
      return () => clearInterval(eyeInterval);
    } else {
      setPupilPosition({ x: 0, y: 0 });
    }
  }, [currentState]);

  // Audio-reactive speech / lip-sync frequency simulation
  useEffect(() => {
    if (currentState !== 'speaking') {
      setSpeechBars([8, 10, 12, 10, 8]);
      return;
    }

    const speechInterval = setInterval(() => {
      setSpeechBars([
        Math.floor(10 + Math.random() * 22),
        Math.floor(16 + Math.random() * 28),
        Math.floor(22 + Math.random() * 32),
        Math.floor(16 + Math.random() * 28),
        Math.floor(10 + Math.random() * 22),
      ]);
    }, 100);

    return () => clearInterval(speechInterval);
  }, [currentState]);

  const breathingScale = 1 + Math.sin(breathingPhase * 0.08) * 0.02;
  const eyeBlinkPhase = Math.floor(breathingPhase / 30) % 4; // Blinks periodically
  const isLight = theme === 'light';

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center relative overflow-hidden select-none transition-colors duration-500 pb-8 ${
        isLight
          ? 'bg-gradient-to-br from-[#FAF7F0] via-[#F4EFE2] to-[#E9E2CE]'
          : 'bg-gradient-to-br from-[#06090D] via-[#0A0E14] to-[#040608]'
      }`}
    >
      {/* Background Ambient Aura Glow */}
      <div
        className={`absolute inset-0 transition-all duration-700 pointer-events-none ${
          currentState === 'speaking'
            ? 'bg-gradient-to-r from-emerald-500/20 via-[#F26A0A]/25 to-teal-500/20 opacity-100'
            : currentState === 'thinking'
            ? 'bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-cyan-500/15 opacity-100'
            : 'opacity-40 bg-radial from-emerald-950/20 to-transparent'
        }`}
      />

      {/* Ripple Rings when Speaking */}
      {currentState === 'speaking' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`absolute rounded-full animate-ping ${
                isLight ? 'border border-emerald-600/20' : 'border border-[#F26A0A]/30'
              }`}
              style={{
                width: `${110 + i * 40}px`,
                height: `${110 + i * 40}px`,
                animationDelay: `${i * 0.35}s`,
                animationDuration: '2.8s',
              }}
            />
          ))}
        </div>
      )}

      {/* Main AI Interviewer Avatar Head & Body */}
      <div
        className="relative z-10 transition-transform duration-300 flex flex-col items-center"
        style={{ transform: `scale(${breathingScale})` }}
      >
        {/* Head / Orb Container */}
        <div
          className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
            currentState === 'speaking'
              ? 'bg-gradient-to-br from-[#0A1612] via-[#0E231C] to-[#081510] border-2 border-[#F26A0A] shadow-[0_0_40px_rgba(242,106,10,0.4)]'
              : currentState === 'thinking'
              ? 'bg-gradient-to-br from-[#1C1917] via-[#292524] to-[#451A03] border-2 border-amber-400/80 shadow-[0_0_35px_rgba(245,158,11,0.35)]'
              : isLight
              ? 'bg-gradient-to-br from-[#1E1B4B] via-[#2E2A72] to-[#3730A3] border-2 border-[#EBE5D2] shadow-md'
              : 'bg-gradient-to-br from-[#0C1217] via-[#111A22] to-[#080D12] border-2 border-[#F26A0A]/30 shadow-[0_0_25px_rgba(242,106,10,0.15)]'
          }`}
        >
          {/* Subtle Outer Ring Specular */}
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-[#F26A0A]/20 via-transparent to-black/40 pointer-events-none" />

          {/* AI Face & Expression Controls */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Eyes */}
            <div className="flex space-x-4 mb-2.5">
              {[0, 1].map((eyeIndex) => (
                <div
                  key={eyeIndex}
                  className={`relative flex items-center justify-center rounded-full transition-all duration-150 ${
                    eyeBlinkPhase === 0
                      ? 'w-3 h-3 bg-white shadow-[0_0_10px_rgba(242,106,10,0.9)]'
                      : 'w-3 h-0.5 bg-emerald-400/80'
                  }`}
                >
                  {eyeBlinkPhase === 0 && (
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-[#052e16] transition-transform duration-200"
                      style={{
                        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Neural Brain / Synapse Center */}
            <div className="relative">
              <Brain
                size={24}
                className={`transition-colors duration-500 ${
                  currentState === 'speaking'
                    ? 'text-[#F26A0A] drop-shadow-[0_0_10px_rgba(242,106,10,0.9)]'
                    : currentState === 'thinking'
                    ? 'text-amber-300 animate-pulse drop-shadow-[0_0_8px_rgba(252,211,77,0.7)]'
                    : 'text-emerald-400/70'
                }`}
              />
              {currentState === 'thinking' && (
                <div className="absolute -inset-1 rounded-full border border-amber-400/40 animate-spin" />
              )}
            </div>

            {/* Dynamic Mouth / Voice Spectrum Waveform */}
            <div className="flex items-center space-x-1 mt-2.5 h-5">
              {speechBars.map((height, idx) => (
                <div
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-100 ${
                    currentState === 'speaking'
                      ? 'bg-gradient-to-t from-[#059669] to-[#F26A0A] shadow-[0_0_6px_rgba(242,106,10,0.6)]'
                      : currentState === 'thinking'
                      ? 'bg-amber-400/60'
                      : 'bg-[#F26A0A]/40'
                  }`}
                  style={{
                    height:
                      currentState === 'speaking'
                        ? `${height * 0.8}px`
                        : `${4 + (idx % 2) * 2}px`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Active Audio / Mic Badge */}
          {currentState === 'speaking' ? (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#059669] rounded-full flex items-center justify-center shadow-lg border-2 border-[#F26A0A] animate-bounce">
              <Volume2 size={13} className="text-white" />
            </div>
          ) : currentState === 'thinking' ? (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
              <Sparkles size={13} className="text-white" />
            </div>
          ) : (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#064E3B] rounded-full flex items-center justify-center shadow-lg border-2 border-[#F26A0A]/50">
              <Mic size={13} className="text-[#F26A0A]" />
            </div>
          )}
        </div>

        {/* Interviewer Persona Tag */}
        <div className="mt-1.5 text-center pointer-events-none mb-3">
          <div
            className={`text-xs font-bold tracking-tight ${
              isLight ? 'text-[#1E1B4B]' : 'text-slate-100'
            }`}
          >
            {interviewerName}
          </div>
          <div
            className={`text-[10px] font-medium tracking-wide ${
              isLight ? 'text-[#475569]' : 'text-emerald-300'
            }`}
          >
            {interviewerRole}
          </div>
        </div>
      </div>

      {/* Floating Status Pill Indicator */}
      <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 text-center pointer-events-none z-20">
        <div
          className={`text-[10px] font-mono font-semibold tracking-wide transition-all duration-300 px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs ${
            isLight
              ? currentState === 'speaking'
                ? 'text-emerald-800 bg-emerald-50 border border-emerald-300'
                : currentState === 'thinking'
                ? 'text-amber-800 bg-amber-50 border border-amber-300'
                : 'text-[#6E6759] bg-white border border-[#EBE5D2]'
              : currentState === 'speaking'
              ? 'text-[#F26A0A] bg-[#052E20]/90 border border-[#F26A0A]/50 shadow-[0_0_15px_rgba(242,106,10,0.25)]'
              : currentState === 'thinking'
              ? 'text-amber-200 bg-amber-950/70 border border-amber-500/40'
              : 'text-emerald-300 bg-[#08120F]/90 border border-[#F26A0A]/20'
          }`}
        >
          {currentState === 'speaking' ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F26A0A] animate-pulse shadow-[0_0_6px_#F26A0A]" />
              <span>AI Speaking</span>
            </>
          ) : currentState === 'thinking' ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-spin" />
              <span>Analyzing Response...</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F26A0A] animate-ping" />
              <span>Listening to Candidate</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}