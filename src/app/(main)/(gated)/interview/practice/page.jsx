"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { generateOpenQuestions, scoreOpenAnswer, getOpenSession } from "@/actions/Practice";
import { saveWeakSpot } from "@/actions/Track";
import PracticeScreen from "@/components/interview/PracticeScreen";

const actions = { generateOpenQuestions, scoreOpenAnswer, getOpenSession, saveWeakSpot };

function PracticeInner() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session");
  return (
    <PracticeScreen
      actions={actions}
      sessionId={sessionId}
      applicationId={params.get("application")}
      invite={!!sessionId}
      onFinish={(id) => router.push(`/interview/practice/${id}`)}
    />
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={null}>
      <PracticeInner />
    </Suspense>
  );
}
