# 🚨 SECURITY NOTICE FOR PUBLIC REPOSITORY

## Before Using This Project:

### 1. Environment Variables
- Copy `server/.env.example` to `server/.env`
- **CHANGE THE JWT_SECRET** to a strong, unique value
- Update other environment variables as needed

### 2. Database
- This project uses local MongoDB
- No sensitive production data is included
- Seed data is for demonstration only

### 3. Authentication
- Authentication is currently disabled for API testing
- Default admin credentials in seed file are for demo only
- Change all default passwords before production use

## ✅ Safe for Public Repository
- No real API keys or secrets in code
- No production database credentials
- Environment files are properly ignored
- All sensitive data is in `.gitignore`