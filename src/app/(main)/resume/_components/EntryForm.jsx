'use client'
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parse, format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { entrySchema } from "@/app/lib/schema";
import { Sparkles, PlusCircle, X, Pencil, Save, Loader2, Calendar, MapPin, CheckCircle } from "lucide-react";
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

  useEffect(() => {
    if (improvedContent && !isImproving) {
      setValue("description", improvedContent);
      toast.success("Description improved successfully!");
    }
    if (improveError) {
      toast.error(improveError.message || "Failed to improve description");
    }
  }, [improvedContent, improveError, isImproving, setValue]);

  const handleImproveDescription = async () => {
    const description = watch("description");
    if (!description) {
      toast.error("Please enter a description first");
      return;
    }

    await improveWithAIFn({
      current: description,
      type: type.toLowerCase(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {entries.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="backdrop-blur-xl bg-slate-800/50 border border-orange-500/20 rounded-2xl p-6 hover:border-orange-500/40 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-white mb-1">
                  {item.title}
                </h4>
                <p className="text-orange-300 font-medium mb-2">
                  {item.organization}
                </p>
                <div className="flex items-center text-sm text-gray-400">
                  <Calendar className="h-4 w-4 mr-2" />
                  {item.current
                    ? `${item.startDate} - Present`
                    : `${item.startDate} - ${item.endDate}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(index)}
                className="backdrop-blur-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 text-rose-300 p-2 rounded-xl transition-all duration-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {item.description}
            </p>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="backdrop-blur-xl bg-slate-800/50 border border-orange-500/20 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-8">
              <h4 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <PlusCircle className="h-6 w-6 text-orange-400 mr-3" />
                Add {type}
              </h4>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Title/Position
                    </label>
                    <Input
                      placeholder="e.g., Software Engineer"
                      {...register("title")}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-orange-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 text-white placeholder-gray-500"
                    />
                    {errors.title && (
                      <p className="text-sm text-rose-400">{errors.title.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Organization/Company
                    </label>
                    <Input
                      placeholder="e.g., Tech Company Inc."
                      {...register("organization")}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-orange-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 text-white placeholder-gray-500"
                    />
                    {errors.organization && (
                      <p className="text-sm text-rose-400">
                        {errors.organization.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Start Date
                    </label>
                    <Input
                      type="month"
                      {...register("startDate")}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-orange-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 text-white"
                    />
                    {errors.startDate && (
                      <p className="text-sm text-rose-400">
                        {errors.startDate.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      End Date
                    </label>
                    <Input
                      type="month"
                      {...register("endDate")}
                      disabled={current}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-orange-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {errors.endDate && (
                      <p className="text-sm text-rose-400">
                        {errors.endDate.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
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
                    className="w-4 h-4 rounded border-orange-500/30 bg-slate-900/50 text-orange-500 focus:ring-orange-500/50 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <label htmlFor="current" className="text-gray-300 font-medium cursor-pointer">
                    Current {type}
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Description
                  </label>
                  <Textarea
                    placeholder={`Describe your ${type.toLowerCase()} responsibilities and achievements...`}
                    className="h-32 w-full px-4 py-3 bg-slate-900/50 border border-orange-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 text-white placeholder-gray-500 resize-none"
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-sm text-rose-400">
                      {errors.description.message}
                    </p>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={handleImproveDescription}
                  disabled={isImproving || !watch("description")}
                  className="backdrop-blur-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 hover:text-purple-200 py-2 px-6 rounded-xl transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImproving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Improving...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Improve with AI</span>
                    </>
                  )}
                </button>
              </div>
              
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-orange-500/20">
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setIsAdding(false);
                  }}
                  className="backdrop-blur-xl bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600/50 hover:border-slate-500/50 text-gray-300 hover:text-white py-2 px-6 rounded-xl transition-all duration-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="bg-gradient-to-r from-orange-600 via-rose-600 to-orange-600 hover:from-orange-500 hover:via-rose-500 hover:to-orange-500 text-white py-2 px-6 rounded-xl transition-all duration-300 flex items-center space-x-2 font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Entry</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full backdrop-blur-xl bg-slate-800/50 hover:bg-slate-800/70 border-2 border-dashed border-orange-500/30 hover:border-orange-500/50 text-orange-300 hover:text-orange-200 py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 font-medium group"
        >
          <PlusCircle className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
          <span>Add {type}</span>
        </button>
      )}
    </div>
  );
}