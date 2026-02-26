import type { GradeCurriculum } from '../../../types';

const grade3: GradeCurriculum = {
  grade: 3,
  label: '3rd Grade Math — Eanes ISD (TEKS-Aligned)',
  topics: [
    // ─────────────────────────────────────────────
    // Strand: Number & Operations
    // ─────────────────────────────────────────────
    {
      id: '3.nbt.1',
      tpiCode: '3.2A',
      name: 'Place Value to 100,000',
      description:
        'Compose and decompose numbers up to 100,000 using objects, pictorial models, and numerals. Understand the value of each digit in the ones through ten-thousands place.',
      gradeLevel: 3,
      strand: 'Number & Operations',
      difficulty: 1,
      prerequisites: [],
      sampleProblems: [
        'What is the value of the digit 7 in the number 47,382?',
        'Write 60,000 + 3,000 + 200 + 50 + 1 in standard form.',
        'Which number has a 5 in the thousands place: 52,146 or 35,821?',
      ],
      isVerifiable: true,
      order: 1,
    },
    {
      id: '3.nbt.2',
      tpiCode: '3.2B',
      name: 'Compare and Order Whole Numbers',
      description:
        'Compare and order whole numbers up to 100,000 and represent comparisons using the symbols >, <, or =.',
      gradeLevel: 3,
      strand: 'Number & Operations',
      difficulty: 1,
      prerequisites: ['3.nbt.1'],
      sampleProblems: [
        'Use >, <, or = to compare 34,512 and 34,521.',
        'Order these numbers from least to greatest: 78,100; 71,800; 78,010.',
      ],
      isVerifiable: true,
      order: 2,
    },
    {
      id: '3.nbt.3',
      tpiCode: '3.4A',
      name: 'Addition with Regrouping',
      description:
        'Solve with fluency one-step and two-step addition problems within 1,000 using strategies based on place value, properties of operations, and the relationship between addition and subtraction.',
      gradeLevel: 3,
      strand: 'Number & Operations',
      difficulty: 2,
      prerequisites: ['3.nbt.1'],
      sampleProblems: [
        'Find the sum: 467 + 358.',
        'A library has 284 fiction books and 539 non-fiction books. How many books are there in all?',
        'What is 1,000 - 467? Use addition to check your answer.',
      ],
      isVerifiable: true,
      order: 3,
    },
    {
      id: '3.nbt.4',
      tpiCode: '3.4B',
      name: 'Subtraction with Regrouping',
      description:
        'Round to the nearest 10 or 100 to reasonably estimate solutions to addition and subtraction problems, and solve subtraction problems within 1,000 that require regrouping across zeros.',
      gradeLevel: 3,
      strand: 'Number & Operations',
      difficulty: 2,
      prerequisites: ['3.nbt.1', '3.nbt.3'],
      sampleProblems: [
        'Find the difference: 803 - 467.',
        'Estimate 692 - 215 by rounding each number to the nearest hundred. Then find the exact answer.',
      ],
      isVerifiable: true,
      order: 4,
    },
    {
      id: '3.nbt.5',
      tpiCode: '3.4F',
      name: 'Multiplication Facts (0-10)',
      description:
        'Recall facts to multiply up to 10 by 10 with automaticity and recall the corresponding division facts. Use strategies such as doubling, skip counting, arrays, and area models.',
      gradeLevel: 3,
      strand: 'Number & Operations',
      difficulty: 2,
      prerequisites: ['3.nbt.3'],
      sampleProblems: [
        'What is 7 x 8?',
        'Maria arranged chairs in 6 rows of 9. How many chairs did she use?',
        'Fill in the blank: 4 x ___ = 36.',
      ],
      isVerifiable: true,
      order: 5,
    },
    {
      id: '3.nbt.6',
      tpiCode: '3.4H',
      name: 'Division Facts',
      description:
        'Determine the number of objects in each group or the number of groups when given a set of objects and use divisibility rules. Relate division to multiplication using fact families.',
      gradeLevel: 3,
      strand: 'Number & Operations',
      difficulty: 2,
      prerequisites: ['3.nbt.5'],
      sampleProblems: [
        'What is 54 / 6?',
        'There are 32 students split equally into 4 teams. How many students are on each team?',
        'Write the fact family for 3, 7, and 21.',
      ],
      isVerifiable: true,
      order: 6,
    },
    {
      id: '3.nbt.7',
      tpiCode: '3.4G',
      name: 'Estimation and Rounding',
      description:
        'Use strategies including rounding to the nearest 10 or 100 to estimate solutions and determine the reasonableness of answers to addition, subtraction, and multiplication problems.',
      gradeLevel: 3,
      strand: 'Number & Operations',
      difficulty: 1,
      prerequisites: ['3.nbt.1'],
      sampleProblems: [
        'Round 467 to the nearest hundred.',
        'Estimate the product of 8 x 42 by rounding 42 to the nearest ten.',
        'Sam says 312 + 589 is about 800. Is his estimate reasonable? Explain.',
      ],
      isVerifiable: true,
      order: 7,
    },

    // ─────────────────────────────────────────────
    // Strand: Fractions
    // ─────────────────────────────────────────────
    {
      id: '3.frac.1',
      tpiCode: '3.3A',
      name: 'Fractions on a Number Line',
      description:
        'Represent fractions greater than zero and less than or equal to one with denominators of 2, 3, 4, 6, and 8 using concrete objects and pictorial models, including strip diagrams and number lines.',
      gradeLevel: 3,
      strand: 'Fractions',
      difficulty: 2,
      prerequisites: ['3.nbt.1'],
      sampleProblems: [
        'Place 3/4 on a number line from 0 to 1.',
        'What fraction does the point on this number line represent if the line is divided into 6 equal parts and the point is on the 4th mark?',
      ],
      isVerifiable: true,
      order: 8,
    },
    {
      id: '3.frac.2',
      tpiCode: '3.3H',
      name: 'Comparing Fractions',
      description:
        'Compare two fractions having the same numerator or denominator in problems by reasoning about their sizes and justifying the conclusion using symbols, words, objects, and pictorial models.',
      gradeLevel: 3,
      strand: 'Fractions',
      difficulty: 2,
      prerequisites: ['3.frac.1'],
      sampleProblems: [
        'Which is greater, 2/3 or 2/6? Use >, <, or = to compare.',
        'Emma ate 3/8 of a pizza and Jake ate 5/8. Who ate more? Explain how you know.',
      ],
      isVerifiable: true,
      order: 9,
    },
    {
      id: '3.frac.3',
      tpiCode: '3.3F',
      name: 'Equivalent Fractions with Models',
      description:
        'Represent equivalent fractions with denominators of 2, 3, 4, 6, and 8 using a variety of objects and pictorial models, including number lines. Explain why two fractions are equivalent.',
      gradeLevel: 3,
      strand: 'Fractions',
      difficulty: 3,
      prerequisites: ['3.frac.1', '3.frac.2'],
      sampleProblems: [
        'Use a model to show that 1/2 and 3/6 are equivalent fractions.',
        'Name a fraction equivalent to 2/4. Draw a picture to prove it.',
        'Are 2/3 and 4/6 equivalent? Use a number line to explain.',
      ],
      isVerifiable: true,
      order: 10,
    },

    // ─────────────────────────────────────────────
    // Strand: Algebraic Reasoning
    // ─────────────────────────────────────────────
    {
      id: '3.alg.1',
      tpiCode: '3.5A',
      name: 'Number Patterns',
      description:
        'Represent and describe one-step and two-step problems involving addition and subtraction of whole numbers to 1,000 using number patterns, and identify arithmetic patterns including those in the addition and multiplication tables.',
      gradeLevel: 3,
      strand: 'Algebraic Reasoning',
      difficulty: 1,
      prerequisites: ['3.nbt.3', '3.nbt.5'],
      sampleProblems: [
        'What are the next three numbers in the pattern: 4, 8, 12, 16, ___?',
        'Describe the rule for the pattern: 100, 85, 70, 55, ...',
      ],
      isVerifiable: true,
      order: 11,
    },
    {
      id: '3.alg.2',
      tpiCode: '3.5B',
      name: 'Input-Output Tables',
      description:
        'Represent real-world relationships using input-output tables and numerical expressions. Determine the rule that generates an output from a given input in a function table.',
      gradeLevel: 3,
      strand: 'Algebraic Reasoning',
      difficulty: 2,
      prerequisites: ['3.alg.1', '3.nbt.5'],
      sampleProblems: [
        'If the rule is "multiply by 3 then add 1," what is the output when the input is 5?',
        'Find the rule: Input 2 -> Output 6, Input 4 -> Output 12, Input 7 -> Output 21.',
      ],
      isVerifiable: true,
      order: 12,
    },
    {
      id: '3.alg.3',
      tpiCode: '3.5D',
      name: 'Equations with Unknowns',
      description:
        'Determine the unknown whole number in a multiplication or division equation relating three whole numbers. Use the relationship between multiplication and division to solve.',
      gradeLevel: 3,
      strand: 'Algebraic Reasoning',
      difficulty: 3,
      prerequisites: ['3.nbt.5', '3.nbt.6'],
      sampleProblems: [
        'Find the missing number: ___ x 6 = 42.',
        'Solve for n: 56 / n = 8.',
        'If 9 x p = 72, what is the value of p?',
      ],
      isVerifiable: true,
      order: 13,
    },

    // ─────────────────────────────────────────────
    // Strand: Geometry
    // ─────────────────────────────────────────────
    {
      id: '3.geo.1',
      tpiCode: '3.6A',
      name: 'Classifying 2D Shapes',
      description:
        'Classify and sort two- and three-dimensional figures, including cones, cylinders, spheres, triangular and rectangular prisms, and cubes, based on attributes using formal geometric language.',
      gradeLevel: 3,
      strand: 'Geometry',
      difficulty: 1,
      prerequisites: [],
      sampleProblems: [
        'How is a square different from a rectangle? How are they the same?',
        'Name a shape that has exactly 3 sides and 3 angles.',
      ],
      isVerifiable: false,
      order: 14,
    },
    {
      id: '3.geo.2',
      tpiCode: '3.6B',
      name: 'Decomposing Shapes and Area',
      description:
        'Determine the area of rectangles with whole number side lengths in problems using multiplication related to the number of rows times the number of unit squares in each row. Decompose composite figures into rectangles to find area.',
      gradeLevel: 3,
      strand: 'Geometry',
      difficulty: 2,
      prerequisites: ['3.geo.1', '3.nbt.5'],
      sampleProblems: [
        'A rectangle is 7 units long and 4 units wide. What is its area?',
        'An L-shaped figure can be split into two rectangles: one is 3x5 and the other is 2x4. What is the total area?',
        'How many unit squares fit inside a rectangle that is 9 units by 3 units?',
      ],
      isVerifiable: true,
      order: 15,
    },
    {
      id: '3.geo.3',
      tpiCode: '3.7B',
      name: 'Perimeter',
      description:
        'Determine the perimeter of a polygon or a missing length when given the perimeter and remaining side lengths. Solve real-world problems involving perimeter of regular and irregular shapes.',
      gradeLevel: 3,
      strand: 'Geometry',
      difficulty: 2,
      prerequisites: ['3.nbt.3', '3.geo.1'],
      sampleProblems: [
        'A rectangle has a length of 12 cm and a width of 5 cm. What is its perimeter?',
        'A triangle has a perimeter of 36 inches. Two sides are 10 inches and 14 inches. How long is the third side?',
      ],
      isVerifiable: true,
      order: 16,
    },

    // ─────────────────────────────────────────────
    // Strand: Measurement
    // ─────────────────────────────────────────────
    {
      id: '3.meas.1',
      tpiCode: '3.7A',
      name: 'Customary and Metric Units',
      description:
        'Determine liquid volume (capacity) or weight/mass using appropriate units and tools including graduated cylinders, beakers, measuring cups, scales, and balances. Know relative sizes of measurement units.',
      gradeLevel: 3,
      strand: 'Measurement',
      difficulty: 1,
      prerequisites: [],
      sampleProblems: [
        'Which unit would you use to measure the weight of a dog: ounces, pounds, or tons?',
        'How many cups are in a pint?',
      ],
      isVerifiable: true,
      order: 17,
    },
    {
      id: '3.meas.2',
      tpiCode: '3.7C',
      name: 'Time to the Nearest Minute and Elapsed Time',
      description:
        'Determine the solutions to problems involving addition and subtraction of time intervals in minutes using pictorial models or tools such as a 15-minute event plus a 30-minute event equals 45 minutes. Tell and write time to the nearest minute.',
      gradeLevel: 3,
      strand: 'Measurement',
      difficulty: 2,
      prerequisites: [],
      sampleProblems: [
        'What time does the clock show if the hour hand is between 4 and 5 and the minute hand points to 7?',
        'Recess starts at 10:15 AM and lasts 25 minutes. What time does recess end?',
        'A movie starts at 2:40 PM and ends at 4:10 PM. How long is the movie?',
      ],
      isVerifiable: true,
      order: 18,
    },
    {
      id: '3.meas.3',
      tpiCode: '3.7D',
      name: 'Liquid Volume and Mass',
      description:
        'Determine when it is appropriate to use measurements of liquid volume (capacity) or weight/mass, and solve one-step real-world problems involving liquid volumes or masses of objects.',
      gradeLevel: 3,
      strand: 'Measurement',
      difficulty: 2,
      prerequisites: ['3.meas.1'],
      sampleProblems: [
        'A fish tank holds 20 liters of water. You pour in 8 liters. How many more liters do you need?',
        'A bag of apples weighs 3 kilograms. You buy 4 bags. What is the total mass?',
      ],
      isVerifiable: true,
      order: 19,
    },

    // ─────────────────────────────────────────────
    // Strand: Data Analysis
    // ─────────────────────────────────────────────
    {
      id: '3.data.1',
      tpiCode: '3.8A',
      name: 'Frequency Tables and Dot Plots',
      description:
        'Summarize a data set with multiple categories using a frequency table, dot plot, pictograph, or bar graph with scaled intervals. Collect, organize, and record data in up to four categories.',
      gradeLevel: 3,
      strand: 'Data Analysis',
      difficulty: 1,
      prerequisites: [],
      sampleProblems: [
        'Students voted for their favorite fruit: apple (8), banana (5), grape (3), orange (6). Make a frequency table and find the most popular fruit.',
        'A dot plot shows shoe sizes of students. There are 4 dots above size 1, 6 dots above size 2, and 2 dots above size 3. How many students were surveyed?',
      ],
      isVerifiable: true,
      order: 20,
    },
    {
      id: '3.data.2',
      tpiCode: '3.8B',
      name: 'Bar Graphs and Problem Solving with Data',
      description:
        'Solve one- and two-step problems using categorical data represented with a frequency table, dot plot, pictograph, or bar graph with scaled intervals. Draw conclusions and make predictions from data.',
      gradeLevel: 3,
      strand: 'Data Analysis',
      difficulty: 2,
      prerequisites: ['3.data.1', '3.nbt.3', '3.nbt.4'],
      sampleProblems: [
        'A bar graph shows books read: Room A = 45, Room B = 32, Room C = 51. How many more books did Room C read than Room B?',
        'Use the bar graph to find the total number of books read by all three rooms. If Room D reads 40 books, which room read the fewest?',
      ],
      isVerifiable: true,
      order: 21,
    },
  ],
};

export const grade3Curriculum = grade3;
