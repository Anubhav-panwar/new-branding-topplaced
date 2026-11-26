"use client";

import React from "react";
import { Code, Layers, Terminal } from "lucide-react";
import CodeEditor from "@/components/CodeEditor";
import SystemDesignCanvas from "@/components/SystemDesignCanvas";

export interface TechnicalWorkspaceDrawerProps {
  technicalDrawerTab: "code" | "whiteboard";
  setTechnicalDrawerTab: (tab: "code" | "whiteboard") => void;
  activeMobileTab: "chat" | "code";
  language: string;
  setLanguage: (lang: string) => void;
  languageOptions: string[];
  runCode: () => void;
  isRunningCode: boolean;
  code: string;
  setCode: (code: string) => void;
  codeExecutionSuccess: boolean;
  setCodeExecutionSuccess: (success: boolean) => void;
  lastExecutionResult: any;
  setLastExecutionResult: (result: any) => void;
  isAISpeaking: boolean;
  onSendWhiteboardAnswer: (summary: string) => void;
}

export function TechnicalWorkspaceDrawer({
  technicalDrawerTab,
  setTechnicalDrawerTab,
  activeMobileTab,
  language,
  setLanguage,
  languageOptions,
  runCode,
  isRunningCode,
  code,
  setCode,
  codeExecutionSuccess,
  setCodeExecutionSuccess,
  lastExecutionResult,
  setLastExecutionResult,
  isAISpeaking,
  onSendWhiteboardAnswer,
}: TechnicalWorkspaceDrawerProps) {
  return (
    <div
      className={`flex-1 min-h-[300px] flex flex-col rounded-2xl border border-[#E8D9CC] bg-white overflow-hidden shadow-sm ${
        activeMobileTab === "chat" ? "hidden lg:flex" : "flex"
      }`}
    >
      {/* Tab Switcher Header (Code vs System Design) */}
      <div className="shrink-0 bg-[#FFFCF8] border-b border-[#E8D9CC] px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setTechnicalDrawerTab("code")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              technicalDrawerTab === "code"
                ? "bg-white text-[#E85D04] shadow-xs border border-[#E8D9CC]"
                : "text-[#64748B] hover:text-[#111827]"
            }`}
          >
            <Code size={13} />
            <span>Code Editor</span>
          </button>
          <button
            onClick={() => setTechnicalDrawerTab("whiteboard")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              technicalDrawerTab === "whiteboard"
                ? "bg-gradient-to-r from-[#E85D04] to-[#E85D04] text-white font-semibold shadow-xs"
                : "text-[#64748B] hover:text-[#111827]"
            }`}
          >
            <Layers size={13} />
            <span>System Design</span>
          </button>
        </div>

        <div className="flex items-center space-x-1.5">
          {technicalDrawerTab === "code" && (
            <>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-white border border-[#E8D9CC] rounded-lg px-2 py-1 text-xs text-[#111827] focus:outline-none focus:border-[#E85D04]"
              >
                {languageOptions.map((lang) => (
                  <option key={lang} value={lang} className="bg-white text-[#111827]">
                    {lang.toUpperCase()}
                  </option>
                ))}
              </select>

              <button
                onClick={runCode}
                disabled={isRunningCode}
                className="bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#C84F04] hover:to-[#E85D04] text-white font-semibold px-2.5 py-1 text-xs rounded-lg flex items-center space-x-1 transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Terminal size={12} />
                <span>{isRunningCode ? "Running..." : "Run"}</span>
              </button>

              <button
                onClick={() => {
                  setCode("");
                  setLastExecutionResult(null);
                  setCodeExecutionSuccess(false);
                }}
                className="text-xs text-[#64748B] hover:text-rose-600 px-1.5 py-1 rounded transition cursor-pointer"
                title="Clear Code and Console"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Panel Content */}
      {technicalDrawerTab === "whiteboard" ? (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <SystemDesignCanvas
            isAISpeaking={isAISpeaking}
            onSubmitToAI={(summary) => {
              onSendWhiteboardAnswer(summary);
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <CodeEditor
              value={code}
              onChange={(newCode) => {
                setCode(newCode);
                if (codeExecutionSuccess) {
                  setCodeExecutionSuccess(false);
                  setLastExecutionResult(null);
                }
              }}
              language={language}
              theme="vs-dark"
              hideHeader={true}
            />
          </div>

          {/* Code Execution Output Console */}
          {lastExecutionResult && (
            <div className="shrink-0 border-t border-[#E8D9CC] p-2.5 bg-[#FFFCF8] max-h-36 overflow-y-auto overscroll-contain font-mono text-xs">
              <div className="flex items-center justify-between mb-1 text-[11px] font-bold text-[#64748B]">
                <span>Execution Console</span>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      codeExecutionSuccess ? "text-emerald-600" : "text-rose-600"
                    }
                  >
                    {codeExecutionSuccess ? "Success" : "Error"}
                  </span>
                  <button
                    onClick={() => setLastExecutionResult(null)}
                    className="text-[10px] text-[#64748B] hover:text-[#111827] px-1.5 py-0.5 rounded bg-white border border-[#E8D9CC]"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap text-[#111827]">{lastExecutionResult}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TechnicalWorkspaceDrawer;
