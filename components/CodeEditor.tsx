'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Terminal, CheckCircle2, AlertCircle, Clock, Zap, Cpu } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  theme?: string;
  height?: string;
  onExecutionComplete?: (result: any) => void;
  hideHeader?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CodeEditor({ 
  value, 
  onChange, 
  language, 
  theme = 'dark',
  height = '100%',
  onExecutionComplete,
  hideHeader = false,
}: CodeEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [runResult, setRunResult] = useState<{
    success?: boolean;
    output?: string;
    runtimeMs?: number;
    error?: string;
    complexity?: {
      timeComplexity?: string;
      spaceComplexity?: string;
      explanation?: string;
      optimizationTip?: string;
    };
  } | null>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const handleRunCode = async () => {
    if (!value || !value.trim()) return;
    setIsRunning(true);
    setShowTerminal(true);

    try {
      const res = await fetch(`${API_URL}/interviews/run-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: value,
          language: language
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRunResult(data);
        if (onExecutionComplete) onExecutionComplete(data);
      } else {
        setRunResult({
          success: false,
          output: "Execution request failed.",
          error: `HTTP ${res.status}`
        });
      }
    } catch (err: any) {
      setRunResult({
        success: false,
        output: err?.message || "Execution error",
        error: "Network error"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getPlaceholder = () => {
    switch (language) {
      case 'javascript':
        return `// Write your JavaScript code here
function solution() {
  console.log("Hello TopPlaced AI!");
  return true;
}
solution();`;
      case 'python':
        return `# Write your Python code here
def solution():
    print("Hello TopPlaced AI!")
    return True

solution()`;
      case 'java':
        return `// Write your Java code here
public class Solution {
    public static void main(String[] args) {
        System.out.println("Hello TopPlaced AI!");
    }
}`;
      default:
        return `// Write your ${language} code here`;
    }
  };

  const isLight = theme === 'light';

  const lineNumbersRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`relative h-full flex flex-col rounded-2xl overflow-hidden transition-colors ${
        isLight
          ? 'bg-white border border-[#EBE5D2] shadow-xs'
          : 'bg-[#0F131C] border border-white/[0.08]'
      }`}
    >
      {/* Top Action Bar (hidden when parent page provides its own language and run controls) */}
      {!hideHeader && (
        <div
          className={`shrink-0 flex items-center justify-between px-4 py-2.5 border-b ${
            isLight
              ? 'bg-[#FAF7F0] border-[#EBE5D2]'
              : 'bg-[#131824] border-white/[0.08]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md ${
                isLight
                  ? 'bg-indigo-50 text-[#312E81] border border-indigo-200'
                  : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
              }`}
            >
              {language.toUpperCase()}
            </span>
            {runResult?.complexity?.timeComplexity && (
              <span
                className={`flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded ${
                  isLight
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}
              >
                <Zap size={12} /> Time: {runResult.complexity.timeComplexity}
              </span>
            )}
            {runResult?.complexity?.spaceComplexity && (
              <span
                className={`flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded ${
                  isLight
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}
              >
                <Cpu size={12} /> Space: {runResult.complexity.spaceComplexity}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunCode}
              disabled={isRunning || !value.trim()}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer ${
                isLight
                  ? 'bg-[#312E81] hover:bg-[#3730A3]'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
              }`}
            >
              <Play size={13} className={isRunning ? 'animate-spin' : ''} />
              {isRunning ? 'Running...' : 'Run Code'}
            </button>
            <button
              type="button"
              onClick={() => setShowTerminal(!showTerminal)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-[#F3EFE6] text-[#4A4336] border-[#EBE5D2]'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border-white/10'
              }`}
            >
              <Terminal size={13} />
              {showTerminal ? 'Hide Console' : 'Console'}
            </button>
          </div>
        </div>
      )}

      {/* Editor Body - Independently scrollable code textarea */}
      <div className="relative flex-1 min-h-0 flex overflow-hidden">
        {/* Line Numbers - Scrolls in lockstep with the textarea */}
        <div
          ref={lineNumbersRef}
          className={`w-12 select-none flex flex-col text-xs pt-3 font-mono border-r overflow-hidden ${
            isLight
              ? 'bg-[#FAF7F0] border-[#EBE5D2] text-[#9E9789]'
              : 'bg-[#0B0E15] border-white/[0.06] text-slate-500'
          }`}
        >
          {value.split('\n').map((_, index) => (
            <div key={index} className="h-6 flex items-center justify-end pr-2 shrink-0">
              {index + 1}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={editorRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={(e) => {
            if (lineNumbersRef.current) {
              lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
            }
          }}
          placeholder={getPlaceholder()}
          className={`flex-1 min-h-0 font-mono text-sm p-3 resize-none outline-none leading-6 overflow-y-auto overscroll-contain ${
            isLight
              ? 'bg-white text-[#0E0C08] placeholder-[#9E9789]'
              : 'bg-transparent text-slate-100 placeholder-slate-600'
          }`}
          spellCheck={false}
        />
      </div>

      {/* Interactive Terminal / Console Drawer */}
      {showTerminal && (
        <div
          className={`shrink-0 border-t p-3.5 text-xs font-mono max-h-40 overflow-y-auto overscroll-contain animate-fadeIn ${
            isLight
              ? 'border-[#EBE5D2] bg-[#FAF7F0] text-[#0E0C08]'
              : 'border-white/[0.08] bg-[#0A0D14]'
          }`}
        >
          <div
            className={`flex items-center justify-between mb-2 pb-1.5 border-b ${
              isLight ? 'border-[#EBE5D2] text-[#6E6759]' : 'border-white/[0.08] text-slate-400'
            }`}
          >
            <span
              className={`flex items-center gap-1.5 font-semibold ${
                isLight ? 'text-[#0E0C08]' : 'text-slate-200'
              }`}
            >
              <Terminal size={13} className={isLight ? 'text-[#312E81]' : 'text-indigo-400'} />
              Execution Output
            </span>
            {runResult?.runtimeMs !== undefined && (
              <span className="flex items-center gap-1">
                <Clock size={11} /> {runResult.runtimeMs}ms
              </span>
            )}
          </div>

          {runResult ? (
            <div>
              <pre
                className={`whitespace-pre-wrap font-mono ${
                  runResult.success
                    ? isLight
                      ? 'text-emerald-700'
                      : 'text-slate-200'
                    : 'text-rose-600'
                }`}
              >
                {runResult.output}
              </pre>
              {runResult.complexity?.optimizationTip && (
                <div
                  className={`mt-2.5 pt-2 border-t flex items-start gap-1.5 ${
                    isLight
                      ? 'border-[#EBE5D2] text-amber-900 bg-amber-50 p-2 rounded-lg'
                      : 'border-white/[0.08] text-amber-300/90'
                  }`}
                >
                  <Zap size={13} className="shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    <strong>AI Tip:</strong> {runResult.complexity.optimizationTip}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <span className={isLight ? 'text-[#9E9789] italic' : 'text-slate-500 italic'}>
              Click &quot;Run Code&quot; to compile and execute your solution.
            </span>
          )}
        </div>
      )}
    </div>
  );
}