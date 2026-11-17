// Mock data for AscendAI
// Context: Indian tech companies (Flipkart, Swiggy, Razorpay, Zomato, CRED, Meesho, Groww)
// Profile: Frontend / Full-Stack Engineer

export interface JobTarget {
  id: string;
  company: string;
  role: string;
  location: string;
  experience: string;
  atsScore: number;
  matchRate: number;
  tags: string[];
  description: string;
  salary: string;
  status: "draft" | "applying" | "interviewing" | "offer";
  nextAction: string;
}

export const MOCK_JOBS: JobTarget[] = [
  {
    id: "job-razorpay",
    company: "Razorpay",
    role: "Frontend Engineer II",
    location: "Bengaluru, KA (Hybrid)",
    experience: "2-4 years",
    atsScore: 88,
    matchRate: 92,
    tags: ["React 19", "Next.js", "Payment SDKs", "TypeScript", "Tailwind"],
    description: "Looking for an engineer to lead merchant checkout web experiences. Must know state machines, web vitals optimization, and modern React architectures.",
    salary: "₹24L - ₹32L",
    status: "interviewing",
    nextAction: "Round 2 technical with staff engineer on Thursday",
  },
  {
    id: "job-swiggy",
    company: "Swiggy",
    role: "Senior UI Engineer",
    location: "Bengaluru, KA",
    experience: "3-5 years",
    atsScore: 84,
    matchRate: 86,
    tags: ["Design Systems", "Micro-frontends", "Performance", "React"],
    description: "Drive consumer app web surfaces, food ordering flow, and cart experience with 99.9% uptime and sub-100ms interaction latency.",
    salary: "₹28L - ₹38L",
    status: "applying",
    nextAction: "Tailor resume bullets for web vitals & checkout",
  },
  {
    id: "job-cred",
    company: "CRED",
    role: "Frontend Developer (Core Product)",
    location: "Bengaluru, KA",
    experience: "2-5 years",
    atsScore: 91,
    matchRate: 94,
    tags: ["Motion Canvas", "Next.js", "WebGL", "TypeScript"],
    description: "Build delightful, pixel-perfect financial products with custom animations, high security headers, and ultra-smooth fluid UI transitions.",
    salary: "₹30L - ₹42L",
    status: "offer",
    nextAction: "Review written offer letter & compensation breakdown",
  },
  {
    id: "job-zomato",
    company: "Zomato",
    role: "Software Development Engineer (Frontend)",
    location: "Gurugram, HR (Onsite)",
    experience: "1-3 years",
    atsScore: 78,
    matchRate: 80,
    tags: ["SSR", "Next.js", "SEO", "Accessibility"],
    description: "Build dining-out discovery pages, restaurant menu viewers, and rapid SSR interfaces with focus on Core Web Vitals and SEO rank.",
    salary: "₹20L - ₹28L",
    status: "applying",
    nextAction: "Send targeted cold email to engineering manager",
  },
  {
    id: "job-flipkart",
    company: "Flipkart",
    role: "UI Engineer (Big Billion Days Team)",
    location: "Bengaluru, KA",
    experience: "2-4 years",
    atsScore: 82,
    matchRate: 85,
    tags: ["High Scale", "Distributed Caching", "React", "State Management"],
    description: "Architect sale-day promotional widgets capable of handling 500k+ RPM with zero layout shift and graceful degradation.",
    salary: "₹26L - ₹35L",
    status: "draft",
    nextAction: "Scan resume against Big Billion Days JD requirements",
  },
  {
    id: "job-groww",
    company: "Groww",
    role: "Frontend Engineer (Investments)",
    location: "Bengaluru, KA",
    experience: "2-4 years",
    atsScore: 86,
    matchRate: 89,
    tags: ["Trading Charts", "WebSockets", "Data Viz", "TypeScript"],
    description: "Real-time stock ticker charts, order book visualization, and instant portfolio insights with canvas rendering and WebSockets.",
    salary: "₹25L - ₹34L",
    status: "interviewing",
    nextAction: "Complete mock coding quiz on canvas & chart renderers",
  },
];

export interface CandidateProfile {
  name: string;
  title: string;
  location: string;
  email: string;
  phone: string;
  github: string;
  linkedin: string;
  summary: string;
  skills: {
    core: string[];
    frameworks: string[];
    tools: string[];
  };
  experience: {
    role: string;
    company: string;
    period: string;
    location: string;
    bullets: {
      original: string;
      improved: string;
      source: string;
      matchTag: string;
      accepted?: boolean;
    }[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
}

export const MOCK_PROFILE: CandidateProfile = {
  name: "Aarav Sharma",
  title: "Frontend Engineer (React / Next.js / TypeScript)",
  location: "Bengaluru, India",
  email: "aarav.sharma.dev@gmail.com",
  phone: "+91 98765 43210",
  github: "github.com/aaravsharma",
  linkedin: "linkedin.com/in/aarav-sharma-dev",
  summary: "Frontend engineer with 3 years of building high-performance web applications in Indian fintech and commerce. Specializes in Next.js app router, web vitals optimization, and scalable design systems.",
  skills: {
    core: ["JavaScript (ES2024)", "TypeScript", "HTML5 & Semantic Markup", "CSS3 & Tailwind", "Web Vitals & Performance"],
    frameworks: ["React 19", "Next.js 15 (App Router)", "Zustand", "React Query / TanStack", "Node.js"],
    tools: ["Webpack / Turbopack", "Git", "Jest / Vitest", "Docker", "Figma", "Datadog / Sentry"],
  },
  experience: [
    {
      role: "Frontend Engineer",
      company: "KredX Technologies",
      period: "2023 - Present",
      location: "Bengaluru, KA",
      bullets: [
        {
          original: "Worked on merchant dashboard and payment settlement pages using React and Redux.",
          improved: "Architected real-time merchant invoice dashboard in Next.js 15, reducing LCP from 3.2s to 1.1s and boosting daily invoice uploads by 28%.",
          source: "merchant dashboard release v2.4 (Q3 2024)",
          matchTag: "Next.js & Performance",
          accepted: true,
        },
        {
          original: "Helped team integrate third-party payment gateways and fixed checkout bugs.",
          improved: "Engineered headless payment checkout SDK with resilient fallback retries, processing ₹14Cr+ in monthly disbursements with a 99.4% success rate.",
          source: "checkout telemetry datadog metrics",
          matchTag: "Payment SDKs",
          accepted: true,
        },
        {
          original: "Participated in agile ceremonies and code reviews with teammates.",
          improved: "Authored 18 shared UI components in Tailwind and Radix UI, adopted by 4 squads and cutting sprint UI development turnaround by 35%.",
          source: "team design-system repository",
          matchTag: "Design Systems",
          accepted: false,
        },
      ],
    },
    {
      role: "Associate Software Engineer",
      company: "UrbanPiper",
      period: "2022 - 2023",
      location: "Bengaluru, KA",
      bullets: [
        {
          original: "Built food aggregator menu management features for restaurant partners.",
          improved: "Implemented optimistic UI updates and WebSocket sync for restaurant live menu editors across 2,400+ active kitchens.",
          source: "restaurant portal analytics",
          matchTag: "WebSockets & Real-time",
          accepted: true,
        },
        {
          original: "Maintained legacy frontend codebase and wrote unit tests.",
          improved: "Refactored legacy REST state layer to TanStack Query with optimistic cache invalidation, cutting unnecessary network roundtrips by 42%.",
          source: "Q1 network payload audit",
          matchTag: "State Management",
          accepted: false,
        },
      ],
    },
  ],
  education: [
    {
      degree: "B.Tech in Computer Science & Engineering",
      institution: "Vellore Institute of Technology (VIT)",
      year: "2018 - 2022",
    },
  ],
};

export interface PipChatStep {
  name: "detective" | "thinking" | "wizard" | "headphones" | "rocket" | "coffee";
  status: string;
}

export const MOCK_CHAT_PROMPTS = [
  "tailor my resume for razorpay frontend II",
  "prep me for swiggy web vitals interview",
  "why is my ats score 78 on zomato?",
  "what should i learn this week for fintech roles?",
];

export const MOCK_INTERVIEW_QUESTIONS = [
  {
    id: "q1",
    question: "In Next.js 15 App Router, what is the exact difference between Server Components and Client Components regarding bundle size and streaming?",
    category: "Architecture",
    timeLimit: 120,
    rubric: {
      clarity: 90,
      technicalDepth: 94,
      practicalEvidence: 88,
    },
    feedbackQuote: "Strong explanation of zero-bundle-size RSCs and partial hydration boundaries with Suspense.",
    improvementNote: "Mention caching behaviors in React cache() vs unstable_cache for database queries.",
  },
  {
    id: "q2",
    question: "Walk through how you would optimize a checkout modal that is suffering from 350ms Input Delay (INP) during payment selection.",
    category: "Web Vitals",
    timeLimit: 180,
    rubric: {
      clarity: 88,
      technicalDepth: 92,
      practicalEvidence: 95,
    },
    feedbackQuote: "Excellent catch on breaking up synchronous third-party SDK initialization with scheduler.yield() or requestIdleCallback.",
    improvementNote: "Don't forget to address CSS paint containment on complex DOM trees.",
  },
  {
    id: "q3",
    question: "How do you handle idempotent API requests on the client when network connectivity is intermittent during a payment submission?",
    category: "Resilience",
    timeLimit: 150,
    rubric: {
      clarity: 85,
      technicalDepth: 88,
      practicalEvidence: 90,
    },
    feedbackQuote: "Clear discussion of client-generated UUID idempotency keys and exponential backoff.",
    improvementNote: "Highlight user feedback states (prevent duplicate button clicks, persistent toast notification).",
  },
];

export const MOCK_WEEKLY_ROADMAP = [
  {
    week: "Week 1",
    title: "Core Web Vitals & INP Deep-Dive",
    gap: "Web Performance Profiling",
    closedFor: ["Razorpay Frontend II", "Swiggy Senior UI"],
    frequency: 5,
    status: "completed",
    tasks: [
      { text: "Profile Chrome Performance trace for 60fps animations", done: true },
      { text: "Implement scheduler.postTask / yield for long tasks", done: true },
      { text: "Measure INP in lab using Lighthouse 12 & Web-vitals.js", done: true },
    ],
  },
  {
    week: "Week 2",
    title: "Headless Component Architecture & Radix UI",
    gap: "Design Systems & Accessibility",
    closedFor: ["CRED Frontend", "Razorpay Frontend II"],
    frequency: 4,
    status: "in-progress",
    tasks: [
      { text: "Build accessible modal and combobox with focus trapping", done: true },
      { text: "Support keyboard navigation & ARIA live regions", done: true },
      { text: "Benchmark bundle size difference vs heavy UI libraries", done: false },
    ],
  },
  {
    week: "Week 3",
    title: "Real-time WebSockets & State Machines",
    gap: "Financial State Resilience",
    closedFor: ["Groww Investments", "Flipkart Big Billion"],
    frequency: 3,
    status: "upcoming",
    tasks: [
      { text: "Build XState payment machine with strict error guards", done: false },
      { text: "Simulate packet drops & socket reconnection backoff", done: false },
      { text: "Cache offline orders in IndexedDB with BackgroundSync", done: false },
    ],
  },
];

export const MOCK_ATS_REQUIREMENTS = [
  { requirement: "React 19 & Next.js App Router (RSC)", matched: true, strength: "High", quoteInResume: "Architected real-time merchant invoice dashboard in Next.js 15" },
  { requirement: "Web Vitals Optimization (LCP, INP, CLS)", matched: true, strength: "High", quoteInResume: "reducing LCP from 3.2s to 1.1s" },
  { requirement: "TypeScript Strict Mode & Generics", matched: true, strength: "Medium", quoteInResume: "TypeScript listed in core competencies" },
  { requirement: "Payment SDK Integration / Fintech", matched: true, strength: "High", quoteInResume: "Engineered headless payment checkout SDK processing ₹14Cr+" },
  { requirement: "Automated E2E Testing with Playwright", matched: false, strength: "Gap", suggestion: "Add a line showing test coverage or synthetic checkout test suites" },
  { requirement: "Micro-frontends & Module Federation", matched: false, strength: "Gap", suggestion: "Mention how modular components were deployed independently across squads" },
];
