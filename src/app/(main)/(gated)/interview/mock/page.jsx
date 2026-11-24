'use client'

import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { toast } from "sonner";
import Quiz from "../_components/Quiz";
import { generateQuiz } from "@/actions/Interview";
import { getProfileChips } from "@/actions/Onboarding";
import { generationErrorMessage } from "@/components/shared/generationError";
import ToolFrame from "@/components/shared/ToolFrame";
import { FieldLabel, InkButton, Note } from "@/components/shared/ToolBits";
import { ChipList } from "@/components/ui/Chip";
import PipStatus from "@/components/ui/PipStatus";
import Skeleton from "@/components/ui/Skeleton";

const MAX_PREFILL = 6;

export default function MockInterviewPage() {
  const [skills, setSkills] = useState([]);
  const [profileState, setProfileState] = useState("loading"); // loading | ready | empty
  const [quizReady, setQuizReady] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Skills come from the profile (or ?skills=a,b). Nothing to type unless you want to add one.
  useEffect(() => {
    let alive = true;
    const fromUrl = (new URLSearchParams(window.location.search).get("skills") || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (fromUrl.length) {
      setSkills(fromUrl);
      setProfileState("ready");
      return;
    }
    getProfileChips()
      .then((res) => {
        if (!alive) return;
        const found = (res?.chips || []).filter((c) => c.kind === "skill").map((c) => c.label).slice(0, MAX_PREFILL);
        setSkills(found);
        setProfileState(found.length ? "ready" : "empty");
      })
      .catch(() => alive && setProfileState("empty"));
    return () => {
      alive = false;
    };
  }, []);

  const handleGenerate = async (e) => {
    e?.preventDefault();
    try {
      setLoading(true);
      setError("");
      const generated = await generateQuiz(skills); // { quizId, questions } or { error, code }
      if (generated?.code) {
        setError(generationErrorMessage(generated, "we couldn't make the quiz. try again."));
        return;
      }
      if (!generated?.quizId || !generated?.questions?.length) {
        setError("we couldn't make the quiz. try again.");
        return;
      }
      setQuestions(generated);
      setQuizReady(true);
    } catch (err) {
      toast.error(err?.message || "we couldn't make the quiz");
    } finally {
      setLoading(false);
    }
  };

  if (quizReady) {
    return (
      <ToolFrame title="quiz" outfit="headphones" back={{ href: "/interview", label: "interview prep" }} bare className="max-w-5xl">
        <Quiz
          initialQuestions={questions}
          onComplete={() => {
            setQuizReady(false);
            setQuestions(null);
          }}
        />
      </ToolFrame>
    );
  }

  return (
    <ToolFrame
      title="quick quiz"
      line="ten questions on the skills you pick. scored when you finish."
      outfit="headphones"
      back={{ href: "/interview", label: "interview prep" }}
      windowTitle="ascendai · interview prep"
    >
      <form onSubmit={handleGenerate} className="space-y-6" noValidate>
        <div className="space-y-2.5">
          <FieldLabel>skills to test</FieldLabel>
          {profileState === "loading" ? (
            <div aria-busy="true" aria-label="reading your skills" className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ) : (
            <>
              <ChipList values={skills} onChange={setSkills} tone="brand" addLabel="add a skill" />
              <p className="text-xs text-muted">
                {profileState === "ready" ? "from your profile. tap one to edit, x to drop it." : "nothing on your profile yet. add the skills you want to practice."}
              </p>
            </>
          )}
        </div>
        {error && <Note tone="error">{error}</Note>}
        {loading ? (
          <PipStatus outfit="headphones" text="writing your questions…" />
        ) : (
          <InkButton type="submit" busy={loading} busyText="writing…" disabled={profileState === "loading" || skills.length === 0}>
            <Target className="size-4" aria-hidden="true" /> start quiz
          </InkButton>
        )}
      </form>
    </ToolFrame>
  );
}
