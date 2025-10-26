import { Brain, Target, Trophy } from "lucide-react";

export default function StatsCards({ assessments }) {
  const getAverageScore = () => {
    if (!assessments?.length) return 0;
    const total = assessments.reduce(
      (sum, assessment) => sum + assessment.quizScore,
      0
    );
    return (total / assessments.length).toFixed(1);
  };

  const getLatestAssessment = () => {
    if (!assessments?.length) return null;
    return assessments[0];
  };

  const getTotalQuestions = () => {
    if (!assessments?.length) return 0;
    return assessments.reduce(
      (sum, assessment) => sum + assessment.questions.length,
      0
    );
  };

  const avgScore = parseFloat(getAverageScore());
  const latestScore = getLatestAssessment()?.quizScore || 0;

  const getScoreColor = (score) => {
    if (score >= 90) return 'from-[#1a1815]/80 to-[#252218]/60 border-[#fbbf24]/30';
    if (score >= 80) return 'from-[#1a1815]/80 to-[#252218]/60 border-[#f59e0b]/30';
    if (score >= 70) return 'from-[#1a1815]/80 to-[#252218]/60 border-[#f59e0b]/25';
    return 'from-[#1a1815]/80 to-[#252218]/60 border-[#f59e0b]/20';
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className={`backdrop-blur-xl bg-gradient-to-br ${getScoreColor(avgScore)} rounded-2xl border-2 p-6 shadow-xl shadow-[#f59e0b]/5 transform hover:scale-105 transition-all duration-300`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-[#b0b0b0]">Average Score</h3>
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#f59e0b]/20 to-[#fbbf24]/20 flex items-center justify-center border border-[#f59e0b]/30">
            <Trophy className="w-6 h-6 text-[#f59e0b]" />
          </div>
        </div>
        <div className="text-4xl font-bold text-white mb-1">{getAverageScore()}%</div>
        <p className="text-sm text-[#b0b0b0]">Across all assessments</p>
      </div>

      <div className="backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 rounded-2xl border-2 border-[#f59e0b]/20 p-6 shadow-xl shadow-[#f59e0b]/5 transform hover:scale-105 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-[#b0b0b0]">Questions Practiced</h3>
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#f59e0b]/20 to-[#fbbf24]/20 flex items-center justify-center border border-[#f59e0b]/30">
            <Brain className="w-6 h-6 text-[#f59e0b]" />
          </div>
        </div>
        <div className="text-4xl font-bold text-white mb-1">{getTotalQuestions()}</div>
        <p className="text-sm text-[#b0b0b0]">Total questions</p>
      </div>

      <div className={`backdrop-blur-xl bg-gradient-to-br ${getScoreColor(latestScore)} rounded-2xl border-2 p-6 shadow-xl shadow-[#f59e0b]/5 transform hover:scale-105 transition-all duration-300`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-[#b0b0b0]">Latest Score</h3>
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#f59e0b]/20 to-[#fbbf24]/20 flex items-center justify-center border border-[#f59e0b]/30">
            <Target className="w-6 h-6 text-[#f59e0b]" />
          </div>
        </div>
        <div className="text-4xl font-bold text-white mb-1">
          {getLatestAssessment()?.quizScore.toFixed(1) || 0}%
        </div>
        <p className="text-sm text-[#b0b0b0]">Most recent quiz</p>
      </div>
    </div>
  );
}