# Changelog

All notable changes to the **StudyPilot AI (Autonomous Study Planner)** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
