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
     <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/10 to-rose-500/10 border border-orange-500/30 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-300 text-sm font-medium mb-1">Total Letters</p>
              <p className="text-3xl font-bold text-white">{coverLetters.length}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
              <FileText className="h-7 w-7 text-orange-400" />
            </div>
          </div>
        </div>
        
        <div className="backdrop-blur-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-300 text-sm font-medium mb-1">This Month</p>
              <p className="text-3xl font-bold text-white">
                {coverLetters.filter(letter => {
                  const letterDate = new Date(letter.createdAt);
                  const now = new Date();
                  return letterDate.getMonth() === now.getMonth() && letterDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Calendar className="h-7 w-7 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/30 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-300 text-sm font-medium mb-1">Companies</p>
              <p className="text-3xl font-bold text-white">
                {new Set(coverLetters.map(letter => letter.companyName)).size}
              </p>
            </div>
            <div className="w-14 h-14 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
              <Building2 className="h-7 w-7 text-rose-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Cover Letters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {coverLetters.map((letter, index) => (
          <div 
            key={letter.id} 
            className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 hover:border-orange-500/30 p-8 shadow-2xl transition-all duration-500 group hover:scale-[1.02] cursor-pointer"
            onClick={() => router.push(`/cover-letter/${letter.id}`)}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500/20 to-rose-500/20 border border-orange-500/30">
                    <Briefcase className="h-4 w-4 text-orange-400" />
                  </div>
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Cover Letter
                  </span>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent mb-2 group-hover:from-orange-300 group-hover:to-rose-300 transition-all duration-300">
                  {letter.jobTitle}
                </h3>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-400 font-medium">{letter.companyName}</p>
                </div>
              </div>
              
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/cover-letter/${letter.id}`);
                  }}
                  className="h-9 w-9 p-0 rounded-xl bg-slate-800/50 border border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-600/20 text-gray-400 hover:text-orange-400 transition-all duration-300"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                      className="h-9 w-9 p-0 rounded-xl bg-slate-800/50 border border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-600/20 text-gray-400 hover:text-rose-400 transition-all duration-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="backdrop-blur-xl bg-slate-900/95 border-orange-500/20">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white text-xl">Delete Cover Letter?</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400">
                        This action cannot be undone. This will permanently delete your cover letter for{" "}
                        <span className="text-orange-400 font-semibold">{letter.jobTitle}</span> at{" "}
                        <span className="text-orange-400 font-semibold">{letter.companyName}</span>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-slate-800/50 border-orange-500/20 text-gray-300 hover:bg-slate-800/70">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(letter.id)}
                        className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white border-0"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>Created {format(new Date(letter.createdAt), "MMM dd, yyyy")}</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                  <span className="text-xs text-green-400 font-medium flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ready
                  </span>
                </div>
              </div>

              <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
                {letter.jobDescription}
              </p>
              
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 text-xs rounded-full bg-gradient-to-r from-orange-500/20 to-rose-500/20 border border-orange-500/30 text-orange-400">
                  AI Generated
                </span>
                <span className="px-3 py-1 text-xs rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400">
                  Professional
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}