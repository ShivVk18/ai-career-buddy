import Link from "next/link"
import { redirect } from "next/navigation";
import { getUserOnboardingStatus } from "@/actions/User";
import { Plus, Sparkles, FileText, TrendingUp, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import ColdEmailList from "./_components/ColdEmailList"
import { getColdEmails } from "@/actions/ColdEmail"

export default async function ColdEmailPage() {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const coldEmails = await getColdEmails()

  return (
    <div className="min-h-screen bg-transparent py-12 px-6 md:px-12">
      <div className="container mx-auto relative z-10">
        {/* Header Section */}
        <div className="mb-16 border-b border-divider pb-12">
          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-8 h-[1px] bg-accent"></div>
                <span className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">
                  Outreach Library
                </span>
              </div>

              <h1 className="text-4xl md:text-7xl font-clash font-bold text-foreground uppercase tracking-tight leading-none mb-6">
                Cold <span className="text-accent">Emails</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-light leading-relaxed">
                Connect directly with recruiters and hiring managers. Our AI helps you craft messages that open doors and start conversations.
              </p>
            </div>

            <Link href="/cold-email/new">
              <Button size="lg" className="h-14 px-10 group shadow-lg">
                <Plus className="h-5 w-5 mr-3 group-hover:rotate-90 transition-editorial" />
                New Cold Email
                <Sparkles className="h-4 w-4 ml-3" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="border border-border bg-background p-8 rounded-sm hover:border-accent transition-editorial shadow-sm group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-sm border border-divider flex items-center justify-center bg-divider/10 group-hover:border-accent transition-editorial shadow-sm">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-foreground font-clash font-bold uppercase tracking-tight text-lg">AI-Driven</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed font-general font-light">
              Create highly personalized emails that focus on what hiring managers actually care about. No generic templates.
            </p>
          </div>

          <div className="border border-border bg-background p-8 rounded-sm hover:border-accent transition-editorial shadow-sm group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-sm border border-divider flex items-center justify-center bg-divider/10 group-hover:border-accent transition-editorial shadow-sm">
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-foreground font-clash font-bold uppercase tracking-tight text-lg">Proven Frameworks</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed font-general font-light">
              Our AI follows world-class outreach frameworks designed to respect the recipient&apos;s time and maximize replies.
            </p>
          </div>

          <div className="border border-border bg-background p-8 rounded-sm hover:border-accent transition-editorial shadow-sm group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-sm border border-divider flex items-center justify-center bg-divider/10 group-hover:border-accent transition-editorial shadow-sm">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-foreground font-clash font-bold uppercase tracking-tight text-lg">Higher Replies</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed font-general font-light">
              Stop sending emails into the void. Increase your response rates with messages that stand out in a crowded inbox.
            </p>
          </div>
        </div>

        {/* Cold Emails List */}
        <div className="border border-border p-8 rounded-sm bg-background shadow-lg">
          <h3 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-8 flex items-center gap-3">
            <span className="w-4 h-[1px] bg-divider"></span>
            Saved Emails
          </h3>
          <ColdEmailList coldEmails={coldEmails} />
        </div>
      </div>
    </div>
  )
}