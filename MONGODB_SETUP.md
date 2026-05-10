# MongoDB Setup Instructions

## ✅ What's Been Set Up

1. **MongoDB Packages Installed**
   - `mongodb` - Official MongoDB driver
   - `mongoose` - ODM for MongoDB

2. **Files Created**
   - `/src/lib/mongodb.ts` - MongoDB connection utility
   - `/src/models/User.ts` - User model/schema
   - `/src/app/api/users/route.ts` - API routes for GET all & POST
   - `/src/app/api/users/[id]/route.ts` - API routes for GET, PUT, DELETE
   - `/src/app/test-mongoconnection/crud/page.tsx` - CRUD UI page
   - `/.env.local` - Environment variables file (needs your connection string)

## 🔧 Setup Steps

### 1. Get Your MongoDB Connection String

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click on your cluster's **"Connect"** button
3. Choose **"Connect your application"**
4. Select **"Node.js"** as the driver
5. Copy the connection string (looks like this):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 2. Configure Your .env.local File

1. Open `/.env.local` in your project
2. Replace the empty `MONGODB_URI=` with your connection string:
   ```env
   MONGODB_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/sorvene?retryWrites=true&w=majority
   ```
   
   **Important:**
   - Replace `<username>` with your MongoDB database user
   - Replace `<password>` with your MongoDB database password
   - Add a database name (e.g., `sorvene`) before the `?` in the URL

### 3. Test the Connection

1. Start your development server:
   ```bash
   yarn dev
   ```

2. Visit: [http://localhost:3000/test-mongoconnection/crud](http://localhost:3000/test-mongoconnection/crud)

3. Try creating, reading, updating, and deleting users!

## 📝 API Endpoints Available

- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `GET /api/users/[id]` - Get a single user
- `PUT /api/users/[id]` - Update a user
- `DELETE /api/users/[id]` - Delete a user

## 🔍 Troubleshooting

**"MONGODB_URI not defined" error:**
- Make sure `.env.local` file exists in the root directory
- Restart your dev server after adding the connection string

**Connection refused:**
- Check your MongoDB Atlas network access (allow your IP address)
- Verify your username and password are correct
- Make sure you're using the database user credentials, not your Atlas account

**"User validation failed":**
- Username must be 2-50 characters
- Username must be unique

## 🎯 What You Can Do Now

Visit `/test-mongoconnection/crud` to:
- ✅ Create new users
- ✅ View all users in a table
- ✅ Edit existing users
- ✅ Delete users
- ✅ See real-time updates

The page uses daisyUI components for a nice UI and handles all CRUD operations!
