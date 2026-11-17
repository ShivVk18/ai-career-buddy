"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { TrendingUp, BarChart3 } from "lucide-react";

export default function PerformanceChart({ assessments }) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (assessments) {
      const formattedData = assessments.map((assessment) => ({
        date: format(new Date(assessment.createdAt), "MMM dd"),
        score: assessment.quizScore,
      }));
      setChartData(formattedData);
    }
  }, [assessments]);

  return (
    <div className="border border-border bg-background rounded-sm p-8 shadow-sm">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-10 h-10 rounded-sm bg-divider/20 flex items-center justify-center border border-divider/30">
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <h2 className="text-3xl font-clash font-bold text-foreground uppercase tracking-tight">
            Performance Trend
          </h2>
        </div>
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest ml-14">Your quiz scores over time</p>
      </div>

      <div className="h-[300px] bg-divider/5 rounded-sm p-6 border border-divider/30">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              stroke="var(--muted-foreground)"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="var(--muted-foreground)"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  return (
                    <div className="bg-background border border-border rounded-sm p-4 shadow-xl">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-1">
                        Score
                      </p>
                      <p className="text-xl font-clash font-bold text-foreground mb-1">
                        {payload[0].value}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payload[0].payload.date}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="var(--accent)"
              strokeWidth={3}
              dot={{ 
                fill: 'var(--accent)', 
                strokeWidth: 2, 
                stroke: 'var(--background)',
                r: 5
              }}
              activeDot={{ 
                r: 7,
                fill: 'var(--accent)',
                stroke: 'var(--background)',
                strokeWidth: 2
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}