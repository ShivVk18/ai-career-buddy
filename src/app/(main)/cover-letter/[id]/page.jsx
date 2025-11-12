import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCoverLetter } from "@/actions/CoverLetter";
import CoverLetterPreview from "../_components/CoverLetterPreview";

export default async function EditCoverLetterPage({ params }) {
  const { id } = await params;
  const coverLetter = await getCoverLetter(id);

  return (
    <div className="min-h-screen bg-[#0f0e0a] text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#f59e0b]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#fbbf24]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[#f59e0b]/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto py-8 px-4 relative z-10">
        {/* Navigation */}
        <div className="flex flex-col space-y-6 mb-8">
          <Link href="/cover-letter">
            <Button 
              variant="ghost" 
              className="gap-2 pl-0 text-[#b0b0b0] hover:text-[#f59e0b] hover:bg-[#f59e0b]/10 transition-all duration-300 group w-fit rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
              Back to Cover Letters
            </Button>
          </Link>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#f59e0b]/20 to-[#fbbf24]/20 border border-[#f59e0b]/30 shadow-lg shadow-[#f59e0b]/10">
                <FileText className="h-8 w-8 text-[#f59e0b]" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-[#f59e0b] via-[#fbbf24] to-[#f59e0b] bg-clip-text text-transparent">
                  {coverLetter?.jobTitle} at {coverLetter?.companyName}
                </h1>
                <p className="text-[#b0b0b0] text-lg mt-2">
                  Review and customize your cover letter
                </p>
              </div>
            </div>
          </div>
        </div>

        <CoverLetterPreview content={coverLetter?.content} />
      </div>
    </div>
  );
}