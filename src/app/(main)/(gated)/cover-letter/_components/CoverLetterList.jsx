"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Eye, Trash2, FileText, Calendar, Building2, Briefcase, CheckCircle, ChevronRight } from "lucide-react";
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
        <Card className="bg-divider/5 border-divider/30 rounded-sm">
          <CardHeader className="text-center py-20">
            <div className="flex items-center justify-center mb-8">
              <div className="p-6 rounded-sm border border-divider bg-divider/10 transition-editorial group shadow-sm">
                <FileText className="h-12 w-12 text-accent" />
              </div>
            </div>
            <CardTitle className="text-2xl font-clash font-bold text-foreground uppercase tracking-tight mb-2">No Cover Letters Yet</CardTitle>
            <CardDescription className="text-muted-foreground text-lg font-light max-w-md mx-auto">
              Ready to stand out? Create your first AI-generated cover letter today.
            </CardDescription>
            <div className="mt-10">
              <Button 
                onClick={() => router.push('/cover-letter/new')}
                className="h-14 px-10 shadow-lg"
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
    <div className="space-y-12">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="border border-divider bg-divider/5 rounded-sm p-8 shadow-sm group hover:border-accent transition-editorial">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase mb-2">Total Letters</p>
              <p className="text-4xl font-clash font-bold text-foreground tracking-tight">{coverLetters.length}</p>
            </div>
            <div className="w-16 h-16 rounded-sm bg-divider/10 flex items-center justify-center border border-divider/50 group-hover:border-accent/50 transition-editorial">
              <FileText className="h-8 w-8 text-accent" />
            </div>
          </div>
        </div>
        
        <div className="border border-divider bg-divider/5 rounded-sm p-8 shadow-sm group hover:border-accent transition-editorial">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase mb-2">This Month</p>
              <p className="text-4xl font-clash font-bold text-foreground tracking-tight">
                {coverLetters.filter(letter => {
                  const letterDate = new Date(letter.createdAt);
                  const now = new Date();
                  return letterDate.getMonth() === now.getMonth() && letterDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="w-16 h-16 rounded-sm bg-divider/10 flex items-center justify-center border border-divider/50 group-hover:border-accent/50 transition-editorial">
              <Calendar className="h-8 w-8 text-accent" />
            </div>
          </div>
        </div>

        <div className="border border-divider bg-divider/5 rounded-sm p-8 shadow-sm group hover:border-accent transition-editorial">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase mb-2">Companies</p>
              <p className="text-4xl font-clash font-bold text-foreground tracking-tight">
                {new Set(coverLetters.map(letter => letter.companyName)).size}
              </p>
            </div>
            <div className="w-16 h-16 rounded-sm bg-divider/10 flex items-center justify-center border border-divider/50 group-hover:border-accent/50 transition-editorial">
              <Building2 className="h-8 w-8 text-accent" />
            </div>
          </div>
        </div>
      </div>

      {/* Cover Letters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {coverLetters.map((letter) => (
          <div 
            key={letter.id} 
            className="border border-divider bg-background rounded-sm p-8 shadow-sm hover:shadow-xl hover:border-accent/50 transition-editorial group relative overflow-hidden"
            onClick={() => router.push(`/cover-letter/${letter.id}`)}
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-0 group-hover:opacity-100 transition-editorial"></div>

            <div className="flex items-start justify-between mb-8">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 rounded-sm bg-accent/10 border border-accent/20">
                    <Briefcase className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Cover Letter
                  </span>
                </div>
                <h3 className="text-2xl font-clash font-bold text-foreground uppercase tracking-tight mb-2 group-hover:text-accent transition-editorial">
                  {letter.jobTitle}
                </h3>
                <div className="flex items-center space-x-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-muted-foreground font-medium text-sm">{letter.companyName}</p>
                </div>
              </div>
              
              <div className="flex space-x-3 opacity-0 group-hover:opacity-100 transition-editorial">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/cover-letter/${letter.id}`);
                  }}
                  className="h-10 w-10 p-0 rounded-sm border border-divider hover:border-accent hover:bg-accent/10"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                      className="h-10 w-10 p-0 rounded-sm border border-divider hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-background border-divider rounded-sm">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-clash font-bold uppercase tracking-tight">Delete Cover Letter?</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground font-light">
                        This action cannot be undone. This will permanently delete your cover letter for{" "}
                        <span className="text-accent font-bold">{letter.jobTitle}</span> at{" "}
                        <span className="text-accent font-bold">{letter.companyName}</span>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-sm border-divider">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(letter.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-sm"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-t border-divider pt-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3.5 w-3.5 text-accent" />
                  <span>{format(new Date(letter.createdAt), "MMM dd, yyyy")}</span>
                </div>
                <div className="flex items-center space-x-2 text-accent">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Ready to use</span>
                </div>
              </div>

              <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed font-light italic">
                &quot;{letter.jobDescription}&quot;
              </p>
              
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm bg-accent/5 border border-accent/20 text-accent">
                  AI Generated
                </span>
                <span className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm bg-divider/10 border border-divider/20 text-muted-foreground">
                  Professional
                </span>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <div className="flex items-center gap-2 text-accent text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-editorial">
                <span>View Letter</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}