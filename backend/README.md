# TAWA Ranger HQ - Backend API

Laravel backend API for the Tanzania Wildlife Management Authority (TAWA) Ranger Training Headquarters system.

## Features

- **Authentication**: Laravel Sanctum-based API authentication
- **User Management**: Role-based access control (Admin, Instructor, Doctor, Trainee)
- **Course Management**: Create and manage training courses
- **Materials Management**: Upload and manage training materials (PDFs, PPTs, etc.)
- **Gallery Management**: Upload and manage training photos
- **Timetable Management**: Create and manage training schedules
- **Patient/Medical Management**: 
  - Patient registration and management
  - Medical reports with vital signs
  - Attendance tracking
- **RESTful API**: Complete REST API endpoints for all resources

## Tech Stack

- Laravel 12
- Laravel Sanctum (API Authentication)
- PHP 8.2+
- MySQL/PostgreSQL/SQLite

## Installation

1. **Install dependencies:**
   ```bash
   composer install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

3. **Configure database in `.env`:**
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=tawa_ranger_hq
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   ```

4. **Run migrations:**
   ```bash
   php artisan migrate
   ```

5. **Seed database:**
   ```bash
   php artisan db:seed
   ```

6. **Create storage link:**
   ```bash
   php artisan storage:link
   ```

7. **Start the development server:**
   ```bash
   php artisan serve
   ```

The API will be available at `http://localhost:8000/api`

## API Endpoints

### Authentication
- `POST /api/login` - Login
- `POST /api/register` - Register new user
- `POST /api/logout` - Logout (requires auth)
- `GET /api/user` - Get current user (requires auth)

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `GET /api/users/{id}` - Get user details
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Courses
- `GET /api/courses` - List all courses
- `POST /api/courses` - Create course
- `GET /api/courses/{id}` - Get course details
- `PUT /api/courses/{id}` - Update course
- `DELETE /api/courses/{id}` - Delete course

### Materials
- `GET /api/materials` - List all materials
- `POST /api/materials` - Upload material
- `GET /api/materials/{id}` - Get material details
- `GET /api/materials/{id}/download` - Download material
- `DELETE /api/materials/{id}` - Delete material

### Gallery
- `GET /api/gallery` - List all gallery items
- `POST /api/gallery` - Upload photo
- `GET /api/gallery/{id}` - Get gallery item details
- `DELETE /api/gallery/{id}` - Delete gallery item

### Timetable
- `GET /api/timetable` - List all timetable entries
- `POST /api/timetable` - Create timetable entry
- `GET /api/timetable/{id}` - Get timetable entry details
- `PUT /api/timetable/{id}` - Update timetable entry
- `DELETE /api/timetable/{id}` - Delete timetable entry

### Patients
- `GET /api/patients` - List all patients
- `POST /api/patients` - Register patient
- `GET /api/patients/{id}` - Get patient details (with reports and attendance)
- `PUT /api/patients/{id}` - Update patient
- `DELETE /api/patients/{id}` - Delete patient

### Medical Reports
- `GET /api/medical-reports` - List all medical reports
- `POST /api/medical-reports` - Create medical report
- `GET /api/medical-reports/{id}` - Get medical report details
- `PUT /api/medical-reports/{id}` - Update medical report
- `DELETE /api/medical-reports/{id}` - Delete medical report

### Attendance Records
- `GET /api/attendance-records` - List all attendance records
- `POST /api/attendance-records` - Create attendance record
- `GET /api/attendance-records/{id}` - Get attendance record details
- `PUT /api/attendance-records/{id}` - Update attendance record
- `DELETE /api/attendance-records/{id}` - Delete attendance record

## Authentication

All protected routes require authentication using Laravel Sanctum. Include the token in the Authorization header:

```
Authorization: Bearer {your-token}
```

## Default Users (After Seeding)

- **Admin**: admin@tawa.go.tz / tawa2024
- **Instructor**: instructor@tawa.go.tz / tawa2024
- **Doctor**: doctor@tawa.go.tz / tawa2024
- **Trainee**: john.doe@tawa.go.tz / tawa2024

## CORS Configuration

The API is configured to accept requests from your frontend. Make sure to update the CORS configuration in `config/cors.php` or via environment variables if needed.

## Storage

Uploaded files (materials and gallery images) are stored in `storage/app/public`. Make sure to create a symbolic link:

```bash
php artisan storage:link
```

This will create a link from `public/storage` to `storage/app/public`.

## Response Format

All API responses follow this format:

```json
{
    "success": true,
    "message": "Operation successful",
    "data": { ... }
}
```

Error responses:

```json
{
    "success": false,
    "message": "Error message",
    "errors": { ... }
}
```

## Development

### Running Tests
```bash
php artisan test
```

### Code Style
```bash
./vendor/bin/pint
```

## License

This project is proprietary software for TAWA (Tanzania Wildlife Management Authority).
