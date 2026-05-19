# AscendAI — Your AI Career Coach

**AscendAI** is a premium, AI-powered career development platform designed to help job seekers stand out and land their dream roles. Moving beyond generic templates, AscendAI provides personalized, actionable guidance through every stage of the job search.

---

## 🚀 Key Features

### 📄 Intelligent Resume Builder
Create ATS-optimized resumes that highlight your strengths. Use AI-driven suggestions to tailor your experience for specific roles and industries.

### 🎭 Mock Interviews
Practice with role-specific AI questions and get instant, constructive feedback. Build confidence and sharpen your communication skills before the real thing.

### 🔍 Resume Scanner & ATS Checker
Scan your resume against any job description. Get an alignment score and specific tips on which keywords and skills you need to add to pass the ATS filter.

### 🗺️ Career Roadmap
Visualize your career journey. Get a step-by-step roadmap tailored to your dream role, pinpointing the skills you need to develop and the milestones to reach.

### ✉️ Personalized Outreach
Generate high-converting cover letters and cold emails that actually get replies. Our AI understands the nuances of professional engagement.

---

## 🎨 Design Philosophy: The "Career Buddy"

AscendAI is built with a **human-first** approach. We've moved away from robotic "protocols" and jargon to create a warm, supportive, and intuitive experience.

- **Warm Aesthetics**: A curated color palette that balances professional confidence with approachability.
- **Dynamic Themes**: Full support for **Light Mode** (warm cream/sand) and **Dark Mode** (sleek obsidian), ensuring comfort during late-night application sessions.
- **Micro-Animations**: Subtle transitions and feedback loops that make the interface feel alive and responsive.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15+ (App Router), React, Tailwind CSS 4.0
- **Authentication**: Clerk
- **AI Engine**: Advanced LLM integration for resume analysis and interview generation
- **State & Logic**: Server Actions, Zod, React Hook Form
- **Styling**: Framer Motion, Lucide Icons, Shadcn UI (customized)

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+
- A Clerk account for authentication
- Database (PostgreSQL/Prisma)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ShivVk18/ai-career-buddy.git
   cd ai-career-buddy
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env.local` file and add your keys:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
   CLERK_SECRET_KEY=...
   DATABASE_URL=...
   # Add AI service keys here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open the app**:
   Navigate to [http://localhost:3000](http://localhost:3000) to see the result.

### 🧪 Testing
Run the test suite to ensure everything is functioning correctly:
```bash
npm run test
```
For more details, see [TESTING.md](TESTING.md).

---

## 🐳 Containerization (Docker)

AscendAI is fully containerized using a highly-optimized multi-stage Docker build. This reduces the final production image size significantly (leveraging Next.js standalone tracing) and guarantees a consistent runtime environment.

### Prerequisites
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Running with Docker Compose

The simplest way to run the entire application locally is using Docker Compose, which automatically builds the image and loads your `.env` variables:

1. **Ensure your `.env` file is set up** in the root directory.
2. **Build and start the container**:
   ```bash
   docker compose up --build -d
   ```
3. **Access the application**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.
4. **Stop the container**:
   ```bash
   docker compose down
   ```

### Running with Docker CLI Directly

If you prefer building and running the container manually:

1. **Build the image**:
   ```bash
   docker build -t ascendai-career-buddy .
   ```
2. **Run the container**:
   ```bash
   docker run -d -p 3000:3000 --env-file .env --name ascendai-career-buddy ascendai-career-buddy
   ```

---

© 2026 AscendAI. Built for job seekers, by job seekers.
