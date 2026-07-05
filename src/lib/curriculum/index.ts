import { CurriculumTopic, GradeCurriculum } from './types';
import { DistrictConfig, eanesIsd } from './districts/tx/eanes-isd';
import { grade3Curriculum } from './districts/tx/eanes-isd/grade-3';
import { grade4Curriculum } from './districts/tx/eanes-isd/grade-4';
import { grade5Curriculum } from './districts/tx/eanes-isd/grade-5';
import { grade56Curriculum } from './districts/tx/eanes-isd/grade-6';
import { grade7Curriculum } from './districts/tx/eanes-isd/grade-7';
import { grade8Curriculum } from './districts/tx/eanes-isd/grade-8';
import { grade9Algebra1Curriculum } from './districts/tx/eanes-isd/grade-9-algebra1';
// TEMP-STUB-GEOMETRY import { grade10GeometryCurriculum } from './districts/tx/eanes-isd/grade-10-geometry';
const grade10GeometryCurriculum = { grade: 10, label: 'Geometry (Honors)', topics: [] } as GradeCurriculum;

export { type CurriculumTopic, type GradeCurriculum } from './types';
export { type DistrictConfig } from './districts/tx/eanes-isd';

// Registry: keyed by `${state}/${districtSlug}`
const districtRegistry: Record<string, DistrictConfig> = {
  'TX/eanes-isd': eanesIsd,
};

// Grade curricula: keyed by `${state}/${districtSlug}/${grade}`
// Note: the old grade-8-accel-prep.ts file still exists on disk but is no
// longer wired in. It contained Math 7 content mislabeled as grade-8 and was
// superseded by grade-8.ts (real Math 8) and grade-7.ts (which now contains
// the migrated second-half-7 topics).
const curriculumRegistry: Record<string, GradeCurriculum> = {
  'TX/eanes-isd/3': grade3Curriculum,
  'TX/eanes-isd/4': grade4Curriculum,
  'TX/eanes-isd/5': grade5Curriculum,
  'TX/eanes-isd/6': grade56Curriculum,
  'TX/eanes-isd/7': grade7Curriculum,
  'TX/eanes-isd/8': grade8Curriculum,
  // High-school-credit courses taken in middle school (Eanes accelerated
  // pathway) — registered as pseudo-grades 9/10 so the grade-keyed machinery
  // (ordering, videos, pools) works unchanged.
  'TX/eanes-isd/9': grade9Algebra1Curriculum,
  'TX/eanes-isd/10': grade10GeometryCurriculum,
};

export function getDistrictConfig(
  state: string = 'TX',
  district: string = 'eanes-isd'
): DistrictConfig | undefined {
  return districtRegistry[`${state}/${district}`];
}

export function getAllDistricts(): DistrictConfig[] {
  return Object.values(districtRegistry);
}

export function getDistrictsForState(state: string): DistrictConfig[] {
  return Object.entries(districtRegistry)
    .filter(([key]) => key.startsWith(`${state}/`))
    .map(([, config]) => config);
}

export function getCurriculum(
  grade: number,
  state: string = 'TX',
  district: string = 'eanes-isd'
): GradeCurriculum | undefined {
  return curriculumRegistry[`${state}/${district}/${grade}`];
}

export function getAllCurricula(): GradeCurriculum[] {
  return Object.values(curriculumRegistry);
}

/**
 * Get the appropriate topics for a child based on grade, track, state, and district.
 * Uses the district's acceleratedMapping to determine which additional grades to include.
 */
export function getTopicsForChild(
  grade: number,
  track: string,
  state: string = 'TX',
  district: string = 'eanes-isd'
): CurriculumTopic[] {
  const districtConfig = districtRegistry[`${state}/${district}`];
  if (!districtConfig) return [];

  const key = (g: number) => `${state}/${district}/${g}`;

  // Test-prep track: return ONLY the test-prep curriculum, not the regular grade topics
  if (track === 'test-prep' && districtConfig.testPrepMapping?.[grade]) {
    const prepGrade = districtConfig.testPrepMapping[grade];
    const prepCurriculum = curriculumRegistry[key(prepGrade)];
    return prepCurriculum ? [...prepCurriculum.topics] : [];
  }

  const baseCurriculum = curriculumRegistry[key(grade)];
  const topics = baseCurriculum ? [...baseCurriculum.topics] : [];

  if (track === 'accelerated' && districtConfig.acceleratedMapping?.[grade]) {
    for (const extraGrade of districtConfig.acceleratedMapping[grade]) {
      const extra = curriculumRegistry[key(extraGrade)];
      if (extra) topics.push(...extra.topics);
    }
  }

  return topics;
}

export function getTopicById(topicId: string): CurriculumTopic | undefined {
  for (const curriculum of Object.values(curriculumRegistry)) {
    const topic = curriculum.topics.find((t) => t.id === topicId);
    if (topic) return topic;
  }
  return undefined;
}

export function getTopicsByStrand(
  grade: number,
  strand: string,
  state: string = 'TX',
  district: string = 'eanes-isd'
): CurriculumTopic[] {
  const curriculum = curriculumRegistry[`${state}/${district}/${grade}`];
  if (!curriculum) return [];
  return curriculum.topics.filter((t) => t.strand === strand);
}

export function getStrands(
  grade: number,
  state: string = 'TX',
  district: string = 'eanes-isd'
): string[] {
  const curriculum = curriculumRegistry[`${state}/${district}/${grade}`];
  if (!curriculum) return [];
  return Array.from(new Set(curriculum.topics.map((t) => t.strand)));
}
