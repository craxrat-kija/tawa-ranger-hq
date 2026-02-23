<?php

namespace App\Helpers;

use App\Models\User;
use App\Models\Course;

class CourseHelper
{
    /**
     * Get the current course ID for the authenticated user
     */
    public static function getCurrentCourseId(?User $user): ?int
    {
        if (!$user)
            return null;

        // Check for course ID in request header
        $courseId = request()->header('X-Course-Id');
        if ($courseId) {
            return (int) $courseId;
        }

        // Fallback: If user has only one course, return it
        $courses = $user->enrolledCourses;
        if ($courses->count() === 1) {
            return $courses->first()->id;
        }

        return null; // Requires selection if multiple courses exist and no header provided
    }

    /**
     * Get the current course for the authenticated user
     */
    public static function getCurrentCourse(?User $user): ?Course
    {
        $id = self::getCurrentCourseId($user);
        return $id ? Course::find($id) : null;
    }

    /**
     * Check if user has access to a specific course
     */
    public static function hasAccessToCourse(?User $user, int $courseId): bool
    {
        if (!$user) {
            return false;
        }

        // Super admins can access everything
        if ($user->role === 'super_admin') {
            return true;
        }

        // Check if user is enrolled in the course
        return $user->enrolledCourses()->where('courses.id', $courseId)->exists();
    }
}

