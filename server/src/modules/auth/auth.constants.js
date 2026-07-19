const AUTH_ROLES = {
  STUDENT: 'Student',
  MENTOR: 'Mentor',
  ADMIN: 'Admin',
};

const PERMISSIONS_BY_ROLE = {
  Student: ['auth:self:read', 'auth:password:change', 'auth:logout'],
  Mentor: ['auth:self:read', 'auth:password:change', 'auth:logout', 'auth:mentor:manage'],
  Admin: ['*'],
};

module.exports = {
  AUTH_ROLES,
  PERMISSIONS_BY_ROLE,
};
