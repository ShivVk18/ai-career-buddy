'use client'
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parse, format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { entrySchema } from "@/app/lib/schema";
import { Sparkles, PlusCircle, X, Pencil, Save, Loader2, Calendar, MapPin } from "lucide-react";
import { improveWithAI } from "@/actions/Resume";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";

const formatDisplayDate = (dateString) => {
  if (!dateString) return "";
  const date = parse(dateString, "yyyy-MM", new Date());
  return format(date, "MMM yyyy");
};

export function EntryForm({ type, entries, onChange }) {
  const [isAdding, setIsAdding] = useState(false);

  const {
    register,
    handleSubmit: handleValidation,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      title: "",
      organization: "",
      startDate: "",
      endDate: "",
      description: "",
      current: false,
    },
  });

  const current = watch("current");

  const handleAdd = handleValidation((data) => {
    const formattedEntry = {
      ...data,
      startDate: formatDisplayDate(data.startDate),
      endDate: data.current ? "" : formatDisplayDate(data.endDate),
    };

    onChange([...entries, formattedEntry]);
    reset();
    setIsAdding(false);
  });

  const handleDelete = (index) => {
    const newEntries = entries.filter((_, i) => i !== index);
    onChange(newEntries);
  };

  const {
    loading: isImproving,
    fn: improveWithAIFn,
    data: improvedContent,
    error: improveError,
  } = useFetch(improveWithAI);

  // Add this effect to handle the improvement result
  useEffect(() => {
    if (improvedContent && !isImproving) {
      setValue("description", improvedContent);
      toast.success("Description improved successfully!");
    }
    if (improveError) {
      toast.error(improveError.message || "Failed to improve description");
    }
  }, [improvedContent, improveError, isImproving, setValue]);

  // Replace handleImproveDescription with this
  const handleImproveDescription = async () => {
    const description = watch("description");
    if (!description) {
      toast.error("Please enter a description first");
      return;
    }

    await improveWithAIFn({
      current: description,
      type: type.toLowerCase(), // 'experience', 'education', or 'project'
    });
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.25, 0.25, 0.75],
      },
    },
    exit: {
      y: -20,
      opacity: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {entries.map((item, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
          >
            <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                <div className="space-y-2">
                  <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {item.title}
                  </CardTitle>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4 mr-1" />
                    {item.organization}
                  </div>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    onClick={() => handleDelete(index)}
                    className="border-0 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 rounded-xl shadow-sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4 mr-2" />
                  {item.current
                    ? `${item.startDate} - Present`
                    : `${item.startDate} - ${item.endDate}`}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap bg-gray-50/50 dark:bg-gray-700/50 p-4 rounded-xl">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
          >
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-800/95 dark:to-gray-900/95 backdrop-blur-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20">
                <CardTitle className="flex items-center text-xl font-semibold text-gray-800 dark:text-gray-200">
                  <PlusCircle className="h-6 w-6 mr-3 text-blue-600" />
                  Add New {type}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Title/Position
                    </label>
                    <Input
                      placeholder={`${type} title or position`}
                      {...register("title")}
                      error={errors.title}
                      className="border-0 bg-white/80 dark:bg-gray-700/80 shadow-sm rounded-xl h-12"
                    />
                    {errors.title && (
                      <p className="text-sm text-red-500">{errors.title.message}</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Organization/Company
                    </label>
                    <Input
                      placeholder="Organization or company name"
                      {...register("organization")}
                      error={errors.organization}
                      className="border-0 bg-white/80 dark:bg-gray-700/80 shadow-sm rounded-xl h-12"
                    />
                    {errors.organization && (
                      <p className="text-sm text-red-500">
                        {errors.organization.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Start Date
                    </label>
                    <Input
                      type="month"
                      {...register("startDate")}
                      error={errors.startDate}
                      className="border-0 bg-white/80 dark:bg-gray-700/80 shadow-sm rounded-xl h-12"
                    />
                    {errors.startDate && (
                      <p className="text-sm text-red-500">
                        {errors.startDate.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      End Date
                    </label>
                    <Input
                      type="month"
                      {...register("endDate")}
                      disabled={current}
                      error={errors.endDate}
                      className="border-0 bg-white/80 dark:bg-gray-700/80 shadow-sm rounded-xl h-12 disabled:opacity-50"
                    />
                    {errors.endDate && (
                      <p className="text-sm text-red-500">
                        {errors.endDate.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl">
                  <input
                    type="checkbox"
                    id="current"
                    {...register("current")}
                    onChange={(e) => {
                      setValue("current", e.target.checked);
                      if (e.target.checked) {
                        setValue("endDate", "");
                      }
                    }}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="current" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    This is my current {type.toLowerCase()}
                  </label>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <Textarea
                    placeholder={`Describe your ${type.toLowerCase()}, key achievements, and responsibilities...`}
                    className="h-32 border-0 bg-white/80 dark:bg-gray-700/80 shadow-sm rounded-xl resize-none"
                    {...register("description")}
                    error={errors.description}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleImproveDescription}
                    disabled={isImproving || !watch("description")}
                    className="w-full border-0 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 text-purple-700 dark:text-purple-300 rounded-2xl py-3 shadow-lg"
                  >
                    {isImproving ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Enhancing with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Improve with AI ✨
                      </>
                    )}
                  </Button>
                </motion.div>
              </CardContent>
              <CardFooter className="bg-gray-50/50 dark:bg-gray-800/50 flex justify-end space-x-4 p-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      reset();
                      setIsAdding(false);
                    }}
                    className="px-6 py-3 border-gray-200 dark:border-gray-600 rounded-2xl"
                  >
                    Cancel
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    type="button"
                    onClick={handleAdd}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-2xl shadow-lg"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add {type}
                  </Button>
                </motion.div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!isAdding && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            className="w-full py-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 dark:from-gray-800 dark:to-gray-700 dark:hover:from-gray-700 dark:hover:to-gray-600 text-gray-700 dark:text-gray-300 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300"
            variant="outline"
            onClick={() => setIsAdding(true)}
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Add New {type}
          </Button>
        </motion.div>
      )}
    </div>
  );
}