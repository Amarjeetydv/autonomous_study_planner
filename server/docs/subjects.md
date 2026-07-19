# Subjects API

This module manages study subjects, topics, subtopics, bookmarks, topic completion, learning progress, and mentor recommendations.

## Base Path

`/api/v1/subjects`

## Roles

- Student: browse, bookmark, complete topics, view progress
- Mentor: browse, recommend subjects, recommend topics
- Admin: full CRUD for subjects, topics, and subtopics

## Core Collections

- `Subjects`
- `Topics`
- `Subtopics`
- `TopicProgress`
- `Recommendations`

## Common Response Format

```json
{
  "success": true,
  "message": "",
  "data": {},
  "errors": []
}
```

## Response Examples

### Subject List

```json
{
  "success": true,
  "message": "Subjects fetched successfully",
  "data": {
    "items": [
      {
        "_id": "66a1b2c3d4e5f67890123456",
        "name": "Mathematics",
        "code": "MATH101",
        "category": "Science",
        "difficulty": "intermediate",
        "color": "#4f46e5",
        "icon": "calculator",
        "estimatedHours": 120
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 1,
      "totalPages": 1
    }
  },
  "errors": []
}
```

### Topic Bookmark

```json
{
  "success": true,
  "message": "Topic bookmarked successfully",
  "data": {
    "progress": {
      "userId": "66a1b2c3d4e5f67890123456",
      "topicId": "66a1b2c3d4e5f67890123457",
      "bookmarked": true
    }
  },
  "errors": []
}
```

### Learning Progress

```json
{
  "success": true,
  "message": "Learning progress fetched successfully",
  "data": {
    "items": [],
    "summary": {
      "totalTopics": 12,
      "bookmarkedCount": 3,
      "completedCount": 5,
      "completionRate": 42
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 8,
      "totalPages": 1
    }
  },
  "errors": []
}
```

## API Summary

### Subjects

- `GET /`
- `POST /`
- `GET /:subjectId`
- `PATCH /:subjectId`
- `DELETE /:subjectId`

### Topics

- `GET /:subjectId/topics`
- `POST /:subjectId/topics`
- `GET /topics/:topicId`
- `PATCH /topics/:topicId`
- `DELETE /topics/:topicId`

### Subtopics

- `GET /topics/:topicId/subtopics`
- `POST /topics/:topicId/subtopics`
- `PATCH /subtopics/:subtopicId`
- `DELETE /subtopics/:subtopicId`

### Student Actions

- `POST /topics/:topicId/bookmark`
- `DELETE /topics/:topicId/bookmark`
- `POST /topics/:topicId/complete`
- `DELETE /topics/:topicId/complete`
- `GET /me/progress`
- `GET /me/bookmarks`
- `GET /me/completed`

### Mentor Recommendations

- `POST /:subjectId/recommend`
- `POST /topics/:topicId/recommend`

## Search, Sorting, Filtering, Pagination

- Search by keyword across subject/topic/subtopic fields
- Filter by category, difficulty, and active status
- Sort ascending or descending by supported fields
- Pagination uses `page`, `limit`, `totalPages`, and `totalItems`
