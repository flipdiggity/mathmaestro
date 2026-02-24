export interface Question {
  number: number;
  question: string;
  answer: string;
  topicId: string;
  topicName: string;
  difficulty: number;
  isVerifiable: boolean;
  section?: 'new' | 'review';
  hasGrid?: boolean;
  gridType?: 'coordinate-plane' | 'number-line';
}

export interface GradingQuestionResult {
  number: number;
  question: string;
  correctAnswer: string;
  studentAnswer: string;
  isCorrect: boolean;
  feedback?: string;
}

export interface WorksheetWithRelations {
  id: string;
  childId: string;
  child: {
    id: string;
    name: string;
    grade: number;
  };
  title: string;
  weekNumber: number | null;
  dayOfWeek: string | null;
  questionsJson: string;
  topicIdsJson: string;
  status: string;
  createdAt: Date;
  gradingResult: {
    id: string;
    totalQuestions: number;
    correctCount: number;
    scorePercent: number;
    resultsJson: string;
  } | null;
}
