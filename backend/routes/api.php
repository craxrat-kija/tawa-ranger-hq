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
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Users
    Route::apiResource('users', UserController::class);

    // Courses
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
});

