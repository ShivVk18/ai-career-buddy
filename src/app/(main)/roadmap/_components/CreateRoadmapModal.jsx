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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
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

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.25, 0.25, 0.75],
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <AnimatePresence>
          {open && (
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <DialogHeader className="text-center pb-6">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-4"
                >
                  <Sparkles className="h-8 w-8 text-yellow-500 mx-auto" />
                </motion.div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Create Your Career Roadmap
                </DialogTitle>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Let AI design a personalized path to your dream role
                </p>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentRole" className="text-sm font-medium">
                      Current Role
                    </Label>
                    <Input
                      id="currentRole"
                      name="currentRole"
                      placeholder="e.g. Software Engineer"
                      value={formData.currentRole}
                      onChange={handleChange}
                      required
                      className="border-gray-200 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetRole" className="text-sm font-medium">
                      Target Role
                    </Label>
                    <Input
                      id="targetRole"
                      name="targetRole"
                      placeholder="e.g. Senior Software Architect"
                      value={formData.targetRole}
                      onChange={handleChange}
                      required
                      className="border-gray-200 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-sm font-medium">
                    Industry
                  </Label>
                  <Input
                    id="industry"
                    name="industry"
                    placeholder="e.g. Technology, Healthcare, Finance"
                    value={formData.industry}
                    onChange={handleChange}
                    required
                    className="border-gray-200 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeline" className="text-sm font-medium">
                    Desired Timeline (Optional)
                  </Label>
                  <Input
                    id="timeline"
                    name="timeline"
                    placeholder="e.g. 12 months, 2 years"
                    value={formData.timeline}
                    onChange={handleChange}
                    className="border-gray-200 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 rounded-xl"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-xl disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
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
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoadmapModal;