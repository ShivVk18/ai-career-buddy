

import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCoverLetter } from "@/actions/CoverLetter";
import CoverLetterPreview from "../_components/CoverLetterPreview";

export default async function EditCoverLetterPage({ params }) {
  const { id } = await params;
  const coverLetter = await getCoverLetter(id);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/6 left-1/5 w-2 h-2 bg-blue-400/10 rounded-full blur-sm animate-pulse"></div>
        <div className="absolute top-1/2 right-1/6 w-3 h-3 bg-purple-400/10 rounded-full blur-sm animate-bounce"></div>
        <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-pink-400/10 rounded-full blur-sm animate-pulse"></div>
      </div>

      <div className="container mx-auto py-8 px-4 relative z-10">
        {/* Navigation */}
        <div className="flex flex-col space-y-6 mb-8">
          <Link href="/cover-letter">
            <Button 
              variant="ghost" 
              className="gap-2 pl-0 text-gray-400 hover:text-white transition-colors duration-300 group w-fit"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
              Back to Cover Letters
            </Button>
          </Link>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10">
                <FileText className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-300 bg-clip-text text-transparent">
                  {coverLetter?.jobTitle} at {coverLetter?.companyName}
                </h1>
                <p className="text-gray-400 text-lg mt-2">
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