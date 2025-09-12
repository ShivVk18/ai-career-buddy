import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { 
  TrendingUp, 
  Sparkles, 
  ChevronDown, 
  FileText, 
  PenBox, 
  GraduationCap,
  MapPin,
  Target,
  BookOpen,
  Award,
  Users,
  Calendar
} from "lucide-react";
import { checkUser } from "@/lib/checkUser";

export default async function Header() {
  await checkUser();

  return (
    <header className="sticky top-0 w-full z-50 ">
      {/* Modern gradient background with enhanced glass effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-blue-900/20 to-purple-900/40 backdrop-blur-2xl border-b border-white/10"></div>
      
      {/* Animated gradient line - matching hero colors */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 through-purple-400/40 to-transparent">
        <div className="h-full bg-gradient-to-r from-blue-500/30 to-purple-500/30 animate-pulse"></div>
      </div>

      {/* Floating light effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <nav className="relative container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo Section with enhanced hover effects */}
        <Link href="/" className="group flex items-center space-x-3">
          <div className="relative">
            <Image
              src={"/logo.png"}
              alt="Sensai Logo"
              width={180}
              height={50}
              className="h-10 w-auto object-contain transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
            />
            {/* Enhanced glow effect matching hero colors */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/20 to-blue-500/30 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 scale-150"></div>
          </div>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center space-x-3">
          <SignedIn>
            {/* Dashboard Link with updated styling */}
            <Link href="/dashboard" className="group">
              <Button
                variant="ghost"
                className="hidden lg:inline-flex items-center gap-3 px-4 py-2 h-11 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-200 hover:text-white transition-all duration-500 rounded-2xl group-hover:shadow-lg group-hover:shadow-blue-500/20 backdrop-blur-sm"
              >
                <TrendingUp className="h-4 w-4 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                <span className="font-medium">Industry Insights</span>
              </Button>
              
              {/* Mobile version */}
              <Button 
                variant="ghost" 
                className="lg:hidden w-11 h-11 p-0 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl backdrop-blur-sm transition-all duration-300"
              >
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </Button>
            </Link>

            {/* Growth Tools Dropdown with enhanced styling and Career Roadmap */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="group relative px-5 py-2 h-11 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-500 hover:via-purple-500 hover:to-blue-600 text-white shadow-xl hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-500 rounded-2xl border-0 overflow-hidden">
                  <Sparkles className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-500" />
                  <span className="hidden md:inline font-semibold">Growth Hub</span>
                  <span className="md:hidden font-semibold">Hub</span>
                  <ChevronDown className="h-4 w-4 ml-2 group-hover:rotate-180 transition-transform duration-500" />
                  
                  {/* Enhanced animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 opacity-0 group-hover:opacity-30 transition-all duration-500 animate-pulse"></div>
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent 
                align="end" 
                className="w-72 mt-2 bg-gray-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50 rounded-3xl p-3"
              >
                {/* Career Roadmap Section */}
                <DropdownMenuLabel className="px-2 py-1 text-xs font-medium text-purple-400 uppercase tracking-wider">
                  Career Roadmap
                </DropdownMenuLabel>
                
                <DropdownMenuItem asChild>
                  <Link 
                    href="/roadmap" 
                    className="flex items-center gap-3 px-4 py-3 text-gray-200 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-blue-500/10 rounded-2xl transition-all duration-300 group cursor-pointer"
                  >
                    <div className="p-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 rounded-xl group-hover:scale-110 transition-all duration-300">
                      <MapPin className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <div className="font-medium">My Career Path</div>
                      <div className="text-xs text-gray-400">Personalized roadmap</div>
                    </div>
                  </Link>
                </DropdownMenuItem>

                

                <DropdownMenuSeparator className="my-2 bg-white/10" />

                {/* Tools Section */}
                <DropdownMenuLabel className="px-2 py-1 text-xs font-medium text-blue-400 uppercase tracking-wider">
                  Career Tools
                </DropdownMenuLabel>
                
                <DropdownMenuItem asChild>
                  <Link 
                    href="/resume" 
                    className="flex items-center gap-3 px-4 py-3 text-gray-200 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300 group cursor-pointer"
                  >
                    <div className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl group-hover:scale-110 transition-all duration-300">
                      <FileText className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium">Resume Builder</div>
                      <div className="text-xs text-gray-400">AI-powered creation</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link
                    href="/cover-letter"
                    className="flex items-center gap-3 px-4 py-3 text-gray-200 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300 group cursor-pointer"
                  >
                    <div className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-xl group-hover:scale-110 transition-all duration-300">
                      <PenBox className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <div className="font-medium">Cover Letter</div>
                      <div className="text-xs text-gray-400">Smart generation</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link 
                    href="/interview" 
                    className="flex items-center gap-3 px-4 py-3 text-gray-200 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300 group cursor-pointer"
                  >
                    <div className="p-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-xl group-hover:scale-110 transition-all duration-300">
                      <GraduationCap className="h-4 w-4 text-orange-400" />
                    </div>
                    <div>
                      <div className="font-medium">Interview Prep</div>
                      <div className="text-xs text-gray-400">Practice & improve</div>
                    </div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2 bg-white/10" />

                
            

               
              </DropdownMenuContent>
            </DropdownMenu>
          </SignedIn>

          {/* Authentication with modern styling */}
          <SignedOut>
            <SignInButton>
              <Button 
                variant="outline" 
                className="px-3 sm:px-4 lg:px-6 py-2 h-9 sm:h-10 lg:h-11 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 text-gray-200 hover:text-white rounded-xl sm:rounded-2xl font-medium transition-all duration-500 text-sm sm:text-base backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/20"
              >
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <div className="relative">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 ring-2 ring-white/20 hover:ring-blue-400/50 transition-all duration-500 hover:scale-105",
                    userButtonPopoverCard: "bg-gray-900/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50 rounded-3xl",
                    userPreviewMainIdentifier: "font-semibold text-gray-100",
                    userPreviewSecondaryIdentifier: "text-gray-400",
                    userButtonPopoverActions: "bg-white/5 rounded-2xl",
                    userButtonPopoverActionButton: "text-gray-200 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300",
                    userButtonPopoverFooter: "bg-white/5 rounded-b-2xl",
                  },
                }}
                afterSignOutUrl="/"
              />
              
              {/* Enhanced status indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-r from-green-400 to-blue-400 rounded-full border-2 border-gray-900 shadow-lg shadow-green-500/50">
                <div className="w-full h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full animate-ping opacity-75"></div>
              </div>
            </div>
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}