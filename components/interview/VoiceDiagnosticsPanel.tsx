"use client";

import React from "react";

export interface VoiceDiagnosticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isMicOn: boolean;
  voiceState: string;
  audioVolume: number;
  isAISpeaking: boolean;
  sttLatency: number | null;
  llmLatency: number | null;
  currentTranscript: string;
  debugLogs: any[];
  onClearLogs: () => void;
}

export function VoiceDiagnosticsPanel({
  isOpen,
  onClose,
  isMicOn,
  voiceState,
  audioVolume,
  isAISpeaking,
  sttLatency,
  llmLatency,
  currentTranscript,
  debugLogs,
  onClearLogs,
}: VoiceDiagnosticsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-16 right-4 w-96 max-h-[30rem] bg-white border border-[#E8D9CC] rounded-2xl p-4 overflow-hidden z-50 shadow-xl flex flex-col font-mono text-xs text-[#111827]">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E8D9CC]">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#E85D04] animate-ping" />
          <h3 className="font-bold text-[#111827] tracking-wider uppercase text-[11px]">
            Voice System Diagnostics
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onClearLogs}
            className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-[#FFFCF8] border border-[#E8D9CC] text-[#475569] cursor-pointer"
            title="Clear API Logs"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm px-1 cursor-pointer"
            title="Close Panel"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 p-2 bg-[#FFFCF8] rounded-xl mb-2 border border-[#E8D9CC]">
        <div>
          <span className="text-[10px] text-[#64748B] block uppercase">MIC</span>
          <span
            className={`font-semibold flex items-center space-x-1 ${
              isMicOn ? "text-[#E85D04]" : "text-rose-400"
            }`}
          >
            <span>●</span>
            <span>{isMicOn ? "Connected" : "Muted"}</span>
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[#64748B] block uppercase">VAD STATE</span>
          <span className="text-[#E85D04] font-semibold">{voiceState}</span>
        </div>
        <div>
          <span className="text-[10px] text-[#64748B] block uppercase">AUDIO LEVEL</span>
          <span className="text-[#111827] font-semibold">{audioVolume}%</span>
        </div>
        <div>
          <span className="text-[10px] text-[#64748B] block uppercase">AI AUDIO</span>
          <span
            className={`font-semibold ${
              isAISpeaking ? "text-[#E85D04]" : "text-slate-500"
            }`}
          >
            {isAISpeaking ? "● Playing" : "○ Idle"}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[#64748B] block uppercase">STT LATENCY</span>
          <span className="text-[#334155] font-semibold">
            {sttLatency ? `${sttLatency}ms` : "—"}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[#64748B] block uppercase">LLM LATENCY</span>
          <span className="text-[#334155] font-semibold">
            {llmLatency ? `${llmLatency}ms` : "—"}
          </span>
        </div>
      </div>

      {/* Current Transcript Snippet */}
      <div className="mb-2 p-2 bg-[#FFFCF8] rounded-xl border border-[#E8D9CC]">
        <span className="text-[10px] text-slate-400 uppercase block mb-0.5">
          CURRENT TRANSCRIPT
        </span>
        <p className="text-[11px] text-[#E85D04] italic truncate">
          {currentTranscript || "(Silence)"}
        </p>
      </div>

      {/* Diagnostic Logs */}
      <div className="flex-1 overflow-y-auto max-h-28 space-y-1 pr-1">
        {debugLogs.length === 0 ? (
          <p className="text-[10px] text-slate-500 italic">No logs yet...</p>
        ) : (
          debugLogs.map((log, index) => (
            <div
              key={index}
              className="text-[10px] text-[#334155] bg-[#FFFCF8] p-2 rounded-xl border border-[#E8D9CC]"
            >
              <pre className="whitespace-pre-wrap break-words">{log}</pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default VoiceDiagnosticsPanel;

