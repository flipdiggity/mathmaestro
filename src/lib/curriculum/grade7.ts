import { GradeCurriculum } from './types';

export const grade7Curriculum: GradeCurriculum = {
  grade: 7,
  label: "7th Grade Mathematics (First Half)",
  topics: [
    // ─── Strand 1: Rational Numbers (TEKS 7.2) ───────────────────────────
    {
      id: "7.ns.1",
      tpiCode: "7.2A",
      name: "Representations of Rational Numbers",
      description:
        "Extend representations of numbers to include negative fractions and decimals. Locate rational numbers on a number line and understand that every rational number can be expressed as a fraction, decimal, or percent.",
      gradeLevel: 7,
      strand: "Number & Operations",
      difficulty: 1,
      prerequisites: ["6.ns.1", "6.ns.3"],
      sampleProblems: [
        "Place -2.75, 1/3, and -4/5 on a number line. Order them from least to greatest.",
        "Express -7/8 as a decimal and as a percent.",
        "Which is greater: -3/4 or -0.8? Justify your answer using a number line.",
      ],
      isVerifiable: true,
      order: 1,
    },
    {
      id: "7.ns.2",
      tpiCode: "7.2A",
      name: "Comparing and Ordering Rational Numbers",
      description:
        "Compare and order rational numbers in various forms (fractions, decimals, percents) including negative values. Use inequality symbols and justify comparisons with common denominators or equivalent forms.",
      gradeLevel: 7,
      strand: "Number & Operations",
      difficulty: 1,
      prerequisites: ["6.ns.1", "7.ns.1"],
      sampleProblems: [
        "Order the following from least to greatest: 3/5, -0.75, 60%, -2/3, 0.4.",
        "Insert <, >, or = to make the statement true: -5/6 ___ -7/9.",
      ],
      isVerifiable: true,
      order: 2,
    },
    {
      id: "7.ns.3",
      tpiCode: "7.2B",
      name: "Converting Between Fractions, Decimals, and Percents",
      description:
        "Fluently convert between fractions, decimals, and percents, including repeating decimals. Recognize common benchmark equivalences and apply conversions in context.",
      gradeLevel: 7,
      strand: "Number & Operations",
      difficulty: 1,
      prerequisites: ["6.ns.1", "6.ns.3"],
      sampleProblems: [
        "Convert 5/11 to a decimal. Is it terminating or repeating?",
        "A store advertises 3/8 off the original price. What percent discount is this?",
        "Express 0.0625 as a fraction in simplest form and as a percent.",
      ],
      isVerifiable: true,
      order: 3,
    },
    {
      id: "7.ns.4",
      tpiCode: "7.3A",
      name: "Adding and Subtracting Rational Numbers",
      description:
        "Add and subtract rational numbers including negative fractions and decimals. Understand addition of a negative number as moving left on the number line and apply properties of operations.",
      gradeLevel: 7,
      strand: "Number & Operations",
      difficulty: 2,
      prerequisites: ["6.ns.2", "7.ns.1"],
      sampleProblems: [
        "Evaluate: -3/4 + 5/6.",
        "A diver is at -12.5 meters and ascends 8.3 meters. What is the diver's new depth?",
        "Find the sum: -2 1/3 + (-4 2/5).",
      ],
      isVerifiable: true,
      order: 4,
    },
    {
      id: "7.ns.5",
      tpiCode: "7.3A",
      name: "Multiplying and Dividing Rational Numbers",
      description:
        "Multiply and divide rational numbers including negative fractions and mixed numbers. Apply rules for the sign of a product or quotient and connect to real-world contexts such as rate of change.",
      gradeLevel: 7,
      strand: "Number & Operations",
      difficulty: 2,
      prerequisites: ["6.ns.2", "7.ns.4"],
      sampleProblems: [
        "Evaluate: (-3/5) x (10/9).",
        "Divide: -4.8 / 1.2.",
        "The temperature drops 2.5 degrees per hour for 6 hours. Write a multiplication expression and find the total change.",
      ],
      isVerifiable: true,
      order: 5,
    },

    // ─── Strand 2: Expressions & Equations (TEKS 7.3) ────────────────────
    {
      id: "7.ee.1",
      tpiCode: "7.3B",
      name: "Simplifying Expressions and Combining Like Terms",
      description:
        "Simplify algebraic expressions by combining like terms. Identify coefficients, constants, and like terms in expressions with rational number coefficients.",
      gradeLevel: 7,
      strand: "Algebra",
      difficulty: 1,
      prerequisites: ["6.ee.1", "6.ee.2"],
      sampleProblems: [
        "Simplify: 3x + 7 - 5x + 2.",
        "Combine like terms: 2.5a - 4b + 1.3a + 6b.",
        "Identify the coefficient, variable, and constant in the expression 8m - 3.",
      ],
      isVerifiable: true,
      order: 6,
    },
    {
      id: "7.ee.2",
      tpiCode: "7.3C",
      name: "Distributive Property",
      description:
        "Apply the distributive property to expand and factor linear expressions with rational coefficients. Use the property to rewrite expressions in equivalent forms.",
      gradeLevel: 7,
      strand: "Algebra",
      difficulty: 2,
      prerequisites: ["6.ee.1", "7.ee.1"],
      sampleProblems: [
        "Expand: -2(3x - 5).",
        "Use the distributive property to write an equivalent expression for 4(2y + 3) - 5y.",
        "Factor: 12x + 18 using the GCF.",
      ],
      isVerifiable: true,
      order: 7,
    },
    {
      id: "7.ee.3",
      tpiCode: "7.3B",
      name: "Solving Two-Step Equations",
      description:
        "Solve two-step linear equations of the form ax + b = c where a, b, and c are rational numbers. Use inverse operations and verify solutions by substitution.",
      gradeLevel: 7,
      strand: "Algebra",
      difficulty: 2,
      prerequisites: ["6.ee.3", "7.ee.1", "7.ns.4"],
      sampleProblems: [
        "Solve for x: 3x + 7 = -8.",
        "Solve: (n / 4) - 2.5 = 6.",
        "Solve and check: -2p + 9 = 1.",
      ],
      isVerifiable: true,
      order: 8,
    },
    {
      id: "7.ee.4",
      tpiCode: "7.3A",
      name: "Writing Equations from Word Problems",
      description:
        "Translate real-world situations into two-step equations. Identify the unknown, define a variable, set up the equation, solve, and interpret the solution in context.",
      gradeLevel: 7,
      strand: "Algebra",
      difficulty: 3,
      prerequisites: ["6.ee.3", "7.ee.3"],
      sampleProblems: [
        "Maria has $45. She earns $8.50 per hour babysitting. How many hours must she work to have at least $130? Write and solve an equation.",
        "The perimeter of a rectangle is 56 cm. The length is 5 cm more than the width. Write an equation and find the dimensions.",
      ],
      isVerifiable: true,
      order: 9,
    },

    // ─── Strand 3: Inequalities (TEKS 7.4) ───────────────────────────────
    {
      id: "7.iq.1",
      tpiCode: "7.4A",
      name: "Writing and Graphing Inequalities",
      description:
        "Write one-variable inequalities to represent constraints or conditions in real-world and mathematical problems. Graph solution sets on a number line using open and closed circles.",
      gradeLevel: 7,
      strand: "Algebra",
      difficulty: 1,
      prerequisites: ["6.ee.3", "7.ee.1"],
      sampleProblems: [
        "Write an inequality for: 'You must be at least 48 inches tall to ride the roller coaster.' Graph the solution on a number line.",
        "Graph the inequality x > -3 on a number line. Is -3 included in the solution set?",
        "A parking garage charges a $5 flat fee plus $2 per hour. You have no more than $19. Write an inequality for the number of hours you can park.",
      ],
      isVerifiable: true,
      order: 10,
    },
    {
      id: "7.iq.2",
      tpiCode: "7.4A",
      name: "Solving One-Step and Two-Step Inequalities",
      description:
        "Solve one-step and two-step inequalities with rational number coefficients. Understand that multiplying or dividing both sides by a negative number reverses the inequality sign.",
      gradeLevel: 7,
      strand: "Algebra",
      difficulty: 2,
      prerequisites: ["7.iq.1", "7.ee.3"],
      sampleProblems: [
        "Solve and graph: -4x > 20.",
        "Solve: 2x - 7 <= 15. Graph the solution set.",
        "Solve: (m / -3) + 5 >= 8. Explain why the inequality symbol changes direction.",
      ],
      isVerifiable: true,
      order: 11,
    },

    // ─── Strand 4: Proportional Relationships (TEKS 7.4-7.5) ─────────────
    {
      id: "7.pr.1",
      tpiCode: "7.4B",
      name: "Constant of Proportionality and Unit Rates",
      description:
        "Identify the constant of proportionality (unit rate) in tables, graphs, equations, and verbal descriptions. Compute unit rates with complex fractions (e.g., 1/2 mile per 1/4 hour).",
      gradeLevel: 7,
      strand: "Ratios & Proportional Relationships",
      difficulty: 1,
      prerequisites: ["6.rp.1", "6.rp.2"],
      sampleProblems: [
        "A recipe uses 2/3 cup of sugar for every 1/2 batch. What is the unit rate of sugar per batch?",
        "The table shows that 3 pounds of apples cost $5.25 and 7 pounds cost $12.25. Is this a proportional relationship? If so, find the constant of proportionality.",
        "Identify the constant of proportionality in the equation y = 4.5x.",
      ],
      isVerifiable: true,
      order: 12,
    },
    {
      id: "7.pr.2",
      tpiCode: "7.4C",
      name: "Proportional vs. Non-Proportional Relationships",
      description:
        "Distinguish between proportional and non-proportional linear relationships using tables, graphs, and equations. Recognize that proportional graphs pass through the origin and have a constant ratio y/x.",
      gradeLevel: 7,
      strand: "Ratios & Proportional Relationships",
      difficulty: 2,
      prerequisites: ["6.rp.1", "7.pr.1"],
      sampleProblems: [
        "Does the table represent a proportional relationship? x: 2, 4, 6; y: 5, 10, 15. Explain.",
        "A gym charges a $25 sign-up fee plus $30 per month. Is the total cost proportional to the number of months? Explain using a graph or table.",
      ],
      isVerifiable: true,
      order: 13,
    },
    {
      id: "7.pr.3",
      tpiCode: "7.4D",
      name: "Percent Increase and Decrease",
      description:
        "Calculate percent increase and percent decrease. Apply the percent change formula and solve real-world problems involving growth and reduction.",
      gradeLevel: 7,
      strand: "Ratios & Proportional Relationships",
      difficulty: 2,
      prerequisites: ["6.rp.3", "7.ns.3"],
      sampleProblems: [
        "A shirt originally costs $40 and is now $52. What is the percent increase?",
        "A town's population decreased from 12,000 to 10,200. Find the percent decrease.",
        "An item's price increased by 15% to $69. What was the original price?",
      ],
      isVerifiable: true,
      order: 14,
    },
    {
      id: "7.pr.4",
      tpiCode: "7.4E",
      name: "Markup, Markdown, Tax, Tip, and Commission",
      description:
        "Solve real-world problems involving markup, markdown (discount), sales tax, tips, and commission. Calculate the final price or the original price when given a percent adjustment.",
      gradeLevel: 7,
      strand: "Ratios & Proportional Relationships",
      difficulty: 2,
      prerequisites: ["6.rp.3", "7.pr.3"],
      sampleProblems: [
        "A store buys a jacket for $35 and marks it up 60%. What is the selling price?",
        "A meal costs $28.50. If the sales tax is 8.25% and you leave a 20% tip on the pre-tax amount, what is the total cost?",
        "A realtor earns a 3% commission on home sales. How much does she earn on a $275,000 home?",
      ],
      isVerifiable: true,
      order: 15,
    },
    {
      id: "7.pr.5",
      tpiCode: "7.4F",
      name: "Simple Interest",
      description:
        "Use the simple interest formula I = Prt to solve problems involving savings accounts, loans, and investments. Calculate interest, total amount, principal, rate, or time.",
      gradeLevel: 7,
      strand: "Ratios & Proportional Relationships",
      difficulty: 3,
      prerequisites: ["7.pr.3", "7.ee.3"],
      sampleProblems: [
        "You deposit $1,200 in a savings account that earns 3.5% simple interest per year. How much interest do you earn in 4 years?",
        "A loan of $5,000 accrues $750 in simple interest over 3 years. What is the annual interest rate?",
      ],
      isVerifiable: true,
      order: 16,
    },

    // ─── Strand 5: Linear Relationships (TEKS 7.7) ───────────────────────
    {
      id: "7.lr.1",
      tpiCode: "7.7A",
      name: "Representing Linear Relationships",
      description:
        "Represent linear relationships using tables, graphs, equations, and verbal descriptions. Generate a table of values from an equation, plot ordered pairs, and connect representations.",
      gradeLevel: 7,
      strand: "Algebra",
      difficulty: 2,
      prerequisites: ["6.ee.2", "7.pr.1"],
      sampleProblems: [
        "Complete the table for y = 2x - 3 using x-values -2, 0, 1, 4. Then graph the ordered pairs.",
        "A plumber charges $50 for a house call plus $35 per hour. Write an equation, make a table for 0 to 5 hours, and describe the graph.",
        "From the graph of a line passing through (0, 4) and (3, 10), write the equation of the line.",
      ],
      isVerifiable: true,
      order: 17,
      requiresImage: true,
      imageType: 'coordinate-plane',
    },
    {
      id: "7.lr.2",
      tpiCode: "7.7A",
      name: "Slope and Rate of Change",
      description:
        "Understand slope as the rate of change (rise over run) of a linear relationship. Calculate slope from two points, a table, or a graph and interpret its meaning in context.",
      gradeLevel: 7,
      strand: "Algebra",
      difficulty: 2,
      prerequisites: ["7.pr.1", "7.lr.1"],
      sampleProblems: [
        "Find the slope of the line passing through (-1, 3) and (2, -6).",
        "A candle is 12 inches tall and burns at a rate of 0.5 inches per hour. What is the slope? What does it represent?",
        "From a table: x: 1, 3, 5; y: 8, 14, 20. Find the rate of change.",
      ],
      isVerifiable: true,
      order: 18,
      requiresImage: true,
      imageType: 'coordinate-plane',
    },
    {
      id: "7.lr.3",
      tpiCode: "7.7A",
      name: "Y-Intercept and Direct Variation",
      description:
        "Identify the y-intercept of a linear relationship from a graph, table, or equation. Recognize direct variation (y = kx) as a special linear relationship where the y-intercept is 0.",
      gradeLevel: 7,
      strand: "Algebra",
      difficulty: 2,
      prerequisites: ["7.lr.1", "7.lr.2", "7.pr.2"],
      sampleProblems: [
        "Identify the slope and y-intercept of y = -3x + 7. What does the y-intercept represent if this models a bank balance over time?",
        "Does y = 4x represent direct variation? Explain. What is the constant of variation?",
        "A graph passes through (0, 0) and (5, 15). Is this a direct variation? Write the equation.",
      ],
      isVerifiable: true,
      order: 19,
      requiresImage: true,
      imageType: 'coordinate-plane',
    },

    // ─── Strand 6: Proportional Geometry (TEKS 7.5) ──────────────────────
    {
      id: "7.pg.1",
      tpiCode: "7.5A",
      name: "Scale Drawings and Scale Factors",
      description:
        "Use scale factors to solve problems involving scale drawings and maps. Determine actual distances from a scale drawing and create scale drawings given dimensions and a scale.",
      gradeLevel: 7,
      strand: "Geometry & Measurement",
      difficulty: 2,
      prerequisites: ["6.rp.1", "6.rp.2", "7.pr.1"],
      sampleProblems: [
        "On a map, 1 inch represents 25 miles. Two cities are 3.5 inches apart on the map. What is the actual distance?",
        "A blueprint has a scale of 1 cm : 2.5 m. A room measures 6 cm by 4.8 cm on the blueprint. What are the actual dimensions?",
        "An architect creates a drawing with a scale factor of 1:50. If a wall is actually 15 meters long, how long is it on the drawing?",
      ],
      isVerifiable: true,
      order: 20,
    },
    {
      id: "7.pg.2",
      tpiCode: "7.5B",
      name: "Similar Figures and Proportional Reasoning",
      description:
        "Identify similar figures and use proportions to find missing side lengths. Understand that corresponding angles are congruent and corresponding sides are proportional in similar figures.",
      gradeLevel: 7,
      strand: "Geometry & Measurement",
      difficulty: 2,
      prerequisites: ["6.rp.2", "7.pg.1", "7.pr.1"],
      sampleProblems: [
        "Triangle ABC is similar to triangle DEF. If AB = 6, BC = 8, DE = 9, find EF.",
        "A flagpole casts a shadow 12 feet long. A 5-foot person standing nearby casts a 3-foot shadow. How tall is the flagpole?",
        "Two rectangles are similar. The first is 4 cm by 6 cm. The second has a width of 10 cm. Find its length.",
      ],
      isVerifiable: true,
      order: 21,
    },
  ],
};
