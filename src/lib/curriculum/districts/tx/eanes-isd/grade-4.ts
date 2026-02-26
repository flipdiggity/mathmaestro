import { GradeCurriculum } from '../../../types';

export const grade4Curriculum: GradeCurriculum = {
  grade: 4,
  label: "4th Grade Mathematics",
  topics: [
    // ─── Strand 1: Number & Operations ──────────────────────────────
    {
      id: "4.nbt.1",
      tpiCode: "4.2A",
      name: "Place Value to 1,000,000,000",
      description:
        "Interpret the value of each place-value position as 10 times the position to the right and as one-tenth of the value of the place to its left, through the billions place.",
      gradeLevel: 4,
      strand: "Number & Operations",
      difficulty: 1,
      prerequisites: ["3.nbt.1"],
      sampleProblems: [
        "What is the value of the digit 7 in 3,741,568,200?",
        "Write 600,000,000 + 40,000,000 + 5,000 + 300 + 2 in standard form.",
        "How many times greater is the value of the 5 in 5,400,000 than the value of the 5 in 654,000?",
      ],
      isVerifiable: true,
      order: 1,
    },
    {
      id: "4.nbt.2",
      tpiCode: "4.2B",
      name: "Comparing & Ordering Large Numbers",
      description:
        "Represent, compare, and order whole numbers to 1,000,000,000 using place-value understanding, number lines, and symbols (>, <, =).",
      gradeLevel: 4,
      strand: "Number & Operations",
      difficulty: 1,
      prerequisites: ["3.nbt.1", "4.nbt.1"],
      sampleProblems: [
        "Order from least to greatest: 45,678,210; 45,768,210; 45,677,210.",
        "Compare using >, <, or =: 892,451,000 ___ 892,541,000.",
      ],
      isVerifiable: true,
      order: 2,
    },
    {
      id: "4.nbt.3",
      tpiCode: "4.2C",
      name: "Rounding Whole Numbers",
      description:
        "Round whole numbers to a given place value through the hundred-thousands place.",
      gradeLevel: 4,
      strand: "Number & Operations",
      difficulty: 1,
      prerequisites: ["3.nbt.2", "4.nbt.1"],
      sampleProblems: [
        "Round 4,738,291 to the nearest hundred-thousand.",
        "A city has a population of 862,549. Round to the nearest ten-thousand.",
        "Round 3,495,812 to the nearest million.",
      ],
      isVerifiable: true,
      order: 3,
    },
    {
      id: "4.nbt.4",
      tpiCode: "4.4A",
      name: "Addition & Subtraction to 1,000,000",
      description:
        "Add and subtract whole numbers up to 1,000,000 using standard algorithms and properties of operations.",
      gradeLevel: 4,
      strand: "Number & Operations",
      difficulty: 1,
      prerequisites: ["3.nbt.3"],
      sampleProblems: [
        "Solve: 548,372 + 376,459 = ?",
        "A school district has 214,856 students. If 37,492 students graduate, how many students remain?",
      ],
      isVerifiable: true,
      order: 4,
    },
    {
      id: "4.nbt.5",
      tpiCode: "4.4B",
      name: "Multiply up to 4-Digit by 1-Digit",
      description:
        "Multiply a whole number of up to four digits by a one-digit whole number using strategies including the standard algorithm and partial products.",
      gradeLevel: 4,
      strand: "Number & Operations",
      difficulty: 2,
      prerequisites: ["3.nbt.4"],
      sampleProblems: [
        "Solve: 2,345 x 7 = ?",
        "A factory produces 1,248 widgets per day. How many widgets are produced in 6 days?",
        "Use partial products to solve 4,063 x 8.",
      ],
      isVerifiable: true,
      order: 5,
    },
    {
      id: "4.nbt.6",
      tpiCode: "4.4C",
      name: "Multiply 2-Digit by 2-Digit",
      description:
        "Multiply two two-digit numbers using strategies including the standard algorithm, area models, and partial products.",
      gradeLevel: 4,
      strand: "Number & Operations",
      difficulty: 2,
      prerequisites: ["3.nbt.4", "4.nbt.5"],
      sampleProblems: [
        "Solve: 43 x 27 = ?",
        "A parking lot has 36 rows with 24 spaces in each row. How many total parking spaces are there?",
        "Use an area model to find 58 x 14.",
      ],
      isVerifiable: true,
      order: 6,
    },
    {
      id: "4.nbt.7",
      tpiCode: "4.4F",
      name: "Divide up to 4-Digit by 1-Digit",
      description:
        "Use strategies and algorithms, including the standard algorithm, to divide up to a four-digit dividend by a one-digit divisor, with and without remainders.",
      gradeLevel: 4,
      strand: "Number & Operations",
      difficulty: 3,
      prerequisites: ["3.nbt.5", "4.nbt.5"],
      sampleProblems: [
        "Solve: 3,672 / 8 = ?",
        "A teacher has 1,575 stickers to share equally among 5 classes. How many stickers does each class get?",
        "Solve: 2,947 / 6 = ? Express remainder if any.",
      ],
      isVerifiable: true,
      order: 7,
    },
    {
      id: "4.nbt.8",
      tpiCode: "4.4G",
      name: "Estimation Strategies",
      description:
        "Round to the nearest 10, 100, or 1,000 or use compatible numbers to estimate solutions involving whole-number operations.",
      gradeLevel: 4,
      strand: "Number & Operations",
      difficulty: 2,
      prerequisites: ["4.nbt.3", "4.nbt.4"],
      sampleProblems: [
        "Estimate the product of 48 x 31 by rounding each factor to the nearest ten.",
        "Is 4,872 / 8 closer to 500 or 600? Use estimation to decide.",
        "A store sold items for $389, $612, and $245. Estimate the total by rounding to the nearest hundred.",
      ],
      isVerifiable: false,
      order: 8,
    },

    // ─── Strand 2: Fractions & Decimals ─────────────────────────────
    {
      id: "4.nf.1",
      tpiCode: "4.3A",
      name: "Equivalent Fractions",
      description:
        "Represent and determine equivalent fractions with denominators of 2, 3, 4, 6, 8, 10, and 12 using models, number lines, and reasoning.",
      gradeLevel: 4,
      strand: "Fractions & Decimals",
      difficulty: 2,
      prerequisites: ["3.nf.1"],
      sampleProblems: [
        "Name two fractions equivalent to 2/4.",
        "Are 3/6 and 4/8 equivalent? Explain using a model.",
        "Find the missing numerator: 3/4 = ?/12.",
      ],
      isVerifiable: true,
      order: 9,
    },
    {
      id: "4.nf.2",
      tpiCode: "4.3B",
      name: "Comparing Fractions",
      description:
        "Compare two fractions with different numerators and different denominators using benchmarks (0, 1/2, 1), common denominators, or common numerators.",
      gradeLevel: 4,
      strand: "Fractions & Decimals",
      difficulty: 2,
      prerequisites: ["3.nf.2", "4.nf.1"],
      sampleProblems: [
        "Compare 3/8 and 5/12. Which is greater?",
        "Order from least to greatest: 2/3, 1/4, 5/6.",
      ],
      isVerifiable: true,
      order: 10,
    },
    {
      id: "4.nf.3",
      tpiCode: "4.3E",
      name: "Adding & Subtracting Fractions (Like Denominators)",
      description:
        "Represent and solve addition and subtraction of fractions with equal denominators using objects, pictorial models (including strip diagrams), and equations.",
      gradeLevel: 4,
      strand: "Fractions & Decimals",
      difficulty: 2,
      prerequisites: ["3.nf.1", "4.nf.1"],
      sampleProblems: [
        "Solve: 3/8 + 4/8 = ?",
        "Maria ate 2/6 of a pizza and Liam ate 3/6. How much did they eat together?",
        "Solve: 7/10 - 3/10 = ?",
      ],
      isVerifiable: true,
      order: 11,
    },
    {
      id: "4.nf.4",
      tpiCode: "4.2G",
      name: "Relating Decimals to Fractions (Tenths & Hundredths)",
      description:
        "Relate decimals to fractions that name tenths and hundredths using concrete objects and pictorial models.",
      gradeLevel: 4,
      strand: "Fractions & Decimals",
      difficulty: 2,
      prerequisites: ["4.nf.1"],
      sampleProblems: [
        "Write 0.35 as a fraction.",
        "Write 7/10 as a decimal.",
        "Shade a hundredths grid to represent 0.48 and write the equivalent fraction.",
      ],
      isVerifiable: true,
      order: 12,
    },
    {
      id: "4.nf.5",
      tpiCode: "4.2H",
      name: "Comparing & Ordering Decimals",
      description:
        "Compare and order decimals through hundredths using place-value understanding, models, and number lines.",
      gradeLevel: 4,
      strand: "Fractions & Decimals",
      difficulty: 2,
      prerequisites: ["4.nf.4", "4.nbt.2"],
      sampleProblems: [
        "Compare 0.6 and 0.58. Which is greater?",
        "Order from least to greatest: 0.45, 0.4, 0.54.",
      ],
      isVerifiable: true,
      order: 13,
    },

    // ─── Strand 3: Algebraic Reasoning ──────────────────────────────
    {
      id: "4.oa.1",
      tpiCode: "4.5A",
      name: "Multi-Step Problem Solving",
      description:
        "Represent multi-step problems involving the four operations with whole numbers using strip diagrams and equations with a letter standing for the unknown quantity.",
      gradeLevel: 4,
      strand: "Algebraic Reasoning",
      difficulty: 3,
      prerequisites: ["3.oa.1", "4.nbt.4", "4.nbt.5"],
      sampleProblems: [
        "Sam earned $12 per hour for 8 hours and spent $34 on supplies. Write an equation and solve for the amount remaining.",
        "A baker made 240 cookies. She packed them equally into 8 boxes, then gave away 3 boxes. How many cookies did she give away?",
      ],
      isVerifiable: true,
      order: 14,
    },
    {
      id: "4.oa.2",
      tpiCode: "4.5B",
      name: "Equations with Unknowns",
      description:
        "Represent problems using an equation with a letter standing for the unknown and solve one-step and multi-step equations.",
      gradeLevel: 4,
      strand: "Algebraic Reasoning",
      difficulty: 2,
      prerequisites: ["3.oa.2", "4.oa.1"],
      sampleProblems: [
        "Solve: 7 x n = 84.",
        "If 325 + m = 900, what is the value of m?",
        "Write and solve an equation: A number divided by 9 equals 12.",
      ],
      isVerifiable: true,
      order: 15,
    },
    {
      id: "4.oa.3",
      tpiCode: "4.5C",
      name: "Number Patterns & Input-Output Tables",
      description:
        "Use models, including input-output tables, to identify, describe, and generate number patterns that follow a given rule, including patterns using multiplication.",
      gradeLevel: 4,
      strand: "Algebraic Reasoning",
      difficulty: 2,
      prerequisites: ["3.oa.3"],
      sampleProblems: [
        "Complete the pattern: 5, 15, 45, 135, ___. Describe the rule.",
        "An input-output table has the rule 'multiply by 6, then subtract 2.' If the input is 7, what is the output?",
        "Find the rule: Input: 3, 5, 8, 10 -> Output: 11, 19, 31, 39.",
      ],
      isVerifiable: true,
      order: 16,
    },

    // ─── Strand 4: Geometry ─────────────────────────────────────────
    {
      id: "4.g.1",
      tpiCode: "4.6A",
      name: "Points, Lines, Rays & Angles",
      description:
        "Identify points, lines, line segments, rays, and angles, including acute, right, obtuse, and straight angles.",
      gradeLevel: 4,
      strand: "Geometry",
      difficulty: 1,
      prerequisites: ["3.g.1"],
      sampleProblems: [
        "Name two rays that form an obtuse angle in the figure shown.",
        "Classify the angle that measures 135 degrees.",
        "How is a line segment different from a ray?",
      ],
      isVerifiable: false,
      order: 17,
    },
    {
      id: "4.g.2",
      tpiCode: "4.6C",
      name: "Measuring Angles with a Protractor",
      description:
        "Apply knowledge of right angles to determine if angles are equal to, less than, or greater than 90 degrees, and use a protractor to measure angles.",
      gradeLevel: 4,
      strand: "Geometry",
      difficulty: 2,
      prerequisites: ["4.g.1"],
      sampleProblems: [
        "Use a protractor to measure an angle. You read 65 degrees. Is this acute, right, or obtuse?",
        "Two angles together form a straight line. One measures 115 degrees. What is the measure of the other?",
      ],
      isVerifiable: true,
      order: 18,
    },
    {
      id: "4.g.3",
      tpiCode: "4.6B",
      name: "Parallel & Perpendicular Lines and Symmetry",
      description:
        "Identify and draw parallel and perpendicular lines, and determine lines of symmetry in two-dimensional figures.",
      gradeLevel: 4,
      strand: "Geometry",
      difficulty: 2,
      prerequisites: ["3.g.1", "4.g.1"],
      sampleProblems: [
        "Draw a pair of perpendicular lines and a pair of parallel lines. Label them.",
        "How many lines of symmetry does a regular hexagon have?",
        "Identify all pairs of parallel sides in a rectangle.",
      ],
      isVerifiable: false,
      order: 19,
    },

    // ─── Strand 5: Measurement ──────────────────────────────────────
    {
      id: "4.md.1",
      tpiCode: "4.8A",
      name: "Customary & Metric Conversions",
      description:
        "Identify relative sizes of measurement units within the customary and metric systems and convert measurements within the same system (larger to smaller).",
      gradeLevel: 4,
      strand: "Measurement",
      difficulty: 2,
      prerequisites: ["3.md.1"],
      sampleProblems: [
        "Convert 5 feet to inches.",
        "How many milliliters are in 3 liters?",
        "A table is 2 meters long. How many centimeters is that?",
      ],
      isVerifiable: true,
      order: 20,
    },
    {
      id: "4.md.2",
      tpiCode: "4.5D",
      name: "Perimeter & Area of Rectangles",
      description:
        "Solve problems related to perimeter and area of rectangles, including finding an unknown side length given perimeter or area.",
      gradeLevel: 4,
      strand: "Measurement",
      difficulty: 2,
      prerequisites: ["3.md.2", "4.oa.2"],
      sampleProblems: [
        "A rectangle has a length of 14 cm and a width of 9 cm. Find its perimeter and area.",
        "A garden has an area of 72 square feet and a width of 8 feet. What is the length?",
        "The perimeter of a square playground is 200 meters. What is the length of one side?",
      ],
      isVerifiable: true,
      order: 21,
    },
    {
      id: "4.md.3",
      tpiCode: "4.8C",
      name: "Elapsed Time & Unit Conversions",
      description:
        "Solve problems involving elapsed time and conversions between hours, minutes, and seconds.",
      gradeLevel: 4,
      strand: "Measurement",
      difficulty: 2,
      prerequisites: ["3.md.3"],
      sampleProblems: [
        "A movie starts at 2:45 PM and is 1 hour 50 minutes long. What time does it end?",
        "How many seconds are in 3 minutes and 20 seconds?",
        "Recess started at 10:15 AM and ended at 10:50 AM. How many minutes was recess?",
      ],
      isVerifiable: true,
      order: 22,
    },

    // ─── Strand 6: Data Analysis ────────────────────────────────────
    {
      id: "4.da.1",
      tpiCode: "4.9A",
      name: "Frequency Tables & Dot Plots",
      description:
        "Represent data on a frequency table, dot plot, or stem-and-leaf plot marked with whole numbers and fractions.",
      gradeLevel: 4,
      strand: "Data Analysis",
      difficulty: 1,
      prerequisites: ["3.da.1"],
      sampleProblems: [
        "Students measured their pencil lengths: 12 cm, 15 cm, 12 cm, 14 cm, 15 cm, 12 cm, 13 cm. Create a frequency table.",
        "Using the dot plot shown, how many students scored between 80 and 90 on the test?",
      ],
      isVerifiable: false,
      order: 23,
    },
    {
      id: "4.da.2",
      tpiCode: "4.9B",
      name: "Problem Solving with Data",
      description:
        "Solve one- and two-step problems using data in whole-number, decimal, and fraction form from frequency tables, dot plots, and stem-and-leaf plots.",
      gradeLevel: 4,
      strand: "Data Analysis",
      difficulty: 2,
      prerequisites: ["4.da.1", "4.nbt.4"],
      sampleProblems: [
        "A stem-and-leaf plot shows the following test scores: Stem 7 | Leaves 2, 5, 8; Stem 8 | Leaves 0, 3, 3, 7; Stem 9 | Leaves 1, 5. What is the median score?",
        "Using the frequency table of daily temperatures for a week, find the difference between the highest and lowest temperatures recorded.",
        "A dot plot shows the number of books students read in January. If 24 students are represented, and the most common value is 3 books, how many students read exactly 3 books if 8 dots appear above that value?",
      ],
      isVerifiable: true,
      order: 24,
    },
  ],
};
