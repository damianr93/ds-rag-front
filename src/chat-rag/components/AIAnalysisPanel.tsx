import React from "react";
import { ChevronDown, ChevronUp, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Props {
  analysis: string;
  collapsed: boolean;
  onToggle: () => void;
}

const AIAnalysisPanel: React.FC<Props> = ({ analysis, collapsed, onToggle }) => {
  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-800/60 transition-colors"
      >
        <div className="flex items-center gap-2 text-slate-200 text-sm">
          <Bot className="w-4 h-4 text-blue-400" />
          <span>Análisis IA</span>
        </div>
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-slate-300" />
        ) : (
          <ChevronUp className="w-4 h-4 text-slate-300" />
        )}
      </button>
      {!collapsed && (
        <div className="px-3 py-3 text-slate-200 text-sm prose prose-invert max-w-none">
          <ReactMarkdown>{analysis}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisPanel;

