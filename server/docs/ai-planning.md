# AI Planning Module

The AI planning module orchestrates a multi-agent pipeline that produces a structured study plan from a goal.

## Flow

Goal -> Goal Analyzer -> Study Planner -> Scheduler -> Quiz Planner -> Progress Analyzer -> Motivation Agent -> Database

## Endpoints

- `POST /api/v1/ai/planning/generate`
- `GET /api/v1/ai/planning`
- `GET /api/v1/ai/planning/:planId`
- `DELETE /api/v1/ai/planning/:planId`

## Stored Output

- Goal analysis
- Study plan
- Scheduler output
- Quiz plan
- Motivation output
- Progress analysis
- AI metadata
- Prompt versions
- Generated date
