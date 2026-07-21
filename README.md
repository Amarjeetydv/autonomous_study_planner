# 🎓 StudyPilot AI (Autonomous Study Planner)

> An intelligent, multi-agent AI-driven study planning & knowledge mastery platform built with **React 19**, **Node.js/Express**, **MongoDB**, **Google Gemini AI**, and **Server-Sent Events (SSE)**.

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/Amarjeetydv/autonomous_study_planner)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%20%7C%20Tailwind-61DAFB?logo=react)](https://react.dev)
[![NodeJS](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=nodedotjs)](https://nodejs.org)
[![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini%202.0-8E75B2?logo=google)](https://ai.google.dev)
[![Version](https://img.shields.io/badge/Release-v1.0.0-emerald.svg)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 Overview

**StudyPilot AI** is a next-generation adaptive study management system that acts as a personal AI tutor, academic strategist, and mentorship workspace. Traditional study planners require manual input and fail when schedules change. Our platform solves this using a **Multi-Agent AI System** that creates personalized study roadmaps, dynamically reschedules study blocks when sessions are missed, tracks topic-level mastery, generates diagnostic quizzes, provides mentor-student messaging, and keeps students motivated with gamified milestones.

---

## 🏗 System Architecture & Multi-Agent AI Pipeline

The core engine relies on **Specialized AI Agents** orchestrating together via **Server-Sent Events (SSE)** to deliver real-time progress updates to the user as their customized plan is generated.

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
    UI --> Mentor[Mentorship Workspace & Chat Portal]
```

---

## ✨ Key Features (Version 1.0.0)

### 🤖 1. Multi-Agent AI Planning Engine
- **Goal Analyzer Agent**: Extracts target exams, target scores, and timeframe constraints.
- **Subject Prioritizer Agent**: Analyzes topic weightage, weak areas, and confidence ratings.
- **Study Planner Agent**: Generates structured multi-week topic roadmaps.
- **Scheduler Agent**: Maps study topics into daily time slots matching student energy peak hours.
- **Quiz Planner Agent**: Constructs diagnostic and review practice quizzes per subject.
- **Revision Planner Agent**: Incorporates spaced-repetition revision cycles.
- **Mock Test Planner Agent**: Schedules full-length simulated mock tests prior to exam dates.
- **Motivation Agent**: Delivers personalized encouragement strategies based on student performance.

### 📊 2. AI Daily Planner & Independent Workspaces
- **Notion/Linear-Style Independent Workspaces**: Every generated study plan operates as an independent workspace pointer (`isCurrent: true/false`). Students can maintain multiple concurrent study plans (e.g. UPSC, DBMS, OS, React) without forced plan archiving.
- **1-Click Workspace Switching**: Switch active workspace pointers instantly with real-time React Query cache invalidation across Today's Tasks, Tomorrow Preview, Upcoming Week, Mock Exams, and Calendar.
- **Auto Task & Calendar Synchronizer**: Synchronously inserts `DailyTask` documents (Day 0 / Today through target date) and `CalendarEvent` documents into MongoDB. Features a self-healing auto-regeneration engine if task documents are missing.
- **Motion/Sunsama-Style Daily Planner**: Hero greeting card, today's focus checklist, next available study session card, tomorrow preview, collapsible week accordion, and spaced repetition stats.
- **Goal Intake Wizard**: Natural language domain & topic inference, target score settings, and native study/break days selection.
- **Interactive Calendar Suite**: Visual study blocks, drag-and-drop reschedule previews, color-coded event status, and calendar synchronization.
- **Knowledge Mastery**: Subject mastery heatmaps, XP gamification, study streak counters, and performance analytics.

### 🎓 3. Mentorship System & Direct Messaging
- **SaaS Mentorship Workflow**: Email invitation workflow, secure link generation, and system mentor selection.
- **Mentor Dashboard**: Cohort roster management, student performance cards, and structured feedback publishing.
- **Persistent Chat Portal**: Direct mentor-student direct messaging thread with real-time polling, conversation lists, message histories, and unread badges.

### 🔐 4. Authentication & Backend Infrastructure
- **JWT & Role-Based Access Control (RBAC)**: Secure access rules for `Student`, `Mentor`, and `Admin` roles.
- **Express Backend**: Domain-driven architecture (`src/modules/*`), Winston logger, rate-limiting, and robust error management.
- **MongoDB Data Layer**: Schema design for Users, Goals, Study Plans, Tasks, Quizzes, Mastery Tracks, Conversations, Messages, and Achievements.

---

## 🛠 Tech Stack

### **Frontend**
- **Framework**: React 19 (TypeScript) + Vite
- **State Management**: Redux Toolkit & TanStack React Query
- **Styling**: Vanilla CSS + Tailwind CSS custom glassmorphism design system
- **Icons & Charts**: Lucide React & Chart.js (`react-chartjs-2`)
- **Routing**: React Router DOM v6

### **Backend**
- **Runtime**: Node.js
- **Web Framework**: Express.js
- **Database**: MongoDB with Mongoose ORM
- **Real-Time Engine**: Server-Sent Events (SSE) & Real-Time REST Polling
- **Security & Utilities**: Helmet, CORS, Rate Limit, Cloudinary, Nodemailer, Winston

### **AI Layer**
- **SDK**: `@google/genai` (Google Gemini 1.5/2.0 API)
- **Pattern**: Multi-agent orchestration with JSON validation & fallback parsing

---

## 📸 Screenshots

*(Add screenshots of Student Dashboard, Goal Intake, Planning Loader, and Mentor Chat here)*

| Student AI Daily Planner | Mentor Workspace Chat |
|---|---|
| *(Dashboard Screenshot)* | *(Chat Portal Screenshot)* |

---

## 🔑 Demo Credentials (Local Testing)

| Role | Email | Password |
|---|---|---|
| **Student** | `student@example.com` | `password123` |
| **Mentor** | `mentor@example.com` | `password123` |
| **Admin** | `admin@example.com` | `password123` |

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

2. **Install Dependencies**
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
   # Run Backend Server (from server directory)
   npm run dev

   # Run Frontend Client (from client directory)
   npm run dev
   ```

   Navigate to `http://localhost:5173` in your browser.

---

## 📌 Future Roadmap

- [ ] **🗓️ External Calendar Integration**: 2-way sync with Google Calendar, Apple iCal, and Outlook.
- [ ] **📈 Advanced Predictive Score Analytics**: Predictive models forecasting exam scores based on topic mastery velocity.
- [ ] **🎙️ Audio & Voice Mode for AI Companion**: Real-time voice interaction with the AI study mentor.
- [ ] **👥 Peer Study Groups & Community Leaderboards**: Social study challenges, group study rooms, and friend leaderboards.
- [ ] **📱 Mobile PWA & Push Notifications**: Offline-first support and native mobile push alerts for upcoming study blocks.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
