# 🧪 User Management Testing Guide

## 🎯 Test Scenario: Admin Menu & User Management

### Step 1: Open App
1. Navigate to: `http://localhost:5173/`
2. App should automatically login as **Haris Latifa** (Admin)

### Step 2: Verify Admin Status
1. Look at top-right corner - should see user avatar
2. Click on the avatar
3. Should see user dropdown menu with:
   - Name: "Haris Latifa"
   - Email: "latihads@gmail.com" 
   - Role badge: "admin" (red background)

### Step 3: Access Admin Menu
1. In the dropdown, scroll down
2. Should see **"Admin"** section with:
   - **"User Management"** menu item 👥
   - **"Category Management"** menu item 🏷️

### Step 4: Test User Management
1. Click **"User Management"**
2. Should navigate to User Management page with:
   - Header: "👥 User Management"
   - Stats cards showing total users, active users, administrators
   - Table with existing users (Alex, Maria, James, Li Wei)
   - **"+ Add User"** button

### Step 5: Test Add User
1. Click **"+ Add User"** button
2. Modal should open with form fields:
   - Full Name *
   - Email Address *
   - Role (dropdown: User/Administrator)
   - Avatar URL (optional)
3. Fill out form and click **"Add User"**
4. New user should appear in table

### Step 6: Test Edit/Delete
1. In users table, each row should have:
   - **View** button (gray)
   - **Edit** button (blue)
   - **Activate/Deactivate** button (yellow/green)
   - **Delete** button (red)
2. Try editing a user - modal should open with existing data
3. Try activating/deactivating a user - status should change
4. Try deleting a user - should remove from table

## ✅ Expected Results:
- ✅ Auto-login as admin works
- ✅ Admin badge shows in dropdown
- ✅ User Management menu appears for admin
- ✅ User Management page loads with full UI
- ✅ CRUD operations work (Create, Read, Update, Delete)
- ✅ Form validation works
- ✅ Enhanced user fields display properly

## 🐛 Troubleshooting:
- **No admin menu?** → Check browser console for auth issues
- **Menu doesn't work?** → Check if ViewType enum includes UserManagement
- **Page blank?** → Check console for component import errors
- **Form errors?** → Check UserManagement component props

## 🎮 Test Enhanced Fields:
The enhanced user model includes:
- 📞 Phone numbers
- 🏢 Department & Position
- 📍 Location
- 📝 Bio & Skills
- 🔗 Social links
- ⚙️ Preferences

Check if these display properly in the user table and forms!