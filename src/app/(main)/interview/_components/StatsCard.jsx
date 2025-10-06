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
    if (score >= 90) return 'from-emerald-500/20 to-green-500/20 border-emerald-500/30';
    if (score >= 80) return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
    if (score >= 70) return 'from-amber-500/20 to-yellow-500/20 border-amber-500/30';
    return 'from-rose-500/20 to-red-500/20 border-rose-500/30';
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className={`backdrop-blur-xl bg-gradient-to-br ${getScoreColor(avgScore)} rounded-2xl border-2 p-6 shadow-xl transform hover:scale-105 transition-all duration-300`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-300">Average Score</h3>
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 flex items-center justify-center border border-amber-500/30">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
        </div>
        <div className="text-4xl font-bold text-white mb-1">{getAverageScore()}%</div>
        <p className="text-sm text-gray-400">Across all assessments</p>
      </div>

      <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl border-2 border-blue-500/30 p-6 shadow-xl transform hover:scale-105 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-300">Questions Practiced</h3>
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
            <Brain className="w-6 h-6 text-blue-400" />
          </div>
        </div>
        <div className="text-4xl font-bold text-white mb-1">{getTotalQuestions()}</div>
        <p className="text-sm text-gray-400">Total questions</p>
      </div>

      <div className={`backdrop-blur-xl bg-gradient-to-br ${getScoreColor(latestScore)} rounded-2xl border-2 p-6 shadow-xl transform hover:scale-105 transition-all duration-300`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-300">Latest Score</h3>
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500/20 to-rose-500/20 flex items-center justify-center border border-orange-500/30">
            <Target className="w-6 h-6 text-orange-400" />
          </div>
        </div>
        <div className="text-4xl font-bold text-white mb-1">
          {getLatestAssessment()?.quizScore.toFixed(1) || 0}%
        </div>
        <p className="text-sm text-gray-400">Most recent quiz</p>
      </div>
    </div>
  );
}