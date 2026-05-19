# Pre-Deployment Checklist: AscendAI

This checklist ensures that all visual, functional, and tonal elements are verified before full production deployment.

---

## 🌓 1. Visual & Theme Consistency
Verify that the application transitions seamlessly between Light and Dark modes.

- [ ] **Manual Toggle**: Use the Sun/Moon icon in the Sidebar and Landing Page. Verify colors update instantly.
- [ ] **Hydration**: Refresh pages in both themes. Ensure there is no "flicker" or color mismatch on load.
- [ ] **Contrast Check**: 
  - [ ] Muted text is readable on light cream background.
  - [ ] White/Dark text on the **Accent (Orange)** background is high-contrast.
  - [ ] Destructive buttons (Red) are readable in both modes.
- [ ] **Overlays**: Check the noise texture and grid lines. They should be subtle, not distracting.

---

## 🗣️ 2. Tone of Voice (Career Buddy)
Ensure the "robotic protocol" jargon is gone. All labels should be friendly and human.

- [ ] **Landing Page**: No mention of "SD—PROTOCOL" or "Initialize Base". Should say "AscendAI" and "Get Started".
- [ ] **Onboarding**: Form should say "Profile Setup", not "Initialization".
- [ ] **Mock Interview**: Buttons should say "Next Question" or "Explain", not "STATION" or "DEBRIEF".
- [ ] **Resume Scanner**: Should say "Scan Results", not "Final Synthesis".

---

## 🛠️ 3. Core Functional Flows
Test the "Happy Path" for all major features.

- [ ] **Authentication**:
  - [ ] Sign in works (redirects to Dashboard).
  - [ ] Sign out works (redirects to Landing Page).
  - [ ] Landing page adapts (shows "Dashboard" button when logged in).
- [ ] **Resume Builder**:
  - [ ] Can create/edit a resume.
  - [ ] PDF preview renders correctly.
- [ ] **Interview Hub**:
  - [ ] Can start a new mock interview.
  - [ ] Can answer questions and get "Explain" feedback.
  - [ ] Results save to history correctly.
- [ ] **Resume Scanner**:
  - [ ] Drag-and-drop a PDF resume.
  - [ ] Paste a job description.
  - [ ] View ATS score and skill gaps.

---

## 📱 4. Responsiveness
- [ ] **Mobile**: Sidebar collapses into a hamburger menu or small icon list.
- [ ] **Tablet**: Bento grid (Feature section) stacks correctly.
- [ ] **Forms**: Onboarding and Resume forms don't overflow on small screens.

---

## 🔍 5. Technical Hygiene
- [ ] **Browser Console**: No red errors or React hydration warnings.
- [ ] **Network**: API calls for AI analysis complete successfully.
- [ ] **Empty States**: Verify behavior when no resumes or interviews exist (should show "Start Now" banners).

---

> [!NOTE]
> This document is for manual testing. For automated tests, refer to the `__tests__` directory (if applicable).
