# 🎓 Autonomous Study Planner

> An intelligent, multi-agent AI-driven study planning & knowledge mastery platform built with **React**, **Node.js/Express**, **MongoDB**, **Google Gemini AI**, and **Server-Sent Events (SSE)**.

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/Amarjeetydv/autonomous_study_planner)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%20%7C%20Tailwind-61DAFB?logo=react)](https://react.dev)
[![NodeJS](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=nodedotjs)](https://nodejs.org)
[![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini%202.0-8E75B2?logo=google)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 Overview

**Autonomous Study Planner** is a next-generation adaptive study management system that acts as a personal AI tutor and academic strategist. Traditional study planners require manual input and fail when schedules change. Our platform solves this using a **Multi-Agent AI System** that creates personalized study roadmaps, dynamically reschedules study blocks when sessions are missed, tracks topic-level mastery, generates diagnostic quizzes, and keeps students motivated with gamified milestones.

---

## 🏗 System Architecture & Multi-Agent AI Pipeline

The core engine relies on **9 Specialized AI Agents** orchestrating together via **Server-Sent Events (SSE)** to deliver real-time progress updates to the user as their customized plan is generated.

```mermaid
flowchart TD
    User([Student Goal Input]) --> Intake[Goal Intake Wizard]
    Intake --> SSE[SSE Real-Time Stream Manager]

    subgraph Multi-Agent AI Engine (Google Gemini)
        SSE --> GA[Goal Analyzer Agent]
        GA --> SP[Subject Prioritizer Agent]
        SP --> SPP[Study Planner Agent]
        SPP --> SA[Scheduler Agent]
        SA --> QP[Quiz Planner Agent]
        QP --> RP[Revision Planner Agent]
        RP --> MP[Mock Test Planner Agent]
        MP --> PA[Progress Analyzer Agent]
        PA --> MA[Motivation Agent]
    end

    Multi-Agent AI Engine --> DB[(MongoDB Storage)]
    Multi-Agent AI Engine --> UI[Live Interactive Dashboard & Calendar]
```

---

## ✨ Features & What Is Completed

### 🤖 1. Multi-Agent AI Planning Engine (Completed)
- **Goal Analyzer Agent**: Extracts target exams, target scores, and timeframe constraints.
- **Subject Prioritizer Agent**: Analyzes topic weightage, weak areas, and confidence ratings.
- **Study Planner Agent**: Generates structured multi-week topic roadmaps.
- **Scheduler Agent**: Maps study topics into daily time slots matching the student's energy peak hours.
- **Quiz Planner Agent**: Constructs diagnostic and review practice quizzes per subject.
- **Revision Planner Agent**: Incorporates spaced-repetition revision cycles.
- **Mock Test Planner Agent**: Schedules full-length simulated mock tests prior to exam dates.
- **Progress Analyzer Agent**: Monitors check-ins and recalculates plans adaptively.
- **Motivation Agent**: Delivers personalized encouragement strategies based on student performance.

### 📡 2. Real-Time Streaming & Interactive UI (Completed)
- **SSE Live Terminal Execution Monitor (`PlanningLoader`)**: Visual step-by-step terminal log output showing each AI agent executing in real time.
- **Student Dashboard (`Dashboard.tsx`)**: High-level overview of upcoming study sessions, active streaks, level XP progress, and quick check-ins.
- **Goal Intake Wizard (`GoalIntake.tsx`)**: Interactive multi-step form to collect study targets, available daily hours, and subject difficulties.
- **Study Plan Viewer (`StudyPlanViewer.tsx`)**: Full weekly study schedule with task checkboxes, priority indicators, and module breakdowns.
- **Visual Calendar Dashboard (`CalendarDashboard.tsx`)**: Time-blocked interactive calendar view with session details and quick reschedule options.
- **Knowledge Mastery (`KnowledgeMastery.tsx`)**: Visual breakdown of subject & topic mastery percentages, confidence bars, and weak spot highlights.
- **Interactive Quiz Engine (`QuizPlayer.tsx` & `QuizResult.tsx`)**: In-app practice quizzes with timers, instant scoring, and detailed AI explanations.
- **AI Study Companion (`AICompanion.tsx`)**: Real-time AI chat mentor for instant academic doubt resolution, study tips, and topic summaries.
- **Gamification & Trophy Case (`TrophyCase.tsx`)**: Leveling system with XP rewards, streak bonuses, achievement badges, and level progress bars.
- **Adaptive Rescheduling (`ReschedulePreview.tsx`)**: Recalculates and adjusts future study blocks seamlessly when life happens and study blocks are missed.

### 🔐 3. Authentication & Backend Infrastructure (Completed)
- **JWT & Cookie Authentication**: Secure sign-up/login, password hashing with `bcryptjs`, and role-based route protection.
- **User Profile Management**: Captures learning styles, peak study hours, daily availability, and target target scores.
- **Production Express Backend**: Modular domain-driven architecture (`src/modules/*`), Winston logger, rate-limiting, and standard error handling (`AppError`).
- **MongoDB Schema Design**: Models for Users, Goals, Study Plans, Tasks, Quizzes, Mastery Tracks, Achievements, and Notifications.

---

## 🛠 Tech Stack

### **Frontend**
- **Framework**: React 19 (TypeScript) + Vite
- **State Management**: Redux Toolkit & TanStack React Query
- **Styling**: Tailwind CSS with custom glassmorphism design system
- **Icons & Charts**: Lucide React & Chart.js (`react-chartjs-2`)
- **Routing**: React Router DOM v6

### **Backend**
- **Runtime**: Node.js (ES Modules)
- **Web Framework**: Express.js
- **Database**: MongoDB with Mongoose ORM
- **Real-Time Engine**: Server-Sent Events (SSE)
- **Security & Utilities**: Helmet, CORS, Rate Limit, Cloudinary, Nodemailer, Winston

### **AI Layer**
- **SDK**: `@google/genai` (Google Gemini 1.5/2.0 API)
- **Pattern**: Multi-agent orchestration with JSON validation & fallback parsing

---

## 📁 Project Structure

```text
autonomous-study-planner/
├── client/                      # React Frontend App
│   ├── src/
│   │   ├── components/          # Reusable UI components & layouts
│   │   ├── features/            # Feature-based Redux slices & API queries
│   │   ├── pages/               # Page views (Dashboard, GoalIntake, Quiz, etc.)
│   │   │   └── student/         # Student dashboard & AI views
│   │   ├── services/            # API integration & SSE client
│   │   ├── styles/              # Global CSS & Tailwind utilities
│   │   └── types/               # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
│
├── server/                      # Express Backend App
│   ├── src/
│   │   ├── modules/
│   │   │   ├── aiPlanning/      # 🤖 Multi-Agent AI system & SSE routes
│   │   │   ├── auth/            # Authentication & JWT security
│   │   │   ├── calendar/        # Study schedule & event management
│   │   │   ├── chat/            # AI Study Mentor chat logic
│   │   │   ├── checkins/        # Daily check-in tracking
│   │   │   ├── gamification/    # XP, levels, and achievements
│   │   │   ├── goals/           # User study goal management
│   │   │   ├── mastery/         # Topic mastery tracking
│   │   │   ├── quizzes/         # AI Quiz generation & scoring
│   │   │   ├── tasks/           # Study block tasks
│   │   │   └── users/           # User profiles & preferences
│   │   ├── routes/              # Central v1 API routes
│   │   ├── services/            # Cron jobs, emails, file upload
│   │   └── server.js            # Express application entry point
│   └── package.json
│
├── shared/                      # Shared Types & Constants
├── package.json                 # Monorepo Root Config (npm workspaces)
└── .gitignore                   # Root Gitignore
```

---

## 📌 What Needs to Be Completed (Roadmap)

While the core multi-agent engine, dashboard, quizzes, AI companion, and gamification are fully functional, the following items are planned for upcoming releases:

- [ ] **🗓️ External Calendar Integration**: 2-way sync with Google Calendar, Apple iCal, and Outlook.
- [ ] **📈 Advanced Predictive Score Analytics**: Machine learning models predicting exam score based on current topic mastery velocity.
- [ ] **🎙️ Audio & Voice Mode for AI Companion**: Real-time voice interaction with the AI study mentor.
- [ ] **👥 Peer Study Groups & Community Leaderboards**: Social study challenges, group study rooms, and friend leaderboards.
- [ ] **📱 Mobile PWA & Push Notifications**: Offline-first support and native mobile push alerts for upcoming study blocks.
- [ ] **🧪 Comprehensive Automated E2E Test Suite**: Integration tests for AI agent responses, SSE streams, and critical user flows.

---

## ⚡ Getting Started

### **Prerequisites**
- **Node.js**: `v20.x` or higher
- **npm**: `v9.x` or higher
- **MongoDB**: Local instance or MongoDB Atlas Connection URI
- **Google Gemini API Key**: Obtain from [Google AI Studio](https://aistudio.google.com/)

### **Installation**

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Amarjeetydv/autonomous_study_planner.git
   cd autonomous_study_planner
   ```

2. **Install Workspace Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**

   Create `.env` in `server/`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/autonomous_study_planner
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_google_gemini_api_key
   CLIENT_URL=http://localhost:5173
   ```

   Create `.env` in `client/`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api/v1
   ```

4. **Run Development Servers**
   ```bash
   # Terminal 1: Run Backend Server
   npm run dev:server

   # Terminal 2: Run Frontend Client
   npm run dev:client
   ```

   Open your browser and navigate to `http://localhost:5173`.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Amarjeetydv/autonomous_study_planner/issues).

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
