import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, AlertCircle, Brain } from "lucide-react";
import { getOpenSession } from "@/actions/Practice";
import { getUserOnboardingStatus } from "@/actions/User";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import SourceChips from "@/components/shared/SourceChips";
import { generationErrorMessage } from "@/components/shared/generationError";
import RubricCard from "../_components/RubricCard";

export default async function PracticeReviewPage({ params }) {
  const { isOnboarded } = await getUserOnboardingStatus();
  if (!isOnboarded) redirect("/onboarding");

  const { sessionId } = await params;
  const session = await getOpenSession(sessionId);

  if (session?.code === "NOT_FOUND" || session?.code === "INVALID") notFound();

  return (
    <div className="min-h-screen bg-transparent py-12 px-6 md:px-12">
      <div className="max-w-4xl mx-auto relative z-10">
        <Link href="/interview">
          <Button variant="ghost" className="mb-8 text-muted-foreground hover:text-foreground gap-3 px-0">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Back to Hub</span>
          </Button>
        </Link>

        {session?.error ? (
          <div role="alert" className="border border-destructive/40 bg-destructive/5 rounded-xl p-8 flex gap-4">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
            <p className="text-sm text-foreground">{generationErrorMessage(session)}</p>
          </div>
        ) : (
          <>
            <div className="mb-10 border-b border-divider pb-8">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
                Practice <span className="text-primary-ink">Review</span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {session.answered} of {session.total} answered
                {session.averageOverall !== null && <> {" // "} Average {session.averageOverall}/100 (AI estimate)</>}
              </p>
            </div>

            <div className="space-y-10">
              {session.questions.map((q) => (
                <section key={q.index} className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary-ink mb-1">
                      Question {q.index + 1} // {q.topic}
                    </p>
                    <h2 className="text-lg md:text-xl font-medium text-foreground">{q.question}</h2>
                    <SourceChips sources={q.sources} heading="Based on" className="mt-3" />
                  </div>
                  {q.answer ? (
                    <RubricCard answerText={q.answer.answerText} rubric={q.answer.rubric} overall={q.answer.overall} />
                  ) : (
                    <p className="text-sm text-muted-foreground border border-dashed border-divider rounded-xl p-4">
                      Not answered.
                    </p>
                  )}
                </section>
              ))}
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-3">
              {session.answered < session.total && (
                <Link href={`/interview/practice?session=${session.sessionId}`}>
                  <Button className="h-12 px-8">Continue practising</Button>
                </Link>
              )}
              <Link href="/interview/practice">
                <Button variant="outline" className="h-12 px-8">
                  <Brain className="w-4 h-4 mr-3 text-primary-ink" />
                  Practice again
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
