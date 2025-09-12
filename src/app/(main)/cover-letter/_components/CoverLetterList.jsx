"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Eye, Trash2, FileText, Calendar, Building2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteCoverLetter } from "@/actions/CoverLetter";

export default function CoverLetterList({ coverLetters }) {
  const router = useRouter();

  const handleDelete = async (id) => {
    try {
      await deleteCoverLetter(id);
      toast.success("Cover letter deleted successfully!");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Failed to delete cover letter");
    }
  };

  if (!coverLetters?.length) {
    return (
      <div className="relative">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/10 rounded-full blur-sm animate-pulse"></div>
          <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-purple-400/10 rounded-full blur-sm animate-bounce"></div>
        </div>

        <Card className="glass-dark border-white/10 backdrop-blur-xl relative z-10">
          <CardHeader className="text-center py-16">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10">
                <FileText className="h-12 w-12 text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white mb-2">No Cover Letters Yet</CardTitle>
            <CardDescription className="text-gray-400 text-lg">
              Create your first AI-generated cover letter to get started
            </CardDescription>
            <div className="mt-8">
              <Button 
                onClick={() => router.push('/cover-letter/new')}
                className="px-8 py-3 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                Create Your First Cover Letter
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/6 left-1/5 w-2 h-2 bg-blue-400/5 rounded-full blur-sm animate-pulse"></div>
        <div className="absolute top-2/3 right-1/4 w-3 h-3 bg-purple-400/5 rounded-full blur-sm animate-bounce"></div>
        <div className="absolute bottom-1/4 left-2/3 w-1 h-1 bg-pink-400/5 rounded-full blur-sm animate-pulse"></div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Letters</p>
              <p className="text-2xl font-bold text-white">{coverLetters.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-600/20">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">This Month</p>
              <p className="text-2xl font-bold text-white">
                {coverLetters.filter(letter => {
                  const letterDate = new Date(letter.createdAt);
                  const now = new Date();
                  return letterDate.getMonth() === now.getMonth() && letterDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-600/20">
              <Calendar className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Companies</p>
              <p className="text-2xl font-bold text-white">
                {new Set(coverLetters.map(letter => letter.companyName)).size}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-600/20">
              <Building2 className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Cover Letters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {coverLetters.map((letter, index) => (
          <Card 
            key={letter.id} 
            className="glass-dark border-white/10 hover:border-white/30 transition-all duration-500 backdrop-blur-xl group hover:scale-[1.02] cursor-pointer"
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                      <Briefcase className="h-4 w-4 text-blue-400" />
                    </div>
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                      Cover Letter
                    </span>
                  </div>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300">
                    {letter.jobTitle}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <CardDescription className="text-gray-400 font-medium">
                      {letter.companyName}
                    </CardDescription>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/cover-letter/${letter.id}`);
                    }}
                    className="h-8 w-8 p-0 rounded-xl glass-dark border border-white/20 hover:border-blue-400/50 hover:bg-blue-600/20 text-gray-400 hover:text-blue-400 transition-all duration-300"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 w-8 p-0 rounded-xl glass-dark border border-white/20 hover:border-red-400/50 hover:bg-red-600/20 text-gray-400 hover:text-red-400 transition-all duration-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass-dark border-white/20 backdrop-blur-xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete Cover Letter?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                          This action cannot be undone. This will permanently delete your cover letter for{" "}
                          <span className="text-white font-semibold">{letter.jobTitle}</span> at{" "}
                          <span className="text-white font-semibold">{letter.companyName}</span>.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="glass-dark border-white/20 text-gray-300 hover:bg-white/10">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(letter.id)}
                          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0" onClick={() => router.push(`/cover-letter/${letter.id}`)}>
              {/* Date and Status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>Created {format(new Date(letter.createdAt), "MMM dd, yyyy")}</span>
                </div>
                <div className="px-2 py-1 rounded-full bg-green-600/20 border border-green-500/30">
                  <span className="text-xs text-green-400 font-medium">Ready</span>
                </div>
              </div>

              {/* Job Description Preview */}
              <div className="space-y-3">
                <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
                  {letter.jobDescription}
                </p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-xs rounded-full glass-dark border border-blue-500/30 text-blue-400">
                    AI Generated
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full glass-dark border border-purple-500/30 text-purple-400">
                    Professional
                  </span>
                </div>
              </div>

              {/* Hover Effect Gradient */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}