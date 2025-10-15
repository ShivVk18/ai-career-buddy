import { getResume } from "@/actions/Resume";
import ResumeBuilder from "./_components/ResumeBuilder";

export default async function ResumePage() {
  const resume = await getResume();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/20">
     
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 container mx-auto py-8 px-4">
        <ResumeBuilder initialContent={resume?.content} 
          initialResume={resume} />
      </div>
    </div>
  );
}