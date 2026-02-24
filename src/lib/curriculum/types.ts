export interface CurriculumTopic {
  id: string;
  tpiCode: string;         // TEKS Performance Indicator code
  name: string;
  description: string;
  gradeLevel: number;
  strand: string;           // e.g. "Number & Operations", "Algebra"
  difficulty: 1 | 2 | 3;   // Within grade: 1=intro, 2=developing, 3=advanced
  prerequisites: string[];  // Topic IDs
  sampleProblems: string[]; // Guide Claude's generation
  isVerifiable: boolean;    // Can answer be programmatically checked
  order: number;            // Sequence within grade
  requiresImage?: boolean;
  imageType?: 'coordinate-plane' | 'number-line';
}

export interface GradeCurriculum {
  grade: number;
  label: string;
  topics: CurriculumTopic[];
}

export interface TopicSelection {
  topic: CurriculumTopic;
  reason: 'new' | 'review';
  priority: number;
}
