import { Suspense } from "react";
import { BarLoader } from "react-spinners";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/20">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <BarLoader width={200} color="#f97316" />
              <p className="text-gray-400 text-sm">Loading...</p>
            </div>
          </div>
        }
      >
        {children}
      </Suspense>
    </div>
  );
}