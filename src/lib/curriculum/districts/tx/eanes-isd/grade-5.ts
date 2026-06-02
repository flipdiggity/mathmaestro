import { GradeCurriculum } from '../../../types';

export const grade5Curriculum: GradeCurriculum = {
  grade: 5,
  label: "5th Grade Mathematics (First Half)",
  topics: [
    // ─── Strand 1: Decimals & Place Value (TEKS 5.2) ─────────────────────
    {
      id: "5.dc.1",
      tpiCode: "5.2A",
      name: "Place Value Through Thousandths",
      description:
        "Represent the value of digits in decimals through the thousandths using expanded notation and numerals. Understand that each place is one-tenth the value of the place to its left.",
      gradeLevel: 5,
      strand: "Number & Operations",
      difficulty: 1,
      prerequisites: ["4.nf.4", "4.nf.5"],
      sampleProblems: [
        "What is the value of the digit 6 in the number 4.563?",
        "Write 0.482 in expanded form using fractions: (4 x 1/10) + (8 x 1/100) + (2 x 1/1000).",
        "Shade a decimal grid to represent 0.275. Write the number in words.",
      ],
      isVerifiable: true,
      order: 1,
      nineWeeks: 1,
      requiresImage: true,
      imageType: 'fraction-model',
      bookRefs: [
        { title: "Big Fat Middle School Math Workbook", isbn: "9781523513581", chapters: [1, 3], unit: "Unit 1 — Number System", note: "Place value and decimal representation" },
      ],
    },
    {
      id: "5.dc.2",
      tpiCode: "5.2B",
      name: "Comparing and Ordering Decimals",
      description:
        "Compare and order two decimals to the thousandths using place-value reasoning and the symbols <, >, and =. Use a number line or grid models to justify comparisons.",
      gradeLevel: 5,
      strand: "Number & Operations",
      difficulty: 1,
      prerequisites: ["4.nf.5", "5.dc.1"],
      sampleProblems: [
        "Order from least to greatest: 0.405, 0.45, 0.045, 0.504.",
        "Compare using <, >, or =: 3.276 ___ 3.27.",
        "On a number line between 1.2 and 1.3, place the decimals 1.225, 1.275, and 1.21.",
      ],
      isVerifiable: true,
      order: 2,
      nineWeeks: 1,
      bookRefs: [
        { title: "Big Fat Middle School Math Workbook", isbn: "9781523513581", chapters: [1, 3], unit: "Unit 1 — Number System" },
      ],
    },
    {
      id: "5.dc.3",
      tpiCode: "5.2C",
      name: "Rounding Decimals",
      description:
        "Round decimals to the tenths or hundredths place. Use place-value understanding and a number line to determine the nearest benchmark.",
      gradeLevel: 5,
      strand: "Number & Operations",
      difficulty: 1,
      prerequisites: ["4.nbt.3", "5.dc.1"],
      sampleProblems: [
        "Round 4.367 to the nearest hundredth.",
        "Round 12.085 to the nearest tenth.",
        "A runner finished a race in 23.748 seconds. Round the time to the nearest hundredth of a second.",
      ],
      isVerifiable: true,
      order: 3,
      nineWeeks: 1,
      bookRefs: [
        { title: "Big Fat Middle School Math Workbook", isbn: "9781523513581", chapters: [1, 3], unit: "Unit 1 — Number System" },
      ],
    },

    // ─── Strand 2: Number Theory (TEKS 5.4) ──────────────────────────────
    {
      id: "5.ns.1",
      tpiCode: "5.4A",
      name: "Prime and Composite Numbers",
      description:
        "Identify prime and composite numbers within 100. Use factors to determine whether a whole number is prime (exactly two factors) or composite (more than two factors).",
      gradeLevel: 5,
      strand: "Number & Operations",
      difficulty: 1,
      prerequisites: ["4.nbt.5"],
      sampleProblems: [
        "Is 37 prime or composite? List all of its factors.",
        "Identify every prime number between 20 and 40.",
        "Is 51 a prime number? Justify your answer by finding a factor other than 1 and 51.",
      ],
      isVerifiable: true,
      order: 4,
      nineWeeks: 1,
      bookRefs: [
        { title: "Big Fat Middle School Math Workbook", isbn: "9781523513581", chapters: [4, 5], unit: "Unit 1 — Number System", note: "Factors, primes, and composites" },
      ],
    },

    // ─── Strand 3: Whole-Number Operations (TEKS 5.3) ────────────────────
    {
      id: "5.op.1",
      tpiCode: "5.4E",
      name: "Order of Operations with Parentheses and Brackets",
      description:
        "Simplify numerical expressions involving whole numbers using the order of operations, including parentheses and brackets (no exponents). Evaluate innermost grouping symbols first.",
      gradeLevel: 5,
      strand: "Algebra",
      difficulty: 2,
      prerequisites: ["4.oa.1"],
      sampleProblems: [
        "Evaluate: 5 + 3 x (8 - 4).",
        "Simplify: [24 / (6 - 2)] + 7.",
        "What is the value of 40 - 2 x [3 + (6 / 2)]?",
      ],
      isVerifiable: true,
      order: 5,
      nineWeeks: 1,
      bookRefs: [
        { title: "Big Fat Middle School Math Workbook", isbn: "9781523513581", chapter: 31, unit: "Unit 3 — Expressions and Equations", note: "Order of operations" },
      ],
    },
    {
      id: "5.op.2",
      tpiCode: "5.3B",
      name: "Multi-Digit Whole-Number Multiplication",
      description:
        "Multiply with fluency a 3-digit number by a 2-digit number using the standard algorithm. Apply place-value understanding to record partial products and the final product correctly.",
      gradeLevel: 5,
      strand: "Number & Operations",
      difficulty: 2,
      prerequisites: ["4.nbt.5", "4.nbt.6"],
      sampleProblems: [
        "Solve using the standard algorithm: 327 x 48.",
        "A school orders 156 boxes of pencils. Each box contains 72 pencils. How many pencils are ordered in all?",
        "Multiply: 805 x 36.",
      ],
      isVerifiable: true,
      order: 6,
      nineWeeks: 1,
      bookRefs: [
        { title: "Big Fat Middle School Math Workbook", isbn: "9781523513581", chapters: [1, 3], unit: "Unit 1 — Number System", note: "Whole-number computation" },
      ],
    },
    {
      id: "5.op.3",
      tpiCode: "5.3C",
      name: "Whole-Number Long Division",
      description:
        "Solve with proficiency for quotients of up to a 4-digit dividend by a 2-digit divisor using the standard algorithm. Interpret remainders in the context of the problem.",
      gradeLevel: 5,
      strand: "Number & Operations",
      difficulty: 3,
      prerequisites: ["4.nbt.7", "5.op.2"],
      sampleProblems: [
        "Divide using long division: 4,872 / 24.",
        "A factory produces 6,300 cookies and packs them into boxes of 48. How many full boxes can be packed, and how many cookies are left over?",
        "Solve: 9,675 / 15.",
      ],
      isVerifiable: true,
      order: 7,
      nineWeeks: 1,
      bookRefs: [
        { title: "Big Fat Middle School Math Workbook", isbn: "9781523513581", chapters: [1, 3], unit: "Unit 1 — Number System" },
      ],
    },
    {
      id: "5.op.4",
      tpiCode: "5.3A",
      name: "Estimation Across the Four Operations",
      description:
        "Estimate to determine solutions to problems involving addition, subtraction, multiplication, or division of whole numbers using rounding and compatible numbers. Judge the reasonableness of computed answers.",
      gradeLevel: 5,
      strand: "Number & Operations",
      difficulty: 2,
      prerequisites: ["4.nbt.8", "5.op.2", "5.op.3"],
      sampleProblems: [
        "Estimate 4,872 + 6,219 by rounding each addend to the nearest thousand.",
        "Use compatible numbers to estimate 4,895 / 51.",
        "Is 396 x 27 closer to 8,000 or 12,000? Explain your estimation strategy.",
      ],
      isVerifiable: false,
      order: 8,
      nineWeeks: 1,
      bookRefs: [
        { title: "Big Fat Middle School Math Workbook", isbn: "9781523513581", chapters: [1, 3], unit: "Unit 1 — Number System" },
      ],
    },

    // ─── Strand 4: Decimal Operations (TEKS 5.3) ─────────────────────────
    {
      id: "5.dc.4",
      tpiCode: "5.3D",
      name: "Multiplying Decimals (Area Model and Algorithm)",
      description:
        "Represent and solve multiplication of decimals (to the hundredths) using objects, pictorial models including area models, and the standard algorithm. Count decimal places in factors to place the decimal point in the product.",
      gradeLevel: 5,
      strand: "Number & Operations",
      difficulty: 2,
      prerequisites: ["5.op.2", "5.dc.1"],
      sampleProblems: [
        "Use an area model to find 0.6 x 0.4. Shade a 10x10 grid to show the product.",
        "Multiply using the standard algorithm: 3.45 x 2.7.",
        "A piece of ribbon is 1.8 meters long. If 4.5 pieces of this length are needed, what total length of ribbon is required?",
      ],
      isVerifiable: true,
      order: 9,
      nineWeeks: 2,
      requiresImage: true,
      imageType: 'fraction-model',
      bookRefs: [
        { title: "Big Fat Middle School Math Workbook", isbn: "9781523513581", chapter: 9, unit: "Unit 1 — Number System", note: "Multiplying decimals" },
      ],
    },
    {
      id: "5.dc.5",
      tpiCode: "5.3F",
      name: "Dividing Decimals to the Hundredths",
      description:
        "Represent and solve division of decimals to the hundredths using objects, pictorial models, and the standard algorithm. Divide decimals by whole numbers and decimals by decimals.",
      gradeLevel: 5,
      strand: "Number & Operations",
      difficulty: 3,
      prerequisites: ["5.op.3", "5.dc.4"],
      sampleProblems: [
        "Divide: 7.56 / 4.",
        "A bag of rice weighing 12.6 pounds is split equally into 0.7-pound servings. How many servings are made?",
        "Solve: 0.96 / 0.04 using the standard algorithm.",
      ],
      isVerifiable: true,
      order: 10,
      nineWeeks: 2,
      requiresImage: true,
      imageType: 'fraction-model',
      bookRefs: [
        { title: "Big Fat Middle School Math Workbook", isbn: "9781523513581", chapter: 10, unit: "Unit 1 — Number System", note: "Dividing decimals" },
      ],
    },

    // ─── Strand 5: Fraction Operations (TEKS 5.3) ────────────────────────
    {
      id: "5.fr.1",
      tpiCode: "5.3H",
      name: "Adding and Subtracting Fractions with Unlike Denominators",
      description:
        "Add and subtract positive rational numbers (fractions and mixed numbers) fluently using a common denominator. Simplify answers to lowest terms when appropriate.",
      gradeLevel: 5,
      strand: "Number & Operations",
      difficulty: 2,
      prerequisites: ["4.nf.1", "4.nf.3"],
      sampleProblems: [
        "Solve: 2/3 + 1/4.",
        "Subtract: 5/6 - 3/8.",
        "Mia ran 1 1/2 miles on Monday and 2 3/4 miles on Tuesday. How far did she run in all?",
      ],
      isVerifiable: true,
      order: 11,
      nineWeeks: 2,
      bookRefs: [
        { title: "Big Fat Middle School Math Workbook", isbn: "9781523513581", chapter: 6, unit: "Unit 1 — Number System", note: "Fraction basics — add/subtract" },
      ],
    },
    {
      id: "5.fr.2",
      tpiCode: "5.3I",
      name: "Multiplying a Whole Number by a Fraction (Area Model)",
      description:
        "Represent and solve multiplication of a whole number and a fraction (including mixed numbers) using objects, pictorial models including area models, and equations. Connect the model to the standard procedure.",
      gradeLevel: 5,
      strand: "Number & Operations",
      difficulty: 2,
      prerequisites: ["4.nf.1", "5.fr.1"],
      sampleProblems: [
        "Use an area model to find 4 x 2/3. What is the product?",
        "Multiply: 6 x 3/8. Express your answer as a mixed number in simplest form.",
        "A recipe calls for 2/5 cup of oil for one batch. How much oil is needed for 7 batches?",
      ],
      isVerifiable: true,
      order: 12,
      nineWeeks: 2,
      requiresImage: true,
      imageType: 'fraction-model',
      bookRefs: [
        { title: "Big Fat Middle School Math Workbook", isbn: "9781523513581", chapter: 7, unit: "Unit 1 — Number System", note: "Multiplying fractions" },
      ],
    },
    {
      id: "5.fr.3",
      tpiCode: "5.3J",
      name: "Dividing a Whole Number by a Unit Fraction",
      description:
        "Represent division of a whole number by a unit fraction using objects, pictorial models including area models and tape diagrams, and equations. Interpret the quotient as the number of equal groups that fit inside the whole.",
      gradeLevel: 5,
      strand: "Number & Operations",
      difficulty: 3,
      prerequisites: ["5.fr.2"],
      sampleProblems: [
        "Use a model to find 4 / (1/3). How many one-third pieces are in 4 wholes?",
        "Mrs. Lee has 6 feet of yarn. She cuts it into pieces 1/4 foot long. How many pieces does she make?",
        "Solve: 8 / (1/5). Draw a tape diagram to justify your answer.",
      ],
      isVerifiable: true,
      order: 13,
      nineWeeks: 2,
      requiresImage: true,
      imageType: 'fraction-model',
      bookRefs: [
        { title: "Big Fat Middle School Math Workbook", isbn: "9781523513581", chapter: 7, unit: "Unit 1 — Number System", note: "Dividing fractions" },
      ],
    },
    {
      id: "5.fr.4",
      tpiCode: "5.3L",
      name: "Dividing a Unit Fraction by a Whole Number",
      description:
        "Represent division of a unit fraction by a whole number using objects, pictorial models, and equations. Interpret the quotient as splitting the unit fraction into equal parts.",
      gradeLevel: 5,
      strand: "Number & Operations",
      difficulty: 3,
      prerequisites: ["5.fr.2", "5.fr.3"],
      sampleProblems: [
        "Solve: (1/4) / 3. Use a model to show the result.",
        "A 1/2 pound block of cheese is shared equally among 5 people. How much cheese does each person get?",
        "Find (1/6) / 2 and draw a fraction model to justify the answer.",
      ],
      isVerifiable: true,
      order: 14,
      nineWeeks: 2,
      requiresImage: true,
      imageType: 'fraction-model',
      bookRefs: [
        { title: "Big Fat Middle School Math Workbook", isbn: "9781523513581", chapter: 7, unit: "Unit 1 — Number System", note: "Dividing fractions" },
      ],
    },
    {
      id: "5.fr.5",
      tpiCode: "5.3K",
      name: "One- and Two-Step Problems with Rational Numbers",
      description:
        "Solve real-world one- and two-step problems involving addition, subtraction, multiplication, or division of decimals and fractions. Choose appropriate operations and verify reasonableness of answers.",
      gradeLevel: 5,
      strand: "Number & Operations",
      difficulty: 3,
      prerequisites: ["5.dc.4", "5.dc.5", "5.fr.1"],
      sampleProblems: [
        "Owen bought 3 books for $7.95 each and a notebook for $4.50. How much did he spend in total?",
        "A jug holds 4 1/2 liters of juice. After pouring out 1 3/4 liters at lunch and 1 1/8 liters at dinner, how much juice remains?",
        "A truck travels 246.5 miles using 11.5 gallons of gas. How many miles per gallon does it get?",
      ],
      isVerifiable: true,
      order: 15,
      nineWeeks: 2,
      bookRefs: [
        { title: "Big Fat Middle School Math Workbook", isbn: "9781523513581", chapters: [6, 10], unit: "Unit 1 — Number System", note: "Mixed fraction and decimal applications" },
      ],
    },

    // ─── Strand 6: Patterns, Expressions & Equations (TEKS 5.4) ──────────
    {
      id: "5.pa.1",
      tpiCode: "5.4B",
      name: "Identifying Patterns and Writing Rules",
      description:
        "Describe the meaning of a rule for a numerical pattern and represent it with a verbal description or an expression. Use the rule to extend the pattern.",
      gradeLevel: 5,
      strand: "Algebra",
      difficulty: 1,
      prerequisites: ["4.oa.3"],
      sampleProblems: [
        "Describe the rule for the pattern: 4, 9, 14, 19, 24, ... What is the next term?",
        "The pattern 2, 6, 18, 54, ... follows what rule? Find the 6th term.",
        "Given the rule 'multiply by 3, then subtract 1,' start at 2 and list the next four terms.",
      ],
      isVerifiable: true,
      order: 16,
      nineWeeks: 2,
      bookRefs: [
        { title: "Big Fat Middle School Math Workbook", isbn: "9781523513581", chapters: [35, 37], unit: "Unit 3 — Expressions and Equations", note: "Patterns and rules" },
      ],
    },
    {
      id: "5.pa.2",
      tpiCode: "5.4C",
      name: "Generating Patterns from y = ax and y = x + a",
      description:
        "Generate a numerical pattern when given a rule in the form y = ax or y = x + a and graph the ordered pairs on a coordinate plane. Recognize the relationship between the rule and the resulting pattern.",
      gradeLevel: 5,
      strand: "Algebra",
      difficulty: 2,
      prerequisites: ["5.pa.1"],
      sampleProblems: [
        "Use the rule y = 3x to complete the table for x = 1, 2, 3, 4, 5. Plot the ordered pairs on a coordinate plane.",
        "Generate ordered pairs for the rule y = x + 4 using x = 0, 1, 2, 3, 4, then graph them.",
        "Compare the graphs of y = 2x and y = x + 2. How are the patterns alike and different?",
      ],
      isVerifiable: true,
      order: 17,
      nineWeeks: 2,
      requiresImage: true,
      imageType: 'coordinate-plane',
      bookRefs: [
        { title: "Big Fat Middle School Math Workbook", isbn: "9781523513581", chapters: [57, 58], unit: "Unit 6 — Coordinate Plane and Functions" },
      ],
    },
    {
      id: "5.al.1",
      tpiCode: "5.4B",
      name: "Equations as Statements of Equality with a Variable",
      description:
        "Recognize the difference between an expression and an equation, and understand that an equation is a statement of equality. Use a variable to represent an unknown and identify values that make the equation true.",
      gradeLevel: 5,
      strand: "Algebra",
      difficulty: 1,
      prerequisites: ["4.oa.2"],
      sampleProblems: [
        "Which of the following is an equation: 4 + n, 4 + n = 9, n - 2? Explain.",
        "Find the value of m that makes the equation true: m + 7 = 15.",
        "Write an equation for: 'Five times a number equals 40.' Then find the number.",
      ],
      isVerifiable: true,
      order: 18,
      nineWeeks: 2,
      bookRefs: [
        { title: "Big Fat Middle School Math Workbook", isbn: "9781523513581", chapters: [31, 36], unit: "Unit 3 — Expressions and Equations" },
      ],
    },
    {
      id: "5.al.2",
      tpiCode: "5.4F",
      name: "Simplifying Expressions with Order of Operations",
      description:
        "Simplify numerical expressions that do not involve exponents, including up to two levels of grouping (parentheses and brackets), applying the conventional order of operations.",
      gradeLevel: 5,
      strand: "Algebra",
      difficulty: 2,
      prerequisites: ["5.op.1"],
      sampleProblems: [
        "Simplify: 6 + [2 x (8 - 3)] - 4.",
        "Evaluate: 36 / (3 + 3) + 2 x 5.",
        "What is the value of [(15 - 9) x 4] / 3?",
      ],
      isVerifiable: true,
      order: 19,
      nineWeeks: 2,
      bookRefs: [
        { title: "Big Fat Middle School Math Workbook", isbn: "9781523513581", chapters: [27, 31], unit: "Unit 3 — Expressions and Equations" },
      ],
    },
  ],
};
