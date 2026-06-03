'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, AlertCircle, Info, Zap } from "lucide-react";
import { AIInsight } from "../types/mock-api";

interface AIInsightsListProps {
  insights: AIInsight[];
}

export default function AIInsightsList({ insights }: AIInsightsListProps) {
  const getIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'plateau': return <AlertCircle className="size-5 text-amber-500" />;
      case 'macro': return <Zap className="size-5 text-blue-500" />;
      case 'overtraining': return <Info className="size-5 text-red-500" />;
      default: return <Sparkles className="size-5 text-[#54B7F0]" />;
    }
  };

  const getBorderColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'plateau': return 'border-l-amber-500';
      case 'macro': return 'border-l-blue-500';
      case 'overtraining': return 'border-l-red-500';
      default: return 'border-l-[#54B7F0]';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {insights.map((insight) => (
        <Card 
          key={insight.id} 
          className={`border-0 border-l-4 ${getBorderColor(insight.type)} bg-white shadow-sm hover:shadow-md transition-shadow`}
        >
          <CardContent className="p-4">
            <div className="flex gap-3 items-start">
              <div className="mt-0.5">{getIcon(insight.type)}</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 leading-snug">
                  {insight.message}
                </p>
                {insight.actionRequired && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Đề xuất hành động</p>
                    <p className="text-xs font-semibold text-slate-600">
                      {insight.actionRequired}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
