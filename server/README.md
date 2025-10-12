# Hackathon Calendar Hub - REST API with MongoDB

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)

### Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure MongoDB:**
   - For local MongoDB: Make sure MongoDB is running on `mongodb://localhost:27017`
   - For MongoDB Atlas: Update the `MONGODB_URI` in `.env` file with your connection string

3. **Start the application:**
   ```bash
   # Run both frontend and backend
   npm run dev:both
   
   # Or run separately:
   npm run dev          # Frontend only (port 5173)
   npm run dev:server   # Backend only (port 5000)
   ```

## 🛠 API Endpoints

### Base URL: `http://localhost:5000/api`

### Hackathons API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hackathons` | Get all hackathons with pagination and filters |
| GET | `/hackathons/:id` | Get single hackathon |
| POST | `/hackathons` | Create new hackathon |
| PUT | `/hackathons/:id` | Update hackathon |
| DELETE | `/hackathons/:id` | Delete hackathon |
| GET | `/hackathons/featured` | Get featured hackathons |
| GET | `/hackathons/upcoming` | Get upcoming hackathons |
| GET | `/hackathons/search?q=term` | Search hackathons |
| GET | `/hackathons/stats` | Get hackathon statistics |

### Teams API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/teams/:id` | Get team details |
| POST | `/teams` | Create new team |
| GET | `/teams/hackathon/:hackathonId` | Get teams for a hackathon |
| POST | `/teams/:id/join` | Join a team |
| POST | `/teams/:id/leave` | Leave a team |

### Submissions API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/submissions` | Get all submissions |
| GET | `/submissions/:id` | Get single submission |
| POST | `/submissions` | Create new submission |
| PUT | `/submissions/:id` | Update submission |
| DELETE | `/submissions/:id` | Delete submission |
| GET | `/submissions/hackathon/:hackathonId` | Get submissions for a hackathon |

### Users API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all users (public profiles) |
| GET | `/users/:id` | Get user profile |

## 📊 Example API Usage

### Create a Hackathon
```bash
POST /api/hackathons
Content-Type: application/json

{
  "title": "AI Innovation Challenge 2025",
  "description": "Build the next generation of AI applications",
  "organizer": "Tech University",
  "category": "AI/ML",
  "difficulty": "Intermediate",
  "startDate": "2025-10-15T09:00:00Z",
  "endDate": "2025-10-17T18:00:00Z",
  "registrationDeadline": "2025-10-10T23:59:59Z",
  "location": {
    "type": "hybrid",
    "venue": "Tech University Campus"
  },
  "maxParticipants": 200,
  "prizes": [
    {
      "position": "1st Place",
      "amount": 10000,
      "currency": "USD"
    }
  ]
}
```

### Query Hackathons with Filters
```bash
GET /api/hackathons?category=AI/ML&difficulty=Beginner&page=1&limit=10&sortBy=startDate&sortOrder=asc
```

### Create a Team
```bash
POST /api/teams
Content-Type: application/json

{
  "name": "Code Warriors",
  "hackathon": "hackathon_id_here",
  "description": "We're passionate about building innovative AI solutions",
  "maxMembers": 4,
  "lookingFor": [
    {
      "skill": "Frontend Developer",
      "description": "React/Vue.js experience preferred"
    }
  ],
  "tags": ["ai", "machine-learning", "react"]
}
```

## 🗂 Database Models

### Hackathon Schema
- Complete hackathon information with dates, location, prizes
- Support for online/offline/hybrid events
- Sponsor and judge information
- Schedule and FAQ sections

### User Schema  
- User profiles with skills and experience
- Social links and portfolio information
- Hackathon participation history

### Team Schema
- Team formation for hackathons
- Member management and invite codes
- Project information and submissions

### Submission Schema
- Project submissions with repository links
- Judging scores and feedback
- Media attachments and documentation

## 🔧 Configuration

Environment variables in `.env`:
```
MONGODB_URI=mongodb://localhost:27017/hackathon-calendar-hub
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

## 🚦 Health Check

Check if the API is running:
```bash
GET /api/health
```

Response:
```json
{
  "status": "success",
  "message": "Server is running!",
  "timestamp": "2025-09-21T10:30:00.000Z"
}
```

## 📝 Notes

- Authentication is currently disabled for easier testing
- All endpoints are public and don't require authentication
- MongoDB connection is required for the API to function
- CORS is configured to allow requests from the frontend (localhost:5173)

## 🛠 Development

The backend is built with:
- **Express.js** - Web framework
- **Mongoose** - MongoDB ODM
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware
- **Express Rate Limit** - API rate limiting
- **Express Validator** - Input validation
