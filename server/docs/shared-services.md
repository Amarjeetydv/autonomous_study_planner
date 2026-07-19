# Shared Services

This backend layer provides reusable infrastructure for future modules.

## Included Services

- Pagination, search, sorting, and filtering query helpers
- File upload service using Multer, Sharp, and Cloudinary
- Email service using Nodemailer and HTML templates
- Notification service with in-app and email dispatch support
- Cron job scheduler for reminders, streaks, and token cleanup
- API response helpers
- Custom error classes
- Shared constants, enums, and utility functions

## Main Exports

### Query Helpers

- `normalizePagination`
- `buildPagination`
- `buildSearchQuery`
- `buildSortQuery`
- `buildFilterQuery`
- `buildListQuery`

### File Upload

- `createMulterUploader`
- `validateImageFile`
- `optimizeImageBuffer`
- `uploadImage`
- `deleteFile`

### Email

- `sendWelcomeEmail`
- `sendVerificationEmail`
- `sendPasswordResetEmail`

### Notifications

- `createNotificationService`
- `notificationService`
- `notificationBus`

### Cron Jobs

- `registerCronJobs`
- `cleanupExpiredTokens`

## Response Shape

```json
{
  "success": true,
  "message": "",
  "data": {},
  "errors": []
}
```
