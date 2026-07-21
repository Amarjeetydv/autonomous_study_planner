# Changelog

All notable changes to the **StudyPilot AI (Autonomous Study Planner)** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2026-07-21

### Added
- **Independent Study Workspaces**: Treated every generated study plan as a separate workspace pointer (`isCurrent = true/false`), allowing students to maintain multiple active study plans simultaneously without forced archiving.
- **1-Click Workspace Switching**: Added `POST /api/v1/planner/:planId/activate` endpoint and updated Dashboard "Your Study Plans" list cards to switch active workspaces instantly with complete React Query cache invalidation.
- **Auto Task & Calendar Event Pipeline**: Unified AI plan generation to synchronously insert `DailyTask` documents (from Day 0 / today through `targetDate`) and corresponding `CalendarEvent` documents into MongoDB before client navigation.
- **Self-Healing Task Auto-Regeneration**: Added automatic database check in `tasks.service.js` to regenerate missing study blocks on the fly if an active workspace plan ever has 0 tasks.
- **Next Available Study Session Card**: Dashboard automatically displays the next available study session card when today's tasks are empty but future study blocks exist.
- **Automatic Legacy Index Migration**: Added startup index cleanup in `connectDB()` to automatically drop legacy unique indexes on `Goals` collection (`studentId_1_goalType_1_status_1`), allowing students to create multiple goals in the same exam category without `E11000` duplicate key errors.

### Fixed
- Fixed plan duration display on Hero Card and Plan Viewer to compute dynamically from `targetDate - currentDate` instead of static AI default strings.
- Fixed task listing queries to filter strictly by the currently active workspace ID (`isCurrent: true`).

---

## [1.0.0] - 2026-07-21

### Added
- **AI Study Planner Engine**: 6-stage generative AI pipeline powered by Google Gemini AI (`@google/genai`) for automated subject breakdown, workload balancing, revision scheduling, and mock test planning.
- **Goal Intake & Customization**: Natural language goal parsing, domain and topic inferencing, target score setting, and interactive study/break day selections.
- **AI Daily Planner Workspace**: Motion/Sunsama-style student dashboard featuring today's focus checklist, progress trackers, tomorrow previews, collapsible weekly accordions, and space repetition stats.
- **Interactive Calendar Suite**: Visual study blocks, drag-and-drop reschedule previews, color-coded event status, and calendar synchronization.
- **Mentorship System & Roster**: Invitation workflow supporting email invites, secure link generation, system mentor selection, and mentor-student relationship synchronization.
- **Mentor Direct Messaging**: Persistent chat module featuring real-time polling, conversation lists, message histories, and unread badges.
- **Adaptive Scheduling Engine**: Algorithmic workload recalculation with 1-click workload adjustment acceptance on skipped tasks.
- **Knowledge Mastery & Analytics**: Subject mastery heatmaps, XP gamification, study streak counters, and performance analytics.
- **JWT Authentication & RBAC**: Secure authentication suite with Student, Mentor, and Admin role-based access control.

### Known Issues
- **AI Workload Adjustment**: Fine-tuning recommended for complex multi-task shift parameters.
- **Mock Test Engine**: Question bank generation suite pending extended multi-choice category expansion.
