# Authentication and Authorization API

This backend module uses JWT access tokens, HTTP-only refresh token cookies, role-based access control, and secure token rotation.

## Base Path

`/api/v1/auth`

## Roles

- Student
- Mentor
- Admin

## Security Rules

- Passwords are hashed with `bcryptjs`.
- Refresh tokens are stored as hashes in MongoDB.
- Refresh tokens are sent as HTTP-only cookies.
- Access tokens are returned in the response body.
- Auth endpoints use stricter rate limiting.

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

### Success

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "66a1b2c3d4e5f67890123456",
      "name": "Aman",
      "email": "aman@example.com",
      "roles": ["Student"]
    },
    "accessToken": "eyJhbGciOi..."
  },
  "errors": []
}
```

### Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

### Unauthorized Error

```json
{
  "success": false,
  "message": "Authentication required",
  "data": null,
  "errors": []
}
```

## Available Middleware

- `protect` for JWT access token verification
- `authorizeRoles(...roles)` for role-based access control
- `authorizePermissions(...permissions)` for permission checks
- auth endpoint rate limiters for register, login, password reset, and refresh

## Folder Structure

```text
src/modules/auth/
  auth.constants.js
  auth.controller.js
  auth.email.js
  auth.middleware.js
  auth.routes.js
  auth.service.js
  auth.utils.js
  auth.validators.js
```
