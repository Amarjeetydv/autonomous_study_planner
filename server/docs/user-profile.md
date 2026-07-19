# User Profile API

This module handles Student, Mentor, and Admin profile data using a dedicated MongoDB collection.

## Base Path

`/api/v1/users/profile`

## Data Stored

- Full name
- Profile picture
- Phone number
- Date of birth
- Gender
- Education
- College
- University
- Skills
- Interests
- Learning style
- Preferred study time
- Time zone
- Daily study hours
- Bio
- Settings
- Profile visibility

## Endpoint Summary

### Get My Profile

`GET /api/v1/users/profile/me`

### Update My Profile

`PATCH /api/v1/users/profile/me`

### Upload Profile Picture

`PATCH /api/v1/users/profile/me/picture`

### Delete Profile Picture

`DELETE /api/v1/users/profile/me/picture`

### Update Settings

`PATCH /api/v1/users/profile/me/settings`

### Update Visibility

`PATCH /api/v1/users/profile/me/visibility`

### Get Public Profile

`GET /api/v1/users/profile/public/:userId`

### Get Private Profile

`GET /api/v1/users/profile/private/:userId`

## Common Response Format

```json
{
  "success": true,
  "message": "",
  "data": {},
  "errors": []
}
```

## Public Profile Example

```json
{
  "success": true,
  "message": "Public profile fetched successfully",
  "data": {
    "profile": {
      "userId": "66a1b2c3d4e5f67890123456",
      "fullName": "Aman Sharma",
      "profilePicture": {
        "url": "https://...",
        "publicId": "autonomous-study-planner/profile-pictures/..."
      },
      "skills": ["React", "Node.js"],
      "interests": ["AI", "Productivity"],
      "bio": "I am building an autonomous study routine."
    }
  },
  "errors": []
}
```

## Private Profile Example

```json
{
  "success": true,
  "message": "Private profile fetched successfully",
  "data": {
    "profile": {
      "userId": "66a1b2c3d4e5f67890123456",
      "fullName": "Aman Sharma",
      "phoneNumber": "+91XXXXXXXXXX",
      "settings": {
        "emailNotifications": true,
        "pushNotifications": false,
        "reminderTime": "08:00",
        "theme": "system",
        "language": "en"
      }
    }
  },
  "errors": []
}
```

## File Upload

- Uses Multer memory storage.
- Uses Cloudinary for image storage.
- Validates image MIME types.
- Optimizes images before upload.

## Access Rules

- `GET /public/:userId` is public only when the profile is marked public.
- `GET /private/:userId` requires authentication.
- Updates and picture operations require the current user or Admin.
