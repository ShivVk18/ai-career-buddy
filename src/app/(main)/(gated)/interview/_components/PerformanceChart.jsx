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
    <div>
      {chartData.length === 0 ? (
        <p className="rounded-[14px] border border-dashed border-line p-6 text-center text-sm text-muted">no scores yet. take a quiz and your trend shows up here.</p>
      ) : (
      <div role="img" aria-label="line chart of your quiz scores over time" className="h-[240px] rounded-[14px] bg-soft p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              stroke="var(--faint)"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="var(--faint)"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  return (
                    <div className="bg-panel border border-border rounded-xl p-4 shadow-xl">
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
              stroke="var(--primary)"
              strokeWidth={3}
              dot={{ 
                fill: 'var(--primary)', 
                strokeWidth: 2, 
                stroke: 'var(--background)',
                r: 5
              }}
              activeDot={{ 
                r: 7,
                fill: 'var(--primary)',
                stroke: 'var(--background)',
                strokeWidth: 2
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      )}
    </div>
  );
}