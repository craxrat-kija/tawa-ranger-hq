<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Timetable;
use Illuminate\Http\Request;

class TimetableController extends Controller
{
    public function index(Request $request)
    {
        $timetable = Timetable::query();

        if ($request->has('date')) {
            $timetable->whereDate('date', $request->date);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $timetable->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        return response()->json([
            'success' => true,
            'data' => $timetable->orderBy('date')->orderBy('time')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'time' => 'required|string',
            'subject' => 'required|string|max:255',
            'instructor' => 'required|string|max:255',
            'location' => 'required|string|max:255',
        ]);

        $timetable = Timetable::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Schedule created successfully',
            'data' => $timetable,
        ], 201);
    }

    public function show(Timetable $timetable)
    {
        return response()->json([
            'success' => true,
            'data' => $timetable,
        ]);
    }

    public function update(Request $request, Timetable $timetable)
    {
        $validated = $request->validate([
            'date' => 'sometimes|date',
            'time' => 'sometimes|string',
            'subject' => 'sometimes|string|max:255',
            'instructor' => 'sometimes|string|max:255',
            'location' => 'sometimes|string|max:255',
        ]);

        $timetable->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Schedule updated successfully',
            'data' => $timetable,
        ]);
    }

    public function destroy(Timetable $timetable)
    {
        $timetable->delete();

        return response()->json([
            'success' => true,
            'message' => 'Schedule deleted successfully',
        ]);
    }
}
