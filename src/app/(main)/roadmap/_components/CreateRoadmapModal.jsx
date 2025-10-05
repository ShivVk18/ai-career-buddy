"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Zap, Brain } from "lucide-react";
import { generateCareerRoadmap } from "@/actions/CareerRoadmap";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const CreateRoadmapModal = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentRole: "",
    targetRole: "",
    industry: "",
    timeline: "",
  });
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const roadmap = await generateCareerRoadmap(formData);
      toast.success("Career roadmap generated successfully!");
      router.refresh();
      onClose();
      router.push(`/roadmap/${roadmap.id}`);
    } catch (error) {
      toast.error(error.message || "Failed to generate roadmap");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-0 bg-transparent p-0 sm:rounded-3xl">
        <div className="backdrop-blur-xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 rounded-3xl border-2 border-orange-500/30 p-8 shadow-2xl">
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <DialogHeader className="text-center pb-6 space-y-4">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-orange-500/20 to-rose-500/20 flex items-center justify-center border border-orange-500/30">
                      <Sparkles className="h-8 w-8 text-orange-400" />
                    </div>
                  </motion.div>
                  <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400 bg-clip-text text-transparent">
                    Create Your Career Roadmap
                  </DialogTitle>
                  <p className="text-gray-400 flex items-center justify-center gap-2">
                    <Brain className="h-4 w-4 text-rose-400" />
                    Let AI design a personalized path to your dream role
                  </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentRole" className="text-sm font-medium text-gray-300">
                        Current Role
                      </Label>
                      <Input
                        id="currentRole"
                        name="currentRole"
                        placeholder="e.g. Software Engineer"
                        value={formData.currentRole}
                        onChange={handleChange}
                        required
                        className="bg-slate-800/50 border border-orange-500/20 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 rounded-xl text-white placeholder-gray-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetRole" className="text-sm font-medium text-gray-300">
                        Target Role
                      </Label>
                      <Input
                        id="targetRole"
                        name="targetRole"
                        placeholder="e.g. Senior Software Architect"
                        value={formData.targetRole}
                        onChange={handleChange}
                        required
                        className="bg-slate-800/50 border border-orange-500/20 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 rounded-xl text-white placeholder-gray-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry" className="text-sm font-medium text-gray-300">
                      Industry
                    </Label>
                    <Input
                      id="industry"
                      name="industry"
                      placeholder="e.g. Technology, Healthcare, Finance"
                      value={formData.industry}
                      onChange={handleChange}
                      required
                      className="bg-slate-800/50 border border-orange-500/20 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 rounded-xl text-white placeholder-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeline" className="text-sm font-medium text-gray-300">
                      Desired Timeline (Optional)
                    </Label>
                    <Input
                      id="timeline"
                      name="timeline"
                      placeholder="e.g. 12 months, 2 years"
                      value={formData.timeline}
                      onChange={handleChange}
                      className="bg-slate-800/50 border border-orange-500/20 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 rounded-xl text-white placeholder-gray-500"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="flex-1 backdrop-blur-xl bg-slate-800/50 border border-gray-500/30 hover:border-gray-500/50 hover:bg-slate-800/70 rounded-xl text-white transition-all duration-300"
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <motion.div
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                      className="flex-1"
                    >
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-orange-600 via-rose-600 to-orange-600 hover:from-orange-500 hover:via-rose-500 hover:to-orange-500 text-white border-0 rounded-xl disabled:opacity-50 font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Zap className="h-5 w-5 mr-2" />
                            Generate Roadmap
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoadmapModal;