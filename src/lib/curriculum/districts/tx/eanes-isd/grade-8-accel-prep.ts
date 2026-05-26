import { GradeCurriculum } from '../../../types';

/**
 * EISD Math 8 Accelerated Placement Prep -- aligned to Eanes ISD 7th Grade
 * Scope & Sequence and mapped to Edmentum/Apex course lessons.
 *
 * Grade level is set to 8 to keep it separate from the regular grade-7 curriculum.
 * The topics cover 7th-grade material that students must demonstrate mastery of
 * to place into 8th-grade accelerated math.
 *
 * Priority: 1st and 2nd nine-weeks are the primary focus (test in 1 month).
 * 3rd and 4th nine-weeks topics are included but lower priority.
 */
export const grade8AccelPrepCurriculum: GradeCurriculum = {
  grade: 8,
  label: "Math 8 Accelerated Placement Prep (Edmentum)",
  topics: [
    // =====================================================================
    // 1ST NINE WEEKS
    // =====================================================================

    // --- Unit 1: Rational Representations and Integer Operations (10 days) ---
    {
      id: "8ap.u1.1",
      tpiCode: "7.2A",
      name: "Sets and Subsets of Rational Numbers",
      description:
        "Classify numbers as natural, whole, integer, or rational. Use visual representations (Venn diagrams) to show how number sets relate. Convert fractions to decimals using long division. Identify terminating vs repeating decimals and write repeating decimals using bar notation.",
      gradeLevel: 8,
      strand: "Number & Operations",
      difficulty: 1,
      prerequisites: [],
      sampleProblems: [
        "Place each number in the correct region of a Venn diagram showing natural numbers, whole numbers, integers, and rational numbers: -3, 0, 2/5, 7, -1.8.",
        "Convert 7/11 to a decimal. Is it terminating or repeating? Write it using bar notation.",
        "Which fractions have terminating decimals: 3/4, 2/7, 5/16, 1/6? Explain the pattern using prime factorization of the denominators.",
        "True or false: All integers are rational numbers, but not all rational numbers are integers. Explain with examples.",
      ],
      isVerifiable: true,
      order: 1,
      nineWeeks: 1,
    },
    {
      id: "8ap.u1.2",
      tpiCode: "7.3A",
      name: "Adding and Subtracting Integers",
      description:
        "Add and subtract positive and negative integers fluently. Apply the commutative and associative properties to simplify integer computations. Understand integer addition on a number line. Use absolute value to determine distance from zero.",
      gradeLevel: 8,
      strand: "Number & Operations",
      difficulty: 1,
      prerequisites: ["8ap.u1.1"],
      sampleProblems: [
        "Evaluate: -8 + 5 + (-3) + 12.",
        "Use the commutative property to regroup and simplify: -15 + 23 + 15 + (-7).",
        "A diver is at -15 meters and ascends 8 meters, then descends 5 meters. What is the final depth?",
        "The temperature was -4 degrees F at midnight. By noon it had risen 18 degrees. What was the noon temperature?",
      ],
      isVerifiable: true,
      order: 2,
      nineWeeks: 1,
    },
    {
      id: "8ap.u1.3",
      tpiCode: "7.3A",
      name: "Multiplying and Dividing Integers",
      description:
        "Multiply and divide positive and negative integers fluently. Apply sign rules: positive x positive = positive, negative x negative = positive, positive x negative = negative. Use the associative and distributive properties to simplify.",
      gradeLevel: 8,
      strand: "Number & Operations",
      difficulty: 1,
      prerequisites: ["8ap.u1.2"],
      sampleProblems: [
        "Evaluate: (-6)(4)(-2).",
        "Divide: -48 / (-8).",
        "The temperature drops 3 degrees per hour for 6 hours. Write a multiplication expression and find the total change.",
        "Use the distributive property to evaluate: 5(-7 + 3).",
      ],
      isVerifiable: true,
      order: 3,
      nineWeeks: 1,
    },
    {
      id: "8ap.u1.4",
      tpiCode: "7.3B",
      name: "Solving Problems with Integer Operations",
      description:
        "Apply integer operations to solve real-world and mathematical problems. Use order of operations with integers. Interpret results in context and check reasonableness.",
      gradeLevel: 8,
      strand: "Number & Operations",
      difficulty: 2,
      prerequisites: ["8ap.u1.2", "8ap.u1.3"],
      sampleProblems: [
        "A football team gained 8 yards, lost 3 yards, gained 15 yards, and lost 6 yards. What was the net yardage?",
        "Evaluate: (-2)^3 + 4 x (-3) - 7.",
        "A bank account starts at $250. Deposits of $75 and $120 are made. Withdrawals of $83 and $45 are made. What is the final balance?",
        "The average of five test scores is 82. Four scores are 78, 91, 75, and 85. What is the fifth score?",
      ],
      isVerifiable: true,
      order: 4,
      nineWeeks: 1,
    },

    // --- Unit 2: Rational Number Operations (12 days) ---
    {
      id: "8ap.u2.1",
      tpiCode: "7.3A",
      name: "Adding and Subtracting Rational Numbers",
      description:
        "Add and subtract positive and negative fractions, mixed numbers, and decimals fluently. Find common denominators for fraction operations. Apply commutative, associative, and identity properties to simplify computations with rational numbers.",
      gradeLevel: 8,
      strand: "Number & Operations",
      difficulty: 2,
      prerequisites: ["8ap.u1.4"],
      sampleProblems: [
        "Use the commutative property of addition to rewrite and simplify: -3/4 + 5/6 + 3/4.",
        "Find the difference: 7.2 - (-3.85).",
        "The commutative property says a + b = b + a. Use it to make this easier: 17 + 45 + 83.",
        "Simplify: 4.5 + 2 1/2 + 6.0 - 5 1/2.",
      ],
      isVerifiable: true,
      order: 5,
      nineWeeks: 1,
    },
    {
      id: "8ap.u2.2",
      tpiCode: "7.3A",
      name: "Multiplying and Dividing Rational Numbers",
      description:
        "Multiply and divide positive and negative fractions, mixed numbers, and decimals fluently. Rewrite division as multiplication by the reciprocal. Apply sign rules for products and quotients. Use the distributive property with rational numbers.",
      gradeLevel: 8,
      strand: "Number & Operations",
      difficulty: 2,
      prerequisites: ["8ap.u2.1"],
      sampleProblems: [
        "Evaluate: (-3/5) x (10/9).",
        "Divide: -4.8 / 1.2.",
        "Rewrite as multiplication and evaluate: (-2/3) / (4/5).",
        "Use the distributive property to evaluate: 10(7 + 9).",
      ],
      isVerifiable: true,
      order: 6,
      nineWeeks: 1,
    },
    {
      id: "8ap.u2.3",
      tpiCode: "7.3B",
      name: "Multi-Step Problems with Rational Numbers",
      description:
        "Solve multi-step real-world and mathematical problems involving all four operations with rational numbers. Combine mixed numbers and decimals in expressions. Apply order of operations including parentheses with rational numbers.",
      gradeLevel: 8,
      strand: "Number & Operations",
      difficulty: 2,
      prerequisites: ["8ap.u2.1", "8ap.u2.2"],
      sampleProblems: [
        "Evaluate: -3/4 + 2/3 x (-6/5).",
        "Simplify: 8.5 - 1 1/4 + 3.25 - 2 1/4.",
        "A recipe calls for 2 1/3 cups of flour. If you make 1 1/2 batches, how much flour do you need?",
        "A submarine descends at -3.2 m/s for 15 seconds, then ascends at 1.8 m/s for 10 seconds. What is its position relative to the start?",
      ],
      isVerifiable: true,
      order: 7,
      nineWeeks: 1,
    },
    {
      id: "8ap.u2.4",
      tpiCode: "7.3B",
      name: "Using Operations on Rational Numbers to Solve Problems",
      description:
        "Apply rational number operations to solve complex real-world problems. Use order of operations with parentheses, exponents, and all four operations. Choose appropriate operations and interpret results in context.",
      gradeLevel: 8,
      strand: "Number & Operations",
      difficulty: 3,
      prerequisites: ["8ap.u2.3"],
      sampleProblems: [
        "Match each expression to the correct first step in order of operations: 9 - 6 * 3, 6 + 2 / 2, 4(9 - 6), 8 - 6 + 2.",
        "A stock gained $3.50 on Monday, lost $5.75 on Tuesday, and gained $2.25 on Wednesday. What was the net change?",
        "Evaluate: (18 - 8) / 5 + 3 x (-2).",
        "A store marks up items by 1/3 of the wholesale price. If an item wholesales for $24.60 and there is a $5 shipping fee, what is the total retail price?",
      ],
      isVerifiable: true,
      order: 8,
      nineWeeks: 1,
    },

    // --- Unit 3: Equations (8 days) ---
    {
      id: "8ap.u3.1",
      tpiCode: "7.10A",
      name: "Writing Two-Step Equations and Inequalities",
      description:
        "Translate verbal descriptions into one-variable, two-step equations and inequalities. Identify keywords: 'sum,' 'difference,' 'product,' 'quotient,' 'more than,' 'less than,' 'at least,' 'at most.' Recognize 'problems within problems.'",
      gradeLevel: 8,
      strand: "Algebra",
      difficulty: 1,
      prerequisites: ["8ap.u2.4"],
      sampleProblems: [
        "Write an equation: 'Fifteen less than the product of three and a number is thirty-six.'",
        "Write an equation: Oliver orders 5 glow bracelets per guest plus 2 extra. He orders 37 total. How many guests? Write as 5x + 2 = 37.",
        "Write an inequality: 'You have $50. Rides cost $3 each and admission is $14. How many rides can you afford?'",
        "Write an equation: Marsha fills 6 gift bags with an equal number of pens and has 3 left over from 27 pens. How many pens per bag?",
      ],
      isVerifiable: true,
      order: 9,
      nineWeeks: 1,
    },
    {
      id: "8ap.u3.2",
      tpiCode: "7.11A",
      name: "Solving Two-Step Equations",
      description:
        "Solve two-step linear equations of the form ax + b = c using inverse operations. Isolate the variable by undoing addition/subtraction first, then multiplication/division. Verify solutions by substitution. Use balanced-scale reasoning.",
      gradeLevel: 8,
      strand: "Algebra",
      difficulty: 2,
      prerequisites: ["8ap.u3.1"],
      sampleProblems: [
        "Solve for x: 2x + 4 = 12. What is the first step?",
        "Solve for x: 3x + 7 = -8.",
        "Solve: n/4 - 2.5 = 6.",
        "Solve and check by substitution: -2p + 9 = 1.",
      ],
      isVerifiable: true,
      order: 10,
      nineWeeks: 1,
    },
    {
      id: "8ap.u3.3",
      tpiCode: "7.10B",
      name: "Representing Solutions on Number Lines",
      description:
        "Graph solutions to equations on a number line. Understand the difference between a single-point solution (equation) and a range of solutions (inequality). Use open vs closed circles for strict vs inclusive inequalities.",
      gradeLevel: 8,
      strand: "Algebra",
      difficulty: 1,
      prerequisites: ["8ap.u3.2"],
      sampleProblems: [
        "Solve 3x - 5 = 10 and plot the solution on a number line.",
        "Explain the difference between graphing x = 4 and x > 4 on a number line.",
        "Graph x <= -2 on a number line. Should the circle be open or closed? Why?",
        "Graph x > 3 on a number line. Explain why an open circle is used.",
      ],
      isVerifiable: true,
      order: 11,
      nineWeeks: 1,
      requiresImage: true,
      imageType: 'number-line',
    },
    {
      id: "8ap.u3.4",
      tpiCode: "7.10C",
      name: "Writing Real-World Problems from Equations",
      description:
        "Given a two-step equation, write a corresponding real-world problem. Interpret the variable, coefficients, and constants in context. Connect mathematical representations to real situations.",
      gradeLevel: 8,
      strand: "Algebra",
      difficulty: 2,
      prerequisites: ["8ap.u3.2"],
      sampleProblems: [
        "Write a real-world problem that could be modeled by 5x + 2 = 37.",
        "Write a word problem for the equation 3x - 7 = 20.",
        "The equation 8.50x + 45 = 130 represents Maria's earnings. What could x, 8.50, 45, and 130 represent?",
        "Write a real-world scenario for the inequality 3x + 14 <= 50.",
      ],
      isVerifiable: true,
      order: 12,
      nineWeeks: 1,
    },
    {
      id: "8ap.u3.5",
      tpiCode: "7.11B",
      name: "Determining If Values Make Equations True",
      description:
        "Substitute given values into equations and inequalities to determine if they are solutions. Test multiple values and explain why each does or does not satisfy the equation or inequality.",
      gradeLevel: 8,
      strand: "Algebra",
      difficulty: 1,
      prerequisites: ["8ap.u3.2"],
      sampleProblems: [
        "Is x = 5 a solution to 3x + 7 = 22? Show your work.",
        "Which value makes 2x - 4 = 10 true: x = 3, x = 7, or x = 5?",
        "Does x = -3 satisfy the inequality 2x + 1 > -4? Explain.",
        "Test x = 2 and x = 6 in the equation 4x - 3 = 21. Which is the solution?",
      ],
      isVerifiable: true,
      order: 13,
      nineWeeks: 1,
    },

    // =====================================================================
    // 2ND NINE WEEKS
    // =====================================================================

    // --- Unit 4: Inequalities (10 days) ---
    {
      id: "8ap.u4.1",
      tpiCode: "7.10A",
      name: "Translating Words to Inequalities",
      description:
        "Translate verbal phrases into inequality symbols. Recognize keywords: 'is more than' (>), 'exceeds' (>), 'is less than' (<), 'is fewer than' (<), 'below' (<), 'at least' (>=), 'at most' (<=), 'no more than' (<=).",
      gradeLevel: 8,
      strand: "Algebra",
      difficulty: 1,
      prerequisites: ["8ap.u3.5"],
      sampleProblems: [
        "Match each inequality to its verbal description: n > 25 + 50, n < 50 - 25, n > 50, n < 50.",
        "Write an inequality: 'The value of x exceeds the sum of 9 and 21.'",
        "Write an inequality: 'x is less than the product of 2 and 100.'",
        "Write an inequality for: 'A student needs at least 80 points to pass.'",
      ],
      isVerifiable: true,
      order: 14,
      nineWeeks: 2,
    },
    {
      id: "8ap.u4.2",
      tpiCode: "7.11A",
      name: "Solving One-Step Inequalities",
      description:
        "Solve one-step linear inequalities using inverse operations. Graph solution sets on a number line with open and closed circles. Understand that there are infinitely many solutions to an inequality.",
      gradeLevel: 8,
      strand: "Algebra",
      difficulty: 1,
      prerequisites: ["8ap.u4.1"],
      sampleProblems: [
        "Solve and graph: x + 8 > 11.",
        "Solve: 12x < -72. Fill in: To solve, you ___ both sides by ___.",
        "Solve and graph on a number line: x - 5 >= 3.",
        "Solve: x/4 < 8.",
      ],
      isVerifiable: true,
      order: 15,
      nineWeeks: 2,
      requiresImage: true,
      imageType: 'number-line',
    },
    {
      id: "8ap.u4.3",
      tpiCode: "7.11A",
      name: "Solving Two-Step Inequalities",
      description:
        "Solve two-step linear inequalities using inverse operations. Apply the rule: when multiplying or dividing by a negative number, reverse the inequality symbol. Graph solutions on a number line.",
      gradeLevel: 8,
      strand: "Algebra",
      difficulty: 2,
      prerequisites: ["8ap.u4.2"],
      sampleProblems: [
        "Solve and graph: 2x - 7 <= 15.",
        "Solve: -3x > 27. Remember to flip the inequality sign.",
        "Solve: -16x < -32. What happens to the inequality when dividing by -16?",
        "Match each inequality with its solution: -6x > 60, 4x > -40, -3x > 27.",
      ],
      isVerifiable: true,
      order: 16,
      nineWeeks: 2,
      requiresImage: true,
      imageType: 'number-line',
    },
    {
      id: "8ap.u4.4",
      tpiCode: "7.11A",
      name: "Solving Inequality Word Problems",
      description:
        "Translate real-world situations into two-step inequalities, solve them, and interpret the solution in context. Graph the solution set and determine which values are reasonable in the given situation.",
      gradeLevel: 8,
      strand: "Algebra",
      difficulty: 2,
      prerequisites: ["8ap.u4.3"],
      sampleProblems: [
        "You have $50. Rides cost $3 each and admission is $14. Write and solve an inequality for the maximum number of rides.",
        "Maria needs at least $130. She has $45 and earns $8.50/hour. Write and solve an inequality for the hours she needs.",
        "A phone plan costs $25/month plus $0.10 per text. The bill must stay under $40. Write and solve an inequality for texts.",
        "The perimeter of a rectangle must be at most 56 cm. The length is 5 cm more than the width. Write and solve an inequality for the width.",
      ],
      isVerifiable: true,
      order: 17,
      nineWeeks: 2,
    },

    // --- Unit 5: Proportional Relationships (15 days) ---
    {
      id: "8ap.u5.1",
      tpiCode: "7.4B",
      name: "Unit Rates with Whole Numbers",
      description:
        "Compute unit rates from ratios of whole numbers. When the second quantity is not 1, divide both quantities by the second quantity. Compare unit rates to determine the better deal.",
      gradeLevel: 8,
      strand: "Ratios & Proportional Relationships",
      difficulty: 1,
      prerequisites: [],
      sampleProblems: [
        "A watermelon costs $5.00 for 4 pounds. Find the unit rate (price per pound) by dividing both quantities by 4.",
        "Joey bought a pack of 5 stickers for 50 cents. Find the unit rate in cents per sticker.",
        "Store A sells 3 pounds for $5.25. Store B sells 5 pounds for $8.50. Which is the better deal?",
        "A car travels 150 miles on 4.5 gallons of gas. What is the unit rate in miles per gallon?",
      ],
      isVerifiable: true,
      order: 18,
      nineWeeks: 2,
    },
    {
      id: "8ap.u5.2",
      tpiCode: "7.4B",
      name: "Unit Rates with Fractions",
      description:
        "Compute unit rates from ratios of fractions. Divide fractions by multiplying by the reciprocal. Find unit rates involving fractional quantities such as miles per hour when given fractions of miles and hours.",
      gradeLevel: 8,
      strand: "Ratios & Proportional Relationships",
      difficulty: 2,
      prerequisites: ["8ap.u5.1"],
      sampleProblems: [
        "A recipe uses 3/4 cup water and 1/4 cup oil. The water is how many times the amount of oil? Write as (3/4) / (1/4) and simplify.",
        "A sailboat travels 3/4 mile in 1/12 hour. Find the unit rate in miles per hour.",
        "Elijah runs 5 km in 1/3 hour. What is his speed in km/hour?",
        "A recipe uses 2/3 cup of sugar for every 1/2 batch. What is the unit rate of sugar per batch?",
      ],
      isVerifiable: true,
      order: 19,
      nineWeeks: 2,
    },
    {
      id: "8ap.u5.3",
      tpiCode: "7.4D",
      name: "Percent Increase and Decrease",
      description:
        "Calculate percent increase and percent decrease by comparing the amount of change with the original value. Understand that percent is a part out of 100. Apply to real-world problems including financial literacy contexts.",
      gradeLevel: 8,
      strand: "Ratios & Proportional Relationships",
      difficulty: 2,
      prerequisites: ["8ap.u5.1"],
      sampleProblems: [
        "Students donated 75 cans in September and 90 cans in October. Find the percent increase.",
        "A shirt was $40 and is now $30. What is the percent decrease?",
        "A store offers 30% off. The sale price is $42. What was the original price?",
        "If 40% of a number is 28, what is 75% of the same number?",
      ],
      isVerifiable: true,
      order: 20,
      nineWeeks: 2,
    },
    {
      id: "8ap.u5.4",
      tpiCode: "7.4D",
      name: "Solving Problems with Ratios, Rates, and Percents",
      description:
        "Solve multi-step problems involving ratios, rates, and percents. Set up and solve proportions using cross-multiplication. Apply to tax, tip, discount, markup, and commission problems.",
      gradeLevel: 8,
      strand: "Ratios & Proportional Relationships",
      difficulty: 2,
      prerequisites: ["8ap.u5.3"],
      sampleProblems: [
        "Solve: 3/8 = x/20.",
        "A meal costs $45. Tax is 8.25% and you leave a 20% tip (on the pre-tax amount). What is the total?",
        "A jacket is marked up 40% from a wholesale cost of $35. What is the retail price?",
        "A salesperson earns 6% commission. How much must they sell to earn $1,500?",
      ],
      isVerifiable: true,
      order: 21,
      nineWeeks: 2,
    },
    {
      id: "8ap.u5.5",
      tpiCode: "7.4E",
      name: "Converting Between Measurement Systems",
      description:
        "Use proportions to convert between customary and metric measurement systems. Apply common conversion factors (e.g., 1 inch = 2.54 cm, 1 mile = 1.609 km, 1 gallon = 3.785 liters).",
      gradeLevel: 8,
      strand: "Ratios & Proportional Relationships",
      difficulty: 1,
      prerequisites: ["8ap.u5.1"],
      sampleProblems: [
        "Convert 15 inches to centimeters using 1 inch = 2.54 cm.",
        "A recipe calls for 2 liters of water. How many cups is that? (1 liter = 4.227 cups)",
        "A race is 10 kilometers. How many miles is that? (1 mile = 1.609 km)",
        "A room is 12 feet long. What is the length in meters? (1 foot = 0.3048 m)",
      ],
      isVerifiable: true,
      order: 22,
      nineWeeks: 2,
    },

    // --- Unit 6: Linear Relationships (12 days) ---
    {
      id: "8ap.u6.1",
      tpiCode: "7.4A",
      name: "Constant Rates of Change",
      description:
        "Represent constant rates of change in mathematical and real-world problems using the relationship d = rt. Identify rate of change from verbal descriptions using keywords like 'per,' 'rate,' and 'every.' Calculate rate of change when not given as a unit rate.",
      gradeLevel: 8,
      strand: "Algebra",
      difficulty: 1,
      prerequisites: ["8ap.u5.1"],
      sampleProblems: [
        "A cheetah runs 200 feet in 2 seconds. What is the rate of change in feet per second?",
        "Jade spends $3 per day on lunch. Write an equation and find the total spent after 5 days.",
        "A candle burns down 1 inch every hour. If it starts at 10 inches, write an expression for the height after h hours.",
        "Julian bikes 50 miles in 2 hours. What is his rate of change?",
      ],
      isVerifiable: true,
      order: 23,
      nineWeeks: 2,
    },
    {
      id: "8ap.u6.2",
      tpiCode: "7.4C",
      name: "Constant of Proportionality",
      description:
        "Determine the constant of proportionality (k = y/x) from tables, graphs, and verbal descriptions. When two quantities are proportional, they are related by a constant ratio. Find k by dividing y by x using any pair of corresponding values.",
      gradeLevel: 8,
      strand: "Algebra",
      difficulty: 2,
      prerequisites: ["8ap.u6.1"],
      sampleProblems: [
        "Find the constant of proportionality for the ratios: 24:2, 4:8, 1:4.",
        "The perimeter of a square is always 4 times the side length. What is the constant of proportionality?",
        "From a table: x = 2, 5, 8 and y = 6, 15, 24. Find k and write the equation y = kx.",
        "A gym charges $25 sign-up fee plus $30/month. Is total cost proportional to months? Why or why not?",
      ],
      isVerifiable: true,
      order: 24,
      nineWeeks: 2,
    },
    {
      id: "8ap.u6.3",
      tpiCode: "7.7A",
      name: "Linear Relationships (y = mx + b)",
      description:
        "Represent linear relationships using tables, graphs, equations, and verbal descriptions. Identify the rate of change (slope, m) and starting value (y-intercept, b) from each representation. The starting value is the output when the input is zero. Calculate rate of change from a graph by dividing vertical distance by horizontal distance.",
      gradeLevel: 8,
      strand: "Algebra",
      difficulty: 2,
      prerequisites: ["8ap.u6.2"],
      sampleProblems: [
        "For y = 2x + 5, what is the starting value? Verify by substituting x = 0.",
        "Match each equation with its starting value: y = 5x + 6, y = 4x - 12, y = x + 7.",
        "From a graph, find the rate of change by dividing the vertical distance between two points by the horizontal distance.",
        "A plumber charges $50 plus $35/hour. Write the equation, make a table for 0-4 hours, and identify the rate of change and starting value.",
      ],
      isVerifiable: true,
      order: 25,
      nineWeeks: 2,
      requiresImage: true,
      imageType: 'coordinate-plane',
    },
    {
      id: "8ap.u6.4",
      tpiCode: "7.7A",
      name: "Equations of Linear Relationships",
      description:
        "Write equations of linear relationships in slope-intercept form (y = mx + b) from verbal descriptions, tables, and graphs. Identify m and b, then substitute into y = mx + b. Use the equation to make predictions.",
      gradeLevel: 8,
      strand: "Algebra",
      difficulty: 2,
      prerequisites: ["8ap.u6.3"],
      sampleProblems: [
        "Shandra deposited $100 and adds $20/week. Write the equation. How much after 8 weeks?",
        "From the table (x: -2, 0, 4, 10; y: 2, 3, 5, 8), find the rate of change and starting value. Write the equation.",
        "Find and describe the rate of change and starting value: A temperature starts at 68 degrees F and drops 3 degrees per hour.",
        "A candle is 12 inches tall and burns 0.5 inches per hour. Write the equation. When will it be 3 inches?",
      ],
      isVerifiable: true,
      order: 26,
      nineWeeks: 2,
      requiresImage: true,
      imageType: 'coordinate-plane',
    },

    // --- Unit 7: Proportional Geometry (7 days) ---
    {
      id: "8ap.u7.1",
      tpiCode: "7.5A",
      name: "Critical Attributes of Similarity",
      description:
        "Identify similar and congruent figures. In similar figures, corresponding angles are equal and corresponding sides are proportional. Congruent figures are the same shape AND size. Similar figures are the same shape but may differ in size. Identify corresponding angles and sides.",
      gradeLevel: 8,
      strand: "Geometry & Measurement",
      difficulty: 1,
      prerequisites: [],
      sampleProblems: [
        "Quadrilateral ABCD ~ Quadrilateral WXYZ. List all pairs of corresponding angles and sides.",
        "True or false: Congruent figures are always similar, but similar figures are not always congruent. Explain.",
        "Two triangles have the same angle measures (40, 60, 80 degrees) but different side lengths. Are they similar, congruent, or neither?",
        "If Triangle PQR ~ Triangle XYZ, and angle P = 55 degrees and angle Q = 70 degrees, what is angle Z?",
      ],
      isVerifiable: true,
      order: 27,
      nineWeeks: 2,
    },
    {
      id: "8ap.u7.2",
      tpiCode: "7.5C",
      name: "Solving Problems with Similar Shapes",
      description:
        "Use proportions to find missing side lengths in similar figures. Write ratios of corresponding sides, set up proportions, and solve using cross-multiplication.",
      gradeLevel: 8,
      strand: "Geometry & Measurement",
      difficulty: 2,
      prerequisites: ["8ap.u7.1"],
      sampleProblems: [
        "Triangle PQR ~ Triangle VWX. PQ = 21, VW = 33. QR = 7. Find WX using a proportion.",
        "Triangle ABC ~ Triangle DEF. AB = 6, BC = 8, DE = 9. Find EF.",
        "Two similar rectangles: the first is 4 cm by 6 cm. The second has width 10 cm. Find its length.",
        "A flagpole casts a 12-foot shadow. A 5-foot person nearby casts a 3-foot shadow. How tall is the flagpole?",
      ],
      isVerifiable: true,
      order: 28,
      nineWeeks: 2,
    },
    {
      id: "8ap.u7.3",
      tpiCode: "7.5C",
      name: "Scale Drawings",
      description:
        "Create and interpret scale drawings. Determine scale factors from blueprints and maps. Write and solve proportions to find actual or drawing dimensions. Understand that a scale factor is the ratio of drawing size to actual size.",
      gradeLevel: 8,
      strand: "Geometry & Measurement",
      difficulty: 2,
      prerequisites: ["8ap.u7.2"],
      sampleProblems: [
        "An architect uses a scale of 2 inches = 30 feet. The actual stadium is 180 feet tall. How tall is it in the blueprint?",
        "A blueprint has a scale of 1 cm : 2.5 m. A room is 6 cm by 4.8 cm on the blueprint. What are the actual dimensions?",
        "On a map, 1 inch = 25 miles. Two cities are 3.5 inches apart. What is the actual distance?",
        "On a map, 1.5 inches represents 50 miles. Two cities are 4.5 inches apart. What is the actual distance?",
      ],
      isVerifiable: true,
      order: 29,
      nineWeeks: 2,
    },

    // =====================================================================
    // 3RD NINE WEEKS (Lower priority)
    // =====================================================================

    // --- Unit 8: 2D Geometry and Surface Area ---
    {
      id: "8ap.u8.1",
      tpiCode: "7.9B",
      name: "Circles (Circumference and Area)",
      description:
        "Find the circumference using C = pi*d or C = 2*pi*r. Find the area using A = pi*r^2. Understand pi as the ratio of circumference to diameter (approximately 3.14). Convert between radius and diameter. Apply to real-world problems.",
      gradeLevel: 8,
      strand: "Geometry & Measurement",
      difficulty: 2,
      prerequisites: [],
      sampleProblems: [
        "A circle measures 10 mm across through the center. Find its area using pi = 3.14. First find the radius.",
        "Match each word to its description: circumference, radius, diameter, pi.",
        "A circular fishpond has a diameter of 8 feet. Henry is lining the bottom with stones. How much area do the stones need to cover?",
        "A pizza has a diameter of 14 inches. What is the area of one slice if cut into 8 equal slices?",
      ],
      isVerifiable: true,
      order: 30,
      nineWeeks: 3,
    },
    {
      id: "8ap.u8.2",
      tpiCode: "7.9C",
      name: "Composite Figures",
      description:
        "Find the area and perimeter of composite figures made up of rectangles, triangles, parallelograms, trapezoids, and semicircles. Decompose complex shapes into simpler ones.",
      gradeLevel: 8,
      strand: "Geometry & Measurement",
      difficulty: 2,
      prerequisites: ["8ap.u8.1"],
      sampleProblems: [
        "Find the area of an L-shaped figure with dimensions 10 cm x 4 cm with a 3 cm x 3 cm square cut from the corner.",
        "A figure is made of a rectangle (8 m x 5 m) with a semicircle on one short side. Find the total area.",
        "Find the area of a trapezoid with bases 10 in and 6 in, and height 4 in.",
        "A swimming pool is shaped like a rectangle with semicircles on both ends. The rectangle is 25 m x 10 m. Find the total area.",
      ],
      isVerifiable: true,
      order: 31,
      nineWeeks: 3,
    },
    {
      id: "8ap.u8.3",
      tpiCode: "7.5B",
      name: "Pi and Circle Relationships",
      description:
        "Understand that pi is the ratio of circumference to diameter for every circle. Approximate pi by measuring and dividing. Use pi to find circumference when diameter is known and vice versa.",
      gradeLevel: 8,
      strand: "Geometry & Measurement",
      difficulty: 1,
      prerequisites: [],
      sampleProblems: [
        "Measure the circumference and diameter of three circular objects. Divide circumference by diameter for each. What do you notice?",
        "If a circle has circumference 31.4 cm, what is its diameter? Use pi = 3.14.",
        "Explain why pi is approximately 3.14 using the definition of pi as a ratio.",
        "A circular garden has a diameter of 18 feet. How much fencing is needed to go around it?",
      ],
      isVerifiable: true,
      order: 32,
      nineWeeks: 3,
    },
    {
      id: "8ap.u8.4",
      tpiCode: "7.11C",
      name: "Triangle Angle Relationships",
      description:
        "Apply the triangle angle sum theorem (interior angles sum to 180 degrees). Find missing angles in triangles. Write and solve equations to find unknown angle measures labeled with variables or expressions.",
      gradeLevel: 8,
      strand: "Geometry & Measurement",
      difficulty: 2,
      prerequisites: [],
      sampleProblems: [
        "A triangle has angles measuring 45 degrees and 72 degrees. Find the third angle.",
        "In a triangle, one angle is twice the smallest and the third is 20 degrees more than the smallest. Find all three angles.",
        "An exterior angle of a triangle measures 130 degrees. One non-adjacent interior angle is 55 degrees. Find the other.",
        "Two angles of a triangle are (2x + 10) and (3x - 5) and the third is 55. Find x and all angle measures.",
      ],
      isVerifiable: true,
      order: 33,
      nineWeeks: 3,
    },

    // --- Unit 9: Volume ---
    {
      id: "8ap.u9.1",
      tpiCode: "7.9A",
      name: "Volume of Prisms",
      description:
        "Find the volume of rectangular and triangular prisms using V = Bh where B is the area of the base. Find surface area using SA = 2B + Ph.",
      gradeLevel: 8,
      strand: "Geometry & Measurement",
      difficulty: 2,
      prerequisites: ["8ap.u8.2"],
      sampleProblems: [
        "Find the volume of a rectangular prism with length 8 cm, width 5 cm, and height 3 cm.",
        "A triangular prism has a base triangle with base 6 m and height 4 m. The prism is 10 m long. Find the volume.",
        "Find the surface area of a rectangular prism with dimensions 10 in x 4 in x 6 in.",
        "A box is 12 in x 8 in x 5 in. How much wrapping paper is needed to cover it?",
      ],
      isVerifiable: true,
      order: 34,
      nineWeeks: 3,
    },
    {
      id: "8ap.u9.2",
      tpiCode: "7.9D",
      name: "Volume of Pyramids",
      description:
        "Find the volume of pyramids with rectangular and triangular bases using V = (1/3)Bh. Find surface area using SA = B + (1/2)Pl.",
      gradeLevel: 8,
      strand: "Geometry & Measurement",
      difficulty: 3,
      prerequisites: ["8ap.u9.1"],
      sampleProblems: [
        "Find the volume of a pyramid with a square base of side 6 cm and height 10 cm.",
        "A pyramid has a rectangular base 8 m x 5 m and a height of 12 m. What is its volume?",
        "Find the surface area of a pyramid with a square base of side 10 in and a slant height of 13 in.",
        "The Great Pyramid has a square base of about 230 m and a height of about 146 m. Estimate its volume.",
      ],
      isVerifiable: true,
      order: 35,
      nineWeeks: 3,
    },

    // --- Unit 10: Probability ---
    {
      id: "8ap.u10.1",
      tpiCode: "7.6A",
      name: "Probability Concepts",
      description:
        "Represent sample spaces for simple and compound events. Calculate theoretical and experimental probability. Use organized lists, tree diagrams, and tables to find all possible outcomes.",
      gradeLevel: 8,
      strand: "Data & Statistics",
      difficulty: 2,
      prerequisites: [],
      sampleProblems: [
        "List the sample space for flipping a coin and rolling a die.",
        "A bag has 3 red, 5 blue, and 2 green marbles. What is the probability of drawing a blue marble?",
        "You flip two coins. Draw a tree diagram showing all outcomes. What is P(both heads)?",
        "A spinner has 4 equal sections: red, blue, green, yellow. What is P(not red)?",
      ],
      isVerifiable: true,
      order: 36,
      nineWeeks: 3,
    },

    // =====================================================================
    // 4TH NINE WEEKS (Lower priority)
    // =====================================================================

    // --- Unit 11: Statistics ---
    {
      id: "8ap.u11.1",
      tpiCode: "7.12A",
      name: "Comparing Data Sets",
      description:
        "Compare two groups of numeric data using measures of center (mean, median) and measures of spread (range, interquartile range, mean absolute deviation). Use dot plots, box plots, and histograms.",
      gradeLevel: 8,
      strand: "Data & Statistics",
      difficulty: 2,
      prerequisites: [],
      sampleProblems: [
        "Find the mean, median, and range of: 12, 15, 18, 22, 18, 14, 20.",
        "Compare two data sets using their means and ranges. Which set is more spread out?",
        "Create a box plot from the data: 5, 8, 10, 12, 15, 18, 20, 22, 25.",
        "Calculate the mean absolute deviation (MAD) of: 10, 12, 14, 16, 18.",
      ],
      isVerifiable: true,
      order: 37,
      nineWeeks: 4,
    },

    // --- Unit 12: Financial Literacy ---
    {
      id: "8ap.u12.1",
      tpiCode: "7.13A",
      name: "Financial Literacy",
      description:
        "Calculate simple interest using I = Prt. Understand income, expenses, budgets, savings, and checking accounts. Apply percent concepts to tax, tip, and financial planning.",
      gradeLevel: 8,
      strand: "Financial Literacy",
      difficulty: 2,
      prerequisites: ["8ap.u5.3"],
      sampleProblems: [
        "Calculate the simple interest on $500 at 4% for 3 years using I = Prt.",
        "You deposit $1,200 in a savings account that pays 2.5% simple interest per year. How much interest after 2 years?",
        "A family's monthly income is $4,500. They budget 30% for housing. How much is that?",
        "You earn $12/hour and work 20 hours/week. After 15% taxes, what is your monthly take-home pay?",
      ],
      isVerifiable: true,
      order: 38,
      nineWeeks: 4,
    },
  ],
};
