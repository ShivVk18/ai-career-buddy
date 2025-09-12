import { getResume } from "@/actions/Resume";
import ResumeBuilder from "./_components/ResumeBuilder";


export default async function ResumePage() {
  const resume = await getResume();

  return (
    <div className="min-h-screen bg-black">
      <div className="relative z-10 container mx-auto py-8 px-4">
        <ResumeBuilder initialContent={resume?.content} />
      </div>
    </div>
  );
}
