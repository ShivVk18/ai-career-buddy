import { Suspense } from "react";
import { Loader } from "lucide-react";

export default function Layout({ children }) {
  return (
    <div >
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <Loader className="w-12 h-12 animate-spin primar mx-auto" />
              <p className="text-gray-400 text-sm">Loading your roadmap...</p>
            </div>
          </div>
        } 
      >
        {children}
      </Suspense>
    </div>
  );
}