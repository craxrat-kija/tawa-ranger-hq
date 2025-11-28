<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\MaterialController;
use App\Http\Controllers\Api\GalleryController;
use App\Http\Controllers\Api\TimetableController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\MedicalReportController;
use App\Http\Controllers\Api\AttendanceRecordController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\AssessmentController;
use App\Http\Controllers\Api\GradeController;
use App\Http\Controllers\Api\SetupController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\AdminPermissionController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::get('/setup/check', [SetupController::class, 'checkSetup']);
Route::get('/setup/template', [SetupController::class, 'downloadTemplate']);
Route::post('/setup', [SetupController::class, 'setup']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/super-admin/login', [AuthController::class, 'superAdminLogin']);
Route::post('/register', [AuthController::class, 'register']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Users
    Route::apiResource('users', UserController::class);
    Route::get('/users/template/download', [UserController::class, 'downloadTemplate']);
    Route::post('/users/import/excel', [UserController::class, 'importFromExcel']);

    // Courses
    Route::get('/courses/{course}/enrolled-users', [CourseController::class, 'enrolledUsers']);
    Route::post('/courses/{course}/enroll-user/{user}', [CourseController::class, 'enrollUser']);
    Route::post('/courses/{course}/unenroll-user/{user}', [CourseController::class, 'unenrollUser']);
    Route::post('/courses/{course}/enroll', [CourseController::class, 'enroll']);
    Route::post('/courses/{course}/unenroll', [CourseController::class, 'unenroll']);
    Route::get('/courses/my-courses', [CourseController::class, 'myCourses']);
    Route::get('/courses/available', [CourseController::class, 'availableCourses']);
    Route::apiResource('courses', CourseController::class);

    // Materials
    Route::apiResource('materials', MaterialController::class);
    Route::get('/materials/{material}/download', [MaterialController::class, 'download']);

    // Gallery
    Route::apiResource('gallery', GalleryController::class);

    // Timetable
    Route::apiResource('timetable', TimetableController::class);

    // Patients
    Route::apiResource('patients', PatientController::class);

    // Medical Reports
    Route::apiResource('medical-reports', MedicalReportController::class);

    // Attendance Records
    Route::apiResource('attendance-records', AttendanceRecordController::class);

    // Messages (Chat Board)
    Route::apiResource('messages', MessageController::class);

    // Subjects
    Route::apiResource('subjects', SubjectController::class);

    // Assessments
    Route::apiResource('assessments', AssessmentController::class);

    // Grades
    Route::apiResource('grades', GradeController::class);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread', [NotificationController::class, 'unread']);
    Route::get('/notifications/count', [NotificationController::class, 'count']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

    // Activity Log (Admin only)
    Route::get('/admin/doctor-activities', [ActivityLogController::class, 'doctorActivities']);

    // Comments
    Route::get('/comments', [CommentController::class, 'index']);
    Route::post('/comments', [CommentController::class, 'store']);
    Route::put('/comments/{comment}', [CommentController::class, 'update']);
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);

    // Admin Permissions (Super Admin only)
    Route::get('/admin/permissions', [AdminPermissionController::class, 'index']);
    Route::put('/admin/permissions/{adminId}', [AdminPermissionController::class, 'update']);
    Route::get('/admin/permissions/my', [AdminPermissionController::class, 'myPermissions']);
});

