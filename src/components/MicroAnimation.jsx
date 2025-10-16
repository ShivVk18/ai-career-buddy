import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export const QuizSkeleton = () => {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="w-full h-[140px] sm:h-[160px]">
      <motion.div
        onClick={() => setFlipped(!flipped)}
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.99 }}
        className="relative w-full h-full cursor-pointer [perspective:1000px]"
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center rounded-lg shadow-lg shadow-orange-500/30 backface-hidden"
        >
          <motion.div
            animate={{ opacity: flipped ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            className="text-center px-3"
          >
            <div className="text-[10px] sm:text-xs opacity-80 mb-1.5 uppercase tracking-wide">Question</div>
            <div className="text-sm sm:text-base font-semibold">What is AscendAI?</div>
          </motion.div>
        </motion.div>
        <motion.div
          animate={{ rotateY: flipped ? 0 : -180 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white flex items-center justify-center rounded-lg shadow-lg border border-orange-200 dark:border-orange-900 backface-hidden rotate-y-180"
        >
          <motion.div
            animate={{ opacity: flipped ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-center px-4"
          >
            <div className="text-[10px] sm:text-xs text-orange-600 dark:text-orange-400 font-semibold mb-1 uppercase tracking-wide">Answer</div>
            <div className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
              AI platform for career improvement & growth
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export const ResumeParserSkeleton = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-[140px] sm:h-[160px]">
      <div className="relative w-full h-full bg-gradient-to-br from-orange-50 to-white dark:from-neutral-900 dark:to-neutral-950 rounded-lg overflow-hidden border border-orange-200 dark:border-orange-900/30 p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-orange-300 border-t-orange-600 rounded-full"
            />
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Parsing Document</span>
          </div>
          <span className="text-xs font-bold text-orange-600">{progress}%</span>
        </div>

        <div className="space-y-2">
          {[75, 90, 65, 85].map((width, i) => {
            const isParsed = progress > i * 25;
            return (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden" style={{ width: `${width}%` }}>
                  <motion.div
                    animate={{ width: isParsed ? "100%" : "0%" }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-500"
                  />
                </div>
                <AnimatePresence>
                  {isParsed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center"
                    >
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-0 left-0 w-full h-1 bg-neutral-200 dark:bg-neutral-800">
          <motion.div
            style={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
          />
        </div>
      </div>
    </div>
  );
};

export const ResumeMakerSkeleton = () => {
  const items = [
    { icon: "👤", label: "Info", progress: 100 },
    { icon: "🎓", label: "Education", progress: 85 },
    { icon: "⚡", label: "Skills", progress: 70 },
    { icon: "💼", label: "Experience", progress: 40 }
  ];
  
  return (
    <div className="w-full h-[140px] sm:h-[160px]">
      <div className="h-full bg-white dark:bg-neutral-950 rounded-lg border border-orange-200 dark:border-orange-900/30 p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Building Resume</span>
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex gap-1"
          >
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1 h-1 bg-orange-500 rounded-full" />
            ))}
          </motion.div>
        </div>
        
        <div className="space-y-2.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm">{item.icon}</span>
              <div className="flex-1">
                <div className="h-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.progress}%` }}
                    transition={{ duration: 1, delay: i * 0.15, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-500"
                  />
                </div>
              </div>
              <span className="text-[10px] text-neutral-500 w-8 text-right">{item.progress}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ColdEmailSkeleton = () => {
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSent(true);
      setTimeout(() => setSent(false), 1000);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-[140px] sm:h-[160px]">
      <div className="relative h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-white dark:from-neutral-900 dark:to-neutral-950 rounded-lg border border-orange-200 dark:border-orange-900/30 overflow-hidden">
        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div
              key="email"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, y: [0, -5, 0] }}
              exit={{ scale: 0, opacity: 0, x: 100, y: -50 }}
              transition={{ y: { duration: 2, repeat: Infinity }, exit: { duration: 0.4 } }}
              className="relative"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/40">
                <span className="text-3xl">✉️</span>
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"
              />
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">Sent!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const CoverLetterSkeleton = () => {
  const text = "Dear Hiring Manager, I am excited to apply for this position. My experience aligns perfectly with your requirements...";
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        setTimeout(() => {
          setDisplayText("");
          index = 0;
        }, 1000);
      }
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-[140px] sm:h-[160px]">
      <div className="h-full bg-white dark:bg-neutral-950 rounded-lg border border-orange-200 dark:border-orange-900/30 p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            AI
          </div>
          <div className="flex-1">
            <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Writing Letter</div>
          </div>
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex gap-1"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                className="w-1 h-1 bg-orange-500 rounded-full"
              />
            ))}
          </motion.div>
        </div>
        
        <div className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
          {displayText}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-0.5 h-3 bg-orange-500 ml-0.5 align-middle"
          />
        </div>
      </div>
    </div>
  );
};

export const RoadmapSkeleton = () => {
  const steps = [
    { label: "Learn", done: true },
    { label: "Build", active: true },
    { label: "Portfolio", done: false },
    { label: "Career", done: false }
  ];

  return (
    <div className="w-full h-[140px] sm:h-[160px]">
      <div className="relative h-full bg-white dark:bg-neutral-950 rounded-lg border border-orange-200 dark:border-orange-900/30 p-3 sm:p-4 flex items-center">
        <div className="w-full space-y-2">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex items-center gap-3"
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                step.done ? "bg-orange-500 border-orange-500" :
                step.active ? "border-orange-500 bg-white dark:bg-neutral-950" :
                "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950"
              }`}>
                {step.done && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {step.active && (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 bg-orange-500 rounded-full"
                  />
                )}
              </div>
              <span className={`text-xs font-medium ${
                step.done || step.active ? "text-neutral-800 dark:text-neutral-200" : "text-neutral-400 dark:text-neutral-600"
              }`}>
                {step.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const KeywordCheckerSkeleton = () => {
  const keywords = [
    { word: "React", match: true },
    { word: "Node.js", match: true },
    { word: "Python", match: false },
    { word: "AWS", match: true },
    { word: "Docker", match: false }
  ];

  return (
    <div className="w-full h-[140px] sm:h-[160px]">
      <div className="h-full bg-white dark:bg-neutral-950 rounded-lg border border-orange-200 dark:border-orange-900/30 p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Keywords</span>
          <motion.span
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="text-lg"
          >
            🔍
          </motion.span>
        </div>
        
        <div className="flex flex-wrap gap-1.5 mb-3">
          {keywords.map((kw, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                kw.match
                  ? "border-orange-500 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30"
                  : "border-neutral-200 dark:border-neutral-800 text-neutral-400"
              }`}
            >
              {kw.word} {kw.match && "✓"}
            </motion.span>
          ))}
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-neutral-600 dark:text-neutral-400">Match Rate</span>
            <span className="text-orange-600 font-bold">60%</span>
          </div>
          <div className="h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "60%" }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};