export interface DistrictConfig {
  id: string;
  name: string;
  state: string;
  standardsFramework: string;
  supportedGrades: number[];
  tracks: string[];
  acceleratedMapping: Record<number, number[]>;
}

export const eanesIsd: DistrictConfig = {
  id: 'eanes-isd',
  name: 'Eanes ISD',
  state: 'TX',
  standardsFramework: 'TEKS',
  supportedGrades: [3, 4, 5, 6, 7],
  tracks: ['standard', 'accelerated'],
  acceleratedMapping: {
    3: [4],
    4: [5],
    5: [6, 7],
    6: [7],
    7: [8],
  },
};
