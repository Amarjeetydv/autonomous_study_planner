# Goal Intake API

This module collects structured goal data for future AI planning.

## Base Path

`/api/v1/goals`

## Roles

- Student: create, edit, delete, archive, pause, resume, view, list, duplicate, complete
- Mentor: view and list goals
- Admin: full access

## Business Rules

- One active goal per category per student.
- Archived goals are read-only.
- Completed goals are immutable.
- Paused goals have reminders disabled.
- Goal target dates must be in the future.
- Selected subjects must exist and are validated.
- Duplicate goal creates a paused copy to avoid breaking the active-goal uniqueness rule.

## Common Response Format

```json
{
  "success": true,
  "message": "",
  "data": {},
  "errors": []
}
```

## Example Goal Document

```json
{
  "title": "UPSC 2027",
  "goalType": "UPSC",
  "targetDate": "2027-06-15T00:00:00.000Z",
  "currentLevel": "Beginner",
  "dailyStudyHours": 4,
  "weeklyStudyDays": 6,
  "preferredStudyTime": "Morning",
  "preferredSessionLengthMinutes": 90,
  "strongSubjects": [],
  "weakSubjects": [],
  "selectedSubjects": ["66a1b2c3d4e5f67890123456"],
  "prioritySubjects": ["66a1b2c3d4e5f67890123456"],
  "difficultyPreference": "Mixed",
  "learningStyle": "Reading",
  "targetScore": 100,
  "motivation": "Crack UPSC in first attempt",
  "breakDays": ["Sunday"],
  "vacationDays": [],
  "timezone": "Asia/Kolkata",
  "language": "en",
  "reminderPreference": {
    "isEnabled": true,
    "mode": "In-App",
    "reminderTime": "08:00",
    "frequency": "Daily"
  },
  "calendarPreference": {
    "isEnabled": true,
    "includeWeekends": false,
    "includeBreakDays": true,
    "color": "#4f46e5"
  }
}
```

## Endpoints

### Goals

- `GET /`
- `POST /`
- `GET /:goalId`
- `PATCH /:goalId`
- `DELETE /:goalId`

### Goal Actions

- `POST /:goalId/pause`
- `POST /:goalId/resume`
- `POST /:goalId/archive`
- `POST /:goalId/complete`
- `POST /:goalId/duplicate`

## Response Examples

### Create Goal

```json
{
  "success": true,
  "message": "Goal created successfully",
  "data": {
    "goal": {
      "_id": "66a1b2c3d4e5f67890123456",
      "goalType": "UPSC",
      "status": "active"
    }
  },
  "errors": []
}
```

### Pause Goal

```json
{
  "success": true,
  "message": "Goal paused successfully",
  "data": {
    "goal": {
      "status": "paused",
      "reminderPreference": {
        "isEnabled": false
      }
    }
  },
  "errors": []
}
```

### Goal List

```json
{
  "success": true,
  "message": "Goals fetched successfully",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 0,
      "totalPages": 0
    }
  },
  "errors": []
}
```
