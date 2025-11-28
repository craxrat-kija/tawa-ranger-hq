<?php

namespace App\Helpers;

use App\Models\User;
use App\Models\Course;

class CourseHelper
{
    /**
     * Get the current course for the authenticated user
     */
    public static function getCurrentCourse(?User $user): ?Course
    {
        if (!$user || !$user->course_id) {
            return null;
        }

        return Course::find($user->course_id);
    }

    /**
     * Get the current course ID for the authenticated user
     */
    public static function getCurrentCourseId(?User $user): ?int
    {
        return $user?->course_id;
    }

    /**
     * Check if user has access to a specific course
     */
    public static function hasAccessToCourse(?User $user, int $courseId): bool
    {
        if (!$user) {
            return false;
        }

        // Admins can access their own course
        if ($user->course_id === $courseId) {
            return true;
        }

        // Check if user is enrolled in the course
        return $user->enrolledCourses()->where('courses.id', $courseId)->exists();
    }
}

