"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BriefcaseIcon,
  LineChart,
  TrendingUp,
  TrendingDown,
  Brain,
  Calendar,
  Sparkles,
  Award,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const DashboardView = ({ insights }) => {
  // Transform salary data for the chart
  const salaryData = insights.salaryRanges.map((range) => ({
    name: range.role,
    min: range.min / 1000,
    max: range.max / 1000,
    median: range.median / 1000,
  }));

  const getDemandLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case "high":
        return "bg-gradient-to-r from-green-500 to-emerald-500";
      case "medium":
        return "bg-gradient-to-r from-yellow-500 to-amber-500";
      case "low":
        return "bg-gradient-to-r from-red-500 to-rose-500";
      default:
        return "bg-gradient-to-r from-gray-500 to-slate-500";
    }
  };

  const getMarketOutlookInfo = (outlook) => {
    switch (outlook.toLowerCase()) {
      case "positive":
        return { icon: TrendingUp, color: "text-green-400" };
      case "neutral":
        return { icon: LineChart, color: "text-yellow-400" };
      case "negative":
        return { icon: TrendingDown, color: "text-red-400" };
      default:
        return { icon: LineChart, color: "text-gray-400" };
    }
  };

  const OutlookIcon = getMarketOutlookInfo(insights.marketOutlook).icon;
  const outlookColor = getMarketOutlookInfo(insights.marketOutlook).color;

  // Format dates using date-fns
  const lastUpdatedDate = format(new Date(insights.lastUpdated), "dd/MM/yyyy");
  const nextUpdateDistance = formatDistanceToNow(
    new Date(insights.nextUpdate),
    { addSuffix: true }
  );

  return (
    <div className="space-y-8">
      {/* Last Updated Badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 backdrop-blur-xl">
          <Calendar className="h-4 w-4 text-blue-400 mr-2" />
          <span className="text-sm font-medium text-blue-300">
            Last updated: {lastUpdatedDate}
          </span>
        </div>
      </div>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-3xl p-6 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-green-300">Market Outlook</h3>
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
              <OutlookIcon className={`h-5 w-5 ${outlookColor}`} />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {insights.marketOutlook}
          </div>
          <p className="text-xs text-green-200">
            Next update {nextUpdateDistance}
          </p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-3xl p-6 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-blue-300">Industry Growth</h3>
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-3">
            {insights.growthRate.toFixed(1)}%
          </div>
          <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${Math.min(insights.growthRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/10 to-rose-500/10 border border-orange-500/30 rounded-3xl p-6 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-orange-300">Demand Level</h3>
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
              <BriefcaseIcon className="h-5 w-5 text-orange-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-3">
            {insights.demandLevel}
          </div>
          <div
            className={`h-2 rounded-full ${getDemandLevelColor(
              insights.demandLevel
            )}`}
          />
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-3xl p-6 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-purple-300">Top Skills</h3>
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
              <Brain className="h-5 w-5 text-purple-400" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {insights.topSkills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 bg-purple-500/20 text-purple-200 rounded-full text-xs border border-purple-500/30"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Salary Ranges Chart */}
      <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white mb-2 flex items-center">
            <Award className="h-6 w-6 text-orange-400 mr-3" />
            Salary Ranges by Role
          </h2>
          <p className="text-gray-400">
            Displaying minimum, median, and maximum salaries (in thousands)
          </p>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salaryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="backdrop-blur-xl bg-slate-900/90 border border-orange-500/30 rounded-xl p-4 shadow-2xl">
                        <p className="font-semibold text-white mb-2">{label}</p>
                        {payload.map((item) => (
                          <p key={item.name} className="text-sm text-gray-300">
                            {item.name}: ${item.value}K
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="min" fill="#f97316" name="Min Salary (K)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="median" fill="#fb923c" name="Median Salary (K)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="max" fill="#fdba74" name="Max Salary (K)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Industry Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-2 flex items-center">
              <TrendingUp className="h-6 w-6 text-orange-400 mr-3" />
              Key Industry Trends
            </h2>
            <p className="text-gray-400">Current trends shaping the industry</p>
          </div>
          <ul className="space-y-4">
            {insights.keyTrends.map((trend, index) => (
              <li key={index} className="flex items-start space-x-3 group">
                <div className="h-2 w-2 mt-2 rounded-full bg-orange-400 group-hover:scale-150 transition-transform duration-300" />
                <span className="text-gray-300 leading-relaxed">{trend}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-2 flex items-center">
              <Sparkles className="h-6 w-6 text-orange-400 mr-3" />
              Recommended Skills
            </h2>
            <p className="text-gray-400">Skills to consider developing</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {insights.recommendedSkills.map((skill) => (
              <span
                key={skill}
                className="px-4 py-2 bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-orange-200 rounded-full text-sm border border-orange-500/30 hover:scale-110 transition-transform duration-300 cursor-default"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;