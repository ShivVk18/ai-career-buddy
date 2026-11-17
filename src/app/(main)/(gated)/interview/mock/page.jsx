'use client'

import Link from "next/link";
import { ArrowLeft, Sparkles, Brain, Target, Loader2, ChevronLeft } from "lucide-react";
import Quiz from "../_components/Quiz";
import { useState } from "react";
import { generateQuiz } from "@/actions/Interview";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function MockInterviewPage() {
  const router = useRouter();
  const [skills, setSkills] = useState("");
  const [quizReady, setQuizReady] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const arr = skills.split(",").map(s => s.trim()).filter(Boolean);
      const generatedQuestions = await generateQuiz(arr);
      setQuestions(generatedQuestions);
      setQuizReady(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent py-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto relative z-10">
        <Link href="/interview">
          <Button variant="ghost" className="mb-12 text-muted-foreground hover:text-foreground gap-3 px-0 group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Back to Hub</span>
          </Button>
        </Link>

        {!quizReady && (
          <div className="flex justify-center mt-32">
            <Dialog open={!quizReady} onOpenChange={(open) => { if (!open) router.push("/interview"); }}>
              <DialogContent className="bg-background border-border rounded-sm sm:max-w-md p-10 shadow-2xl">
                <DialogHeader className="mb-8">
                  <DialogTitle className="font-clash font-bold text-2xl uppercase tracking-tight text-foreground flex items-center gap-4">
                    <Brain className="w-6 h-6 text-accent" />
                    Interview Prep
                  </DialogTitle>
                  <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest mt-2">
                    Enter the skills you want to practice today.
                  </p>
                </DialogHeader>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">What skills should we test?</label>
                  <Input
                    placeholder="e.g., React, Node.js, Leadership"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="h-14"
                  />
                  <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest mt-2 font-medium">Separate multiple skills with commas.</p>
                </div>

                <DialogFooter className="mt-10 flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/interview")}
                    disabled={loading}
                    className="w-full sm:w-auto h-14 order-2 sm:order-1 border-divider"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleGenerate} 
                    disabled={loading || !skills || skills.trim() === ""} 
                    className="w-full sm:flex-1 h-14 shadow-lg order-1 sm:order-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Target className="mr-3 h-4 w-4" />
                        Start Practice
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {quizReady && (
          <div className="animate-in fade-in duration-700">
            <Quiz 
              initialQuestions={questions} 
              onComplete={() => {
                setQuizReady(false);
                setQuestions([]);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}