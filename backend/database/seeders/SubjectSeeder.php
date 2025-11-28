<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Course;
use Illuminate\Database\Seeder;

class SubjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all courses to assign subjects to
        $courses = Course::all();

        // Sample subjects for ranger training
        $subjects = [
            [
                'name' => 'Wildlife Management',
                'code' => 'WLM101',
                'description' => 'Introduction to wildlife conservation, species identification, and habitat management principles.',
            ],
            [
                'name' => 'Law Enforcement',
                'code' => 'LAW201',
                'description' => 'Wildlife protection laws, legal procedures, evidence collection, and court procedures.',
            ],
            [
                'name' => 'Field Operations',
                'code' => 'FLD301',
                'description' => 'Patrol techniques, surveillance, tracking, and field investigation methods.',
            ],
            [
                'name' => 'First Aid and Medical Emergency',
                'code' => 'MED401',
                'description' => 'Basic first aid, emergency medical response, and wilderness medicine.',
            ],
            [
                'name' => 'Navigation and Orientation',
                'code' => 'NAV501',
                'description' => 'Map reading, GPS usage, compass navigation, and terrain analysis.',
            ],
            [
                'name' => 'Communication Skills',
                'code' => 'COM601',
                'description' => 'Radio communication, report writing, and inter-agency coordination.',
            ],
            [
                'name' => 'Firearms Training',
                'code' => 'FAR701',
                'description' => 'Weapon handling, marksmanship, safety procedures, and maintenance.',
            ],
            [
                'name' => 'Conservation Biology',
                'code' => 'CON801',
                'description' => 'Ecosystem dynamics, biodiversity conservation, and environmental impact assessment.',
            ],
            [
                'name' => 'Anti-Poaching Operations',
                'code' => 'APO901',
                'description' => 'Poaching prevention strategies, intelligence gathering, and enforcement operations.',
            ],
            [
                'name' => 'Community Relations',
                'code' => 'COM1001',
                'description' => 'Community engagement, conflict resolution, and public awareness programs.',
            ],
            [
                'name' => 'Vehicle Operations',
                'code' => 'VEH1101',
                'description' => 'Off-road driving, vehicle maintenance, and emergency vehicle procedures.',
            ],
            [
                'name' => 'Report Writing and Documentation',
                'code' => 'RPT1201',
                'description' => 'Incident reporting, case documentation, and administrative procedures.',
            ],
        ];

        // If there are courses, assign subjects to each course
        if ($courses->count() > 0) {
            foreach ($courses as $course) {
                foreach ($subjects as $subjectData) {
                    // Make code unique per course
                    $code = $subjectData['code'] . '-' . $course->code;
                    
                    Subject::firstOrCreate(
                        [
                            'code' => $code,
                            'course_id' => $course->id,
                        ],
                        [
                            'name' => $subjectData['name'],
                            'description' => $subjectData['description'],
                        ]
                    );
                }
            }
        } else {
            // If no courses exist, create subjects without course_id (can be assigned later)
            foreach ($subjects as $subjectData) {
                Subject::firstOrCreate(
                    [
                        'code' => $subjectData['code'],
                    ],
                    [
                        'name' => $subjectData['name'],
                        'description' => $subjectData['description'],
                        'course_id' => null,
                    ]
                );
            }
        }

        $this->command->info('Sample subjects seeded successfully!');
    }
}
