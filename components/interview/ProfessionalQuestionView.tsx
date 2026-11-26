"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Bot, Volume2, Mic, ChevronUp, ChevronDown, FileText } from "lucide-react";

export interface ProfessionalQuestionViewProps {
  rawText: string;
  isAISpeaking: boolean;
  spokenCharIndex?: number;
  spokenRatio?: number;
}

export function ProfessionalQuestionView({
  rawText,
  isAISpeaking,
  spokenCharIndex = Infinity,
  spokenRatio = 1,
}: ProfessionalQuestionViewProps) {
  const [showDetails, setShowDetails] = useState(false);
  const liveContainerRef = useRef<HTMLDivElement | null>(null);

  const content = (rawText || "").trim();

  // 1. Detect optional greeting (e.g. "Hi test 12 — welcome...")
  const greetingMatch = content.match(
    /^(Hi\s+[^—–-]+[-—–]\s*welcome[^.;]+[.;]?[^\.\?!]*[\.\?!]|Welcome[^.;]+[.;]?[^\.\?!]*[\.\?!]|Hello[^.;]+[.;]?[^\.\?!]*[\.\?!])/i
  );
  let greeting = "";
  let body = content;
  if (greetingMatch) {
    greeting = greetingMatch[0].trim();
    body = content.slice(greetingMatch[0].length).trim();
  }

  // 2. Check for explicit paragraphs or sentence breakdown
  const explicitParagraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  let scenarioText = "";
  let promptItems: string[] = [];

  const promptKeywords = [
    "walk me through",
    "be explicit",
    "explain",
    "describe",
    "outline",
    "how would",
    "how do you",
    "what would",
    "what are",
    "where would",
    "can you",
    "please detail",
    "discuss",
    "tell me",
  ];

  if (explicitParagraphs.length > 1) {
    scenarioText = explicitParagraphs[0];
    promptItems = explicitParagraphs.slice(1);
  } else {
    const sentences = body
      .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (sentences.length <= 1) {
      promptItems = sentences;
    } else {
      const scenario: string[] = [];
      const prompts: string[] = [];
      for (const s of sentences) {
        const lower = s.toLowerCase();
        if (promptKeywords.some((k) => lower.startsWith(k)) || s.endsWith("?")) {
          prompts.push(s);
        } else {
          scenario.push(s);
        }
      }
      if (prompts.length > 0) {
        scenarioText = scenario.join(" ");
        promptItems = prompts;
      } else {
        promptItems = sentences;
      }
    }
  }

  // Primary question line
  const primaryQuestion = promptItems[0] || body || "Listening to interviewer...";
  const secondaryDeliverables = promptItems.slice(1);

  // Partial spoken string calculation
  let visibleSpokenText = primaryQuestion;
  if (isAISpeaking && content.length > 0) {
    if (spokenCharIndex < Infinity && spokenCharIndex > 0) {
      visibleSpokenText = content.slice(0, Math.min(spokenCharIndex, content.length));
    } else if (spokenRatio >= 0 && spokenRatio <= 1) {
      const charCount = Math.max(1, Math.round(content.length * spokenRatio));
      visibleSpokenText = content.slice(0, charCount);
    }
  }

  // Auto-scroll container as text streams
  useEffect(() => {
    if (liveContainerRef.current) {
      liveContainerRef.current.scrollTop = liveContainerRef.current.scrollHeight;
    }
  }, [visibleSpokenText]);

  if (!content) {
    return (
      <div className="pt-2 pb-1">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC] shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-[#FFFCF8] border border-[#E8D9CC] flex items-center justify-center text-[#E85D04] shrink-0">
            <Sparkles size={16} className="animate-spin text-[#E85D04]" />
          </div>
          <div>
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#E85D04]">
              AI Interviewer
            </p>
            <p className="text-sm font-medium text-[#64748B] mt-0.5">
              Preparing your interview question. Please listen as the interviewer speaks...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-1.5 pb-0.5 space-y-2.5">
      {/* Compact Live Question Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-[#FFFCF8] border border-[#E8D9CC] flex items-center justify-center text-[#E85D04] shadow-xs">
            <Bot size={13} />
          </span>
          <span className="text-xs font-mono uppercase tracking-wider font-semibold text-[#E85D04]">
            AI Interviewer — Live Question
          </span>
        </div>

        {isAISpeaking ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold text-[#E85D04] bg-[#FFFCF8] border border-[#E8D9CC] shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E85D04] animate-pulse" />
            <Volume2 size={11} className="text-[#E85D04]" />
            <span>Speaking...</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Mic size={11} className="text-emerald-600" />
            <span>Ready for your answer</span>
          </span>
        )}
      </div>

      {/* Compact Live Display (2-4 lines, overflow handled cleanly, readable font) */}
      <div
        ref={liveContainerRef}
        className="p-3.5 sm:p-4 rounded-xl bg-[#FFFCF8] border border-[#E8D9CC] hover:border-[#E8D9CC] shadow-xs min-h-[76px] max-h-[112px] overflow-y-auto overscroll-contain transition-colors scrollbar-thin"
      >
        {isAISpeaking ? (
          <p className="text-[16px] sm:text-[17px] font-normal text-[#111827] leading-relaxed tracking-normal select-text">
            {visibleSpokenText || "Listening to interviewer..."}
            <span className="inline-block w-1.5 h-4 ml-1 bg-[#E85D04] animate-pulse align-middle" />
          </p>
        ) : (
          <p className="text-[16px] sm:text-[17px] font-medium text-[#111827] leading-relaxed tracking-normal select-text">
            {primaryQuestion}
          </p>
        )}
      </div>

      {/* Collapsible Context & Details (collapsed by default, avoids screen clutter) */}
      {(scenarioText || greeting || secondaryDeliverables.length > 0) && (
        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#64748B] hover:text-[#E85D04] transition-colors py-0.5 cursor-pointer focus:outline-none"
          >
            {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            <span>{showDetails ? "Hide scenario context & details" : "View context & details"}</span>
          </button>

          {showDetails && (
            <div className="mt-2 p-3 sm:p-3.5 rounded-xl bg-white border border-[#E8D9CC] space-y-2.5 text-xs text-[#475569] leading-relaxed max-h-48 overflow-y-auto shadow-xs animate-in fade-in slide-in-from-top-1 duration-150">
              {greeting && (
                <p className="text-[#64748B]">
                  <span className="font-semibold text-[#111827]">Greeting:</span> {greeting}
                </p>
              )}
              {scenarioText && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-700 mb-1 flex items-center gap-1">
                    <FileText size={11} className="text-amber-600" />
                    <span>Scenario Context</span>
                  </div>
                  <p className="text-[#111827] font-normal leading-relaxed">{scenarioText}</p>
                </div>
              )}
              {secondaryDeliverables.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#64748B] block">
                    Deliverables &amp; Details:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[#475569] pl-1">
                    {secondaryDeliverables.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default ProfessionalQuestionView;
