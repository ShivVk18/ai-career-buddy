
export default function StatsCards({ assessments }) {
  const n = assessments?.length || 0;
  const avg = n ? (assessments.reduce((sum, a) => sum + a.quizScore, 0) / n).toFixed(1) : "0.0";
  const total = n ? assessments.reduce((sum, a) => sum + a.questions.length, 0) : 0;
  const latest = n ? assessments[0].quizScore.toFixed(1) : "0.0";
  const cells = [
    ["average score", `${avg}%`, "across all quizzes"],
    ["questions practiced", String(total), "total questions"],
    ["latest score", `${latest}%`, "most recent quiz"],
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cells.map(([label, value, sub]) => (
        <div key={label} className="rounded-[14px] bg-soft p-4">
          <p className="text-xs text-faint">{label}</p>
          <p className="mt-1 font-doc text-4xl leading-none text-text">{value}</p>
          <p className="mt-2 text-xs text-muted">{sub}</p>
        </div>
      ))}

    </div>
  );
}
