import { BarLoader } from "react-spinners";
import { Suspense } from "react";
import { Sparkles, TrendingUp } from "lucide-react";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/20">
   
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-5 py-8">
       
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-rose-500/10 border border-orange-500/20 backdrop-blur-xl mb-6">
            <Sparkles className="h-4 w-4 text-orange-400 mr-2" />
            <span className="text-sm font-medium text-orange-300">Market Intelligence</span>
            <TrendingUp className="h-4 w-4 text-rose-400 ml-2" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400 bg-clip-text text-transparent">
            Industry Insights
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            Real-time market trends, salary data, and career insights
          </p>
        </div>

        <Suspense
          fallback={
            <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8">
              <BarLoader width={"100%"} color="#f97316" />
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
    </div>
  );
}