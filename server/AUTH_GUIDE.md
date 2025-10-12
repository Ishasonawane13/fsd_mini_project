# Authentication & JWT Setup Guide

## 🔐 Authentication System

The API now includes a complete authentication system with JWT tokens.

## 📝 Auth Endpoints

### Register a new user
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get current user profile
```bash
GET /api/auth/me
Authorization: Bearer <your-jwt-token>
```

### Update profile
```bash
PUT /api/auth/profile
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "bio": "Passionate developer",
  "skills": [
    {
      "name": "JavaScript",
      "level": "Advanced"
    }
  ]
}
```

### Change password
```bash
PUT /api/auth/change-password
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

## 🔒 Protected Endpoints

The following endpoints now require authentication:

### Hackathons
- `POST /api/hackathons` - Create hackathon (requires `organizer` or `admin` role)
- `PUT /api/hackathons/:id` - Update hackathon (creator or admin only)
- `DELETE /api/hackathons/:id` - Delete hackathon (creator or admin only)

### Teams
- `POST /api/teams` - Create team
- `POST /api/teams/:id/join` - Join team
- `POST /api/teams/:id/leave` - Leave team

### Submissions
- `POST /api/submissions` - Create submission
- `PUT /api/submissions/:id` - Update submission
- `DELETE /api/submissions/:id` - Delete submission

## 🎫 Using JWT Tokens

### In Headers
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### In JavaScript/Frontend
```javascript
// Store token after login
localStorage.setItem('token', response.data.token);

// Use in API calls
const token = localStorage.getItem('token');
fetch('/api/hackathons', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(hackathonData)
});
```

## 👤 User Roles

- **user**: Default role, can participate in hackathons
- **organizer**: Can create and manage hackathons
- **admin**: Full access to all resources

## 🔧 Environment Variables

Make sure these are set in your `.env` file:
```env
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
JWT_EXPIRE=7d
```

## 🧪 Testing Authentication

### 1. Register a new user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 2. Login and get token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Use token for protected endpoint
```bash
curl -X POST http://localhost:5000/api/hackathons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "My Hackathon",
    "description": "A great hackathon",
    "organizer": "Test Org",
    "category": "Web Development",
    "difficulty": "Beginner",
    "startDate": "2025-12-01T09:00:00Z",
    "endDate": "2025-12-03T18:00:00Z",
    "registrationDeadline": "2025-11-25T23:59:59Z",
    "location": {
      "type": "online"
    }
  }'
```

## 🛡️ Security Features

- Password hashing with bcrypt
- JWT token expiration
- Rate limiting on auth endpoints
- Input validation and sanitization
- CORS protection
- Helmet security headers

## 🚨 Important Notes

1. **Change JWT_SECRET**: Use a strong, unique secret in production
2. **HTTPS**: Always use HTTPS in production
3. **Token Storage**: Store JWT tokens securely (HttpOnly cookies preferred over localStorage)
4. **Token Expiration**: Tokens expire after 7 days by default
5. **Role-Based Access**: Some endpoints require specific roles (organizer/admin)
