# TAWA Training System - Access Links

## 🌐 Application URLs

### Frontend Application
- **Base URL**: `http://localhost:8080`

### Backend API
- **Base URL**: `http://104.248.191.90:9000`

---

## 🔐 Login Pages

### 1. Regular User Login (Default Home Page)
**URL**: `http://localhost:8080/` or `http://localhost:8080/login`

**Available Roles**:
- Admin
- Instructor
- Doctor

**Demo Credentials**:

| Role | User ID | Password |
|------|---------|----------|
| Admin | admin@tawa.go.tz | tawa2024 |
| Instructor | instructor@tawa.go.tz | tawa2024 |
| Doctor | doctor@tawa.go.tz | tawa2024 |

---

### 2. Super Admin Login
**URL**: `http://localhost:8080/super-admin`

**Demo Credentials**:

| Role | User ID | Password |
|------|---------|----------|
| Super Admin | superadmin@tawa.go.tz | superadmin2024 |

---

## 📱 Navigation

### From Regular Login to Super Admin Login:
- Click the **"Super Admin Login →"** link at the bottom of the login page

### From Super Admin Login to Regular Login:
- Click the **"Regular User Login →"** link at the bottom of the super admin login page

---

## 🎯 Quick Access Links

**For Regular Users (Admin, Instructor, Doctor)**:
```
http://localhost:8080/
```

**For Super Admin**:
```
http://localhost:8080/super-admin
```

---

## 📋 Notes

- The home page (`/`) now directly shows the regular login page
- The landing page has been removed
- Both login pages have links to navigate between them
- All text is now visible in both light and dark modes
- The "Secured by TAWA IT Department" footer is visible on all pages

---

## 🚀 Running the Application

Make sure both servers are running:

1. **Frontend** (from project root):
   ```bash
   npm run dev
   ```

2. **Backend** (from backend directory):
   ```bash
   cd backend
   php artisan serve
   ```
