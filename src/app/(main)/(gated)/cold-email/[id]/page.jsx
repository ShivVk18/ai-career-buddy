import Link from "next/link"
import { ArrowLeft, FileText, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

import ColdEmailPreview from "../_components/ColdEmailPreview"
import { getColdEmail } from "@/actions/ColdEmail"

export default async function EditColdEmailPage({ params }) {
  const { id } = await params
  const coldEmail = await getColdEmail(id)

  return (
    <div className="min-h-screen bg-transparent text-foreground relative py-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Navigation */}
        <div className="flex flex-col space-y-12 mb-16 border-b border-divider pb-12">
          <Link href="/cold-email">
            <Button
              variant="ghost"
              className="gap-3 pl-0 text-muted-foreground hover:text-foreground transition-editorial group"
            >
              <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Back to Emails</span>
            </Button>
          </Link>

          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="p-5 rounded-sm border border-divider bg-divider/10 transition-editorial shadow-sm">
                <FileText className="h-8 w-8 text-accent" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase mb-2 block">Email Detail</span>
                <h1 className="text-3xl md:text-5xl font-clash font-bold text-foreground uppercase tracking-tight leading-none">
                  {coldEmail?.jobTitle} <span className="text-muted-foreground font-light">at</span> {coldEmail?.companyName}
                </h1>
                <p className="text-muted-foreground text-sm md:text-lg mt-3 font-light">
                  Review and copy your personalized outreach message.
                </p>
              </div>
            </div>
          </div>
        </div>

        <ColdEmailPreview content={coldEmail?.content} />
      </div>
    </div>
  )
}