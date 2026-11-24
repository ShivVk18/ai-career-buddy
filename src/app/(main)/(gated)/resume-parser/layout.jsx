import { Suspense } from "react";
import { Loader } from "lucide-react";

export default function Layout({ children }) {
  return (
    <div >
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <Loader className="w-12 h-12 animate-spin text-orange-500 mx-auto" />
              <p className="text-gray-400 text-sm">Loading Parser</p>
            </div>
          </div>
        } 
      >
        {children}
      </Suspense>
    </div>
  );
}