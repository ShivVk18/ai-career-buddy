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

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="border border-border bg-background rounded-sm p-8 shadow-sm transition-editorial hover:border-accent hover:bg-divider/5">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Average Score</h3>
          <div className="w-10 h-10 rounded-sm bg-divider/20 flex items-center justify-center border border-divider/30">
            <Trophy className="w-5 h-5 text-accent" />
          </div>
        </div>
        <div className="text-4xl md:text-5xl font-clash font-bold text-foreground mb-2">{getAverageScore()}%</div>
        <p className="text-xs text-muted-foreground font-light">Across all assessments</p>
      </div>

      <div className="border border-border bg-background rounded-sm p-8 shadow-sm transition-editorial hover:border-accent hover:bg-divider/5">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Questions Practiced</h3>
          <div className="w-10 h-10 rounded-sm bg-divider/20 flex items-center justify-center border border-divider/30">
            <Brain className="w-5 h-5 text-accent" />
          </div>
        </div>
        <div className="text-4xl md:text-5xl font-clash font-bold text-foreground mb-2">{getTotalQuestions()}</div>
        <p className="text-xs text-muted-foreground font-light">Total questions</p>
      </div>

      <div className="border border-border bg-background rounded-sm p-8 shadow-sm transition-editorial hover:border-accent hover:bg-divider/5">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Latest Score</h3>
          <div className="w-10 h-10 rounded-sm bg-divider/20 flex items-center justify-center border border-divider/30">
            <Target className="w-5 h-5 text-accent" />
          </div>
        </div>
        <div className="text-4xl md:text-5xl font-clash font-bold text-foreground mb-2">
          {getLatestAssessment()?.quizScore.toFixed(1) || 0}%
        </div>
        <p className="text-xs text-muted-foreground font-light">Most recent quiz</p>
      </div>
    </div>
  );
}