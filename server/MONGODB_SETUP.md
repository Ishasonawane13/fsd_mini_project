# MongoDB Setup Guide

## Option 1: MongoDB Atlas (Recommended - Free & Easy)

### Steps:
1. **Go to MongoDB Atlas**: https://www.mongodb.com/atlas
2. **Sign up** for a free account
3. **Create a new cluster** (choose the free tier M0)
4. **Create a database user**:
   - Username: `admin`
   - Password: `password123` (or whatever you prefer)
5. **Add your IP address** to the IP Access List (or use 0.0.0.0/0 for any IP)
6. **Get your connection string**:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - It will look like: `mongodb+srv://admin:<password>@cluster0.abc123.mongodb.net/hackathon-calendar-hub?retryWrites=true&w=majority`

### Update your .env file:
```env
MONGODB_URI=mongodb+srv://admin:password123@cluster0.abc123.mongodb.net/hackathon-calendar-hub?retryWrites=true&w=majority
```

---

## Option 2: Local MongoDB Installation

### For Windows:
1. **Download MongoDB**: https://www.mongodb.com/try/download/community
2. **Install MongoDB** with default settings
3. **Start MongoDB service**:
   ```cmd
   net start MongoDB
   ```
4. **Your connection string** is already set in .env:
   ```env
   MONGODB_URI=mongodb://localhost:27017/hackathon-calendar-hub
   ```

### For macOS:
```bash
# Install using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb/brew/mongodb-community
```

### For Linux (Ubuntu):
```bash
# Install MongoDB
sudo apt update
sudo apt install -y mongodb

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

## Option 3: Docker (If you have Docker installed)

```bash
# Run MongoDB in Docker
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  mongo:latest

# Connection string for Docker:
MONGODB_URI=mongodb://admin:password123@localhost:27017/hackathon-calendar-hub?authSource=admin
```

---

## Testing the Connection

Once you've set up MongoDB, update your `.env` file with the correct connection string and restart the server:

```bash
cd server
node server.js
```

You should see:
```
MongoDB Connected: cluster0-abc123.mongodb.net (or localhost)
Server running on port 5000
Environment: development
```

Then test the authentication:
```bash
./test_auth.sh
```

---

## Quick Start with MongoDB Atlas (Easiest):

1. **Sign up**: https://www.mongodb.com/atlas
2. **Create free cluster** (M0 Sandbox)
3. **Create database user** 
4. **Whitelist IP** (0.0.0.0/0 for development)
5. **Copy connection string** and update `.env`
6. **Restart server**

That's it! Your API will be connected to MongoDB in the cloud.
