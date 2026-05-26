export interface DistrictConfig {
  id: string;
  name: string;
  state: string;
  standardsFramework: string;
  supportedGrades: number[];
  tracks: string[];
  acceleratedMapping: Record<number, number[]>;
  // test-prep track: maps a child's current grade to the test-prep curriculum grade.
  // Unlike accelerated (which adds topics ON TOP of the base grade), test-prep
  // replaces the base grade entirely with only the prep topics.
  testPrepMapping?: Record<number, number>;
}

export const eanesIsd: DistrictConfig = {
  id: 'eanes-isd',
  name: 'Eanes ISD',
  state: 'TX',
  standardsFramework: 'TEKS',
  supportedGrades: [3, 4, 5, 6, 7],
  tracks: ['standard', 'accelerated', 'test-prep'],
  acceleratedMapping: {
    3: [4],
    4: [5],
    5: [6, 7],
    6: [7],
    7: [8],
  },
  // Grade 5 or 6 students doing test-prep get the Math 8 Accel Placement Prep curriculum
  testPrepMapping: {
    5: 8,
    6: 8,
  },
};
