import { CurriculumTopic, GradeCurriculum } from './types';
import { grade3Curriculum } from './grade3';
import { grade4Curriculum } from './grade4';
import { grade56Curriculum } from './grade5-6';
import { grade7Curriculum } from './grade7';

export { type CurriculumTopic, type GradeCurriculum } from './types';

const curriculumRegistry: Record<number, GradeCurriculum> = {
  3: grade3Curriculum,
  4: grade4Curriculum,
  6: grade56Curriculum,
  7: grade7Curriculum,
};

export function getCurriculum(grade: number): GradeCurriculum | undefined {
  return curriculumRegistry[grade];
}

export function getAllCurricula(): GradeCurriculum[] {
  return Object.values(curriculumRegistry);
}

/**
 * Get the appropriate topics for a child based on grade and track.
 * - Eliana (grade 5, accelerated): 6th grade + 7th grade first half
 * - Mylo (grade 3, accelerated): 3rd grade reinforcement + 4th grade preview
 */
export function getTopicsForChild(grade: number, track: string): CurriculumTopic[] {
  if (grade === 5 && track === 'accelerated') {
    // Eliana: 6th grade remaining + 7th grade first half
    return [...grade56Curriculum.topics, ...grade7Curriculum.topics];
  }

  if (grade === 3 && track === 'accelerated') {
    // Mylo: 3rd grade reinforcement + 4th grade preview
    return [...grade3Curriculum.topics, ...grade4Curriculum.topics];
  }

  // Default: just the current grade
  const curriculum = curriculumRegistry[grade];
  return curriculum ? curriculum.topics : [];
}

export function getTopicById(topicId: string): CurriculumTopic | undefined {
  for (const curriculum of Object.values(curriculumRegistry)) {
    const topic = curriculum.topics.find((t) => t.id === topicId);
    if (topic) return topic;
  }
  return undefined;
}

export function getTopicsByStrand(grade: number, strand: string): CurriculumTopic[] {
  const curriculum = curriculumRegistry[grade];
  if (!curriculum) return [];
  return curriculum.topics.filter((t) => t.strand === strand);
}

export function getStrands(grade: number): string[] {
  const curriculum = curriculumRegistry[grade];
  if (!curriculum) return [];
  return Array.from(new Set(curriculum.topics.map((t) => t.strand)));
}
