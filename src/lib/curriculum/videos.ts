import curatedYouTube from './youtube-videos.json';
/**
 * Curated "watch before you work" videos for every curriculum topic (grades 3-8).
 *
 * Linking strategy (deliberately conservative so printed QR codes never rot):
 * - Khan Academy links point at COURSE-level (or long-stable unit-level) URLs,
 *   never deep lesson/video slugs, which Khan reshuffles. Titles name the unit
 *   to look for once the kid lands on the course page.
 * - Math Antics links use their channel-search URL (stable @mathantics handle),
 *   which always resolves and surfaces the right video at the top.
 * - Plain YouTube links use the results search URL, which cannot 404.
 * - getVideosForTopic() ALWAYS appends a Khan Academy site-search fallback, so
 *   every topic yields at least one working link.
 */

export interface TopicVideo {
  title: string;
  url: string;
  source: 'Khan Academy' | 'YouTube' | 'Math Antics';
  /** Approximate length in minutes, when known. */
  minutes?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Link builders
// ─────────────────────────────────────────────────────────────────────────────

const KA_MATH = 'https://www.khanacademy.org/math';

/** Grade → stable Khan Academy Common-Core course. */
const KA_COURSES: Record<number, { url: string; label: string }> = {
  3: { url: `${KA_MATH}/cc-third-grade-math`, label: '3rd grade' },
  4: { url: `${KA_MATH}/cc-fourth-grade-math`, label: '4th grade' },
  5: { url: `${KA_MATH}/cc-fifth-grade-math`, label: '5th grade' },
  6: { url: `${KA_MATH}/cc-sixth-grade-math`, label: '6th grade' },
  7: { url: `${KA_MATH}/cc-seventh-grade-math`, label: '7th grade' },
  8: { url: `${KA_MATH}/cc-eighth-grade-math`, label: '8th grade' },
  // Pseudo-grades for HS-credit courses taken in middle school. Their topics
  // have no per-topic curated entries yet — the gradeLevel safety net below
  // sends kids to the right KA course, and the search fallback does the rest.
  9: { url: `${KA_MATH}/algebra`, label: 'Algebra 1' },
  10: { url: `${KA_MATH}/geometry`, label: 'Geometry' },
};

const KA_ALGEBRA_BASICS = `${KA_MATH}/algebra-basics`;
const KA_PERSONAL_FINANCE =
  'https://www.khanacademy.org/college-careers-more/personal-finance';

/** Khan Academy course-level link with a descriptive "which unit to open" title. */
function ka(grade: 3 | 4 | 5 | 6 | 7 | 8, unitLabel: string): TopicVideo {
  const course = KA_COURSES[grade];
  return {
    title: `Khan Academy: ${course.label} — ${unitLabel}`,
    url: course.url,
    source: 'Khan Academy',
  };
}

/** Khan Academy link with an explicit URL (unit-level or cross-course). */
function kaUrl(title: string, url: string): TopicVideo {
  return { title, url, source: 'Khan Academy' };
}

/** Math Antics channel search — always lands on their catalog for the query. */
function antics(videoName: string, query: string): TopicVideo {
  return {
    title: `Math Antics: ${videoName}`,
    url: `https://www.youtube.com/@mathantics/search?query=${encodeURIComponent(query)}`,
    source: 'Math Antics',
  };
}

/** Plain YouTube search — cannot 404. */
function yt(query: string, label?: string): TopicVideo {
  return {
    title: `YouTube search: ${label ?? query}`,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    source: 'YouTube',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Curated videos per topic id (every topic in grades 3-8 has an entry)
// ─────────────────────────────────────────────────────────────────────────────

const TOPIC_VIDEOS: Record<string, TopicVideo[]> = {
  // ───────────────────────────────────────────────────────────────────────────
  // Grade 3 — Eanes ISD (21 topics)
  // ───────────────────────────────────────────────────────────────────────────
  '3.nbt.1': [ka(3, 'Place value unit'), antics('Place Value', 'place value')],
  '3.nbt.2': [ka(3, 'Place value: comparing whole numbers'), antics('Place Value', 'place value')],
  '3.nbt.3': [ka(3, 'Addition and subtraction within 1,000'), antics('Multi-Digit Addition', 'multi-digit addition')],
  '3.nbt.4': [ka(3, 'Addition and subtraction within 1,000'), antics('Multi-Digit Subtraction', 'multi-digit subtraction')],
  '3.nbt.5': [
    kaUrl('Khan Academy: 3rd grade — Intro to multiplication unit', `${KA_MATH}/cc-third-grade-math/intro-to-multiplication`),
    antics('Basic Multiplication', 'basic multiplication'),
  ],
  '3.nbt.6': [ka(3, 'Intro to division unit'), antics('Basic Division', 'basic division')],
  '3.nbt.7': [ka(3, 'Rounding and estimation'), antics('Rounding', 'rounding')],
  '3.frac.1': [ka(3, 'Understand fractions unit'), antics('Fractions Are Parts', 'fractions')],
  '3.frac.2': [ka(3, 'Comparing fractions'), antics('Comparing Fractions', 'comparing fractions')],
  '3.frac.3': [ka(3, 'Equivalent fractions'), antics('Equivalent Fractions', 'equivalent fractions')],
  '3.alg.1': [ka(3, 'Patterns in arithmetic'), antics('Number Patterns', 'number patterns')],
  '3.alg.2': [ka(3, 'Patterns and problem solving'), antics('Number Patterns', 'number patterns')],
  '3.alg.3': [ka(3, 'Multiplication and division: missing values'), antics('Basic Division', 'basic division')],
  '3.geo.1': [ka(3, 'Shapes and their attributes'), antics('Polygons', 'polygons')],
  '3.geo.2': [ka(3, 'Area unit'), antics('Area', 'area')],
  '3.geo.3': [ka(3, 'Perimeter unit'), antics('Perimeter', 'perimeter')],
  '3.meas.1': [ka(3, 'Measurement unit'), antics('Intro to the Metric System', 'metric system')],
  '3.meas.2': [ka(3, 'Time unit'), antics('Telling Time', 'telling time')],
  '3.meas.3': [ka(3, 'Mass and volume measurement'), yt('liquid volume and mass 3rd grade math')],
  '3.data.1': [ka(3, 'Represent and interpret data'), antics('Data and Graphs', 'data and graphs')],
  '3.data.2': [ka(3, 'Represent and interpret data: bar graphs'), antics('Data and Graphs', 'data and graphs')],

  // ───────────────────────────────────────────────────────────────────────────
  // Grade 4 — Eanes ISD (24 topics)
  // ───────────────────────────────────────────────────────────────────────────
  '4.nbt.1': [ka(4, 'Place value unit'), antics('Place Value', 'place value')],
  '4.nbt.2': [ka(4, 'Place value: comparing multi-digit numbers'), antics('Place Value', 'place value')],
  '4.nbt.3': [ka(4, 'Rounding whole numbers'), antics('Rounding', 'rounding')],
  '4.nbt.4': [ka(4, 'Multi-digit addition and subtraction'), antics('Multi-Digit Addition & Subtraction', 'multi-digit')],
  '4.nbt.5': [ka(4, 'Multiply by 1-digit numbers'), antics('Multi-Digit Multiplication', 'multi-digit multiplication')],
  '4.nbt.6': [
    kaUrl('Khan Academy: 4th grade — Multiplying by 2-digit numbers unit', `${KA_MATH}/cc-fourth-grade-math/multiplying-by-2-digit-numbers`),
    antics('Multi-Digit Multiplication', 'multi-digit multiplication'),
  ],
  '4.nbt.7': [ka(4, 'Division unit'), antics('Long Division', 'long division')],
  '4.nbt.8': [ka(4, 'Estimation and rounding'), antics('Rounding', 'rounding')],
  '4.nf.1': [ka(4, 'Equivalent fractions unit'), antics('Equivalent Fractions', 'equivalent fractions')],
  '4.nf.2': [ka(4, 'Comparing fractions'), antics('Comparing Fractions', 'comparing fractions')],
  '4.nf.3': [ka(4, 'Add and subtract fractions'), antics('Adding and Subtracting Fractions', 'adding and subtracting fractions')],
  '4.nf.4': [ka(4, 'Understand decimals unit'), antics('Fractions and Decimals', 'fractions and decimals')],
  '4.nf.5': [ka(4, 'Understand decimals: comparing decimals'), antics('Decimal Place Value', 'decimal place value')],
  '4.oa.1': [ka(4, 'Multi-step word problems'), yt('multi-step word problems 4th grade')],
  '4.oa.2': [ka(4, 'Equations with unknowns'), antics('Solving Basic Equations', 'solving basic equations')],
  '4.oa.3': [ka(4, 'Factors, multiples and patterns'), antics('Number Patterns', 'number patterns')],
  '4.g.1': [ka(4, 'Plane figures: lines, rays and angles'), antics('Points, Lines & Planes', 'points lines planes')],
  '4.g.2': [ka(4, 'Measuring angles'), antics('Angles and Degrees', 'angles')],
  '4.g.3': [ka(4, 'Lines of symmetry and line relationships'), antics('Points, Lines & Planes', 'points lines planes')],
  '4.md.1': [ka(4, 'Units of measurement'), antics('Intro to the Metric System', 'metric system')],
  '4.md.2': [ka(4, 'Area and perimeter'), antics('Area and Perimeter', 'area perimeter')],
  '4.md.3': [ka(4, 'Units of measurement: time'), antics('Telling Time', 'telling time')],
  '4.da.1': [ka(4, 'Represent and interpret data'), antics('Data and Graphs', 'data and graphs')],
  '4.da.2': [ka(4, 'Represent and interpret data'), antics('Data and Graphs', 'data and graphs')],

  // ───────────────────────────────────────────────────────────────────────────
  // Grade 5 — Eanes ISD (19 topics)
  // ───────────────────────────────────────────────────────────────────────────
  '5.dc.1': [ka(5, 'Decimal place value unit'), antics('Decimal Place Value', 'decimal place value')],
  '5.dc.2': [ka(5, 'Decimal place value: comparing decimals'), antics('Decimal Place Value', 'decimal place value')],
  '5.dc.3': [ka(5, 'Decimal place value: rounding decimals'), antics('Rounding', 'rounding')],
  '5.ns.1': [
    kaUrl('Khan Academy: Factors, multiples and primes (4th grade course)', KA_COURSES[4].url),
    antics('Factoring', 'factoring'),
  ],
  '5.op.1': [ka(5, 'Algebraic thinking: order of operations'), antics('Order of Operations', 'order of operations')],
  '5.op.2': [ka(5, 'Multi-digit multiplication and division'), antics('Multi-Digit Multiplication', 'multi-digit multiplication')],
  '5.op.3': [ka(5, 'Multi-digit multiplication and division'), antics('Long Division with 2-Digit Divisors', 'long division')],
  '5.op.4': [ka(5, 'Estimation with whole numbers'), antics('Rounding', 'rounding')],
  '5.dc.4': [ka(5, 'Multiply decimals unit'), antics('Decimal Arithmetic', 'decimal arithmetic')],
  '5.dc.5': [ka(5, 'Divide decimals unit'), antics('Decimal Arithmetic', 'decimal arithmetic')],
  '5.fr.1': [ka(5, 'Add and subtract fractions'), antics('Adding and Subtracting Fractions', 'adding and subtracting fractions')],
  '5.fr.2': [ka(5, 'Multiply fractions unit'), antics('Multiplying Fractions', 'multiplying fractions')],
  '5.fr.3': [ka(5, 'Divide fractions unit'), antics('Dividing Fractions', 'dividing fractions')],
  '5.fr.4': [ka(5, 'Divide fractions unit'), antics('Dividing Fractions', 'dividing fractions')],
  '5.fr.5': [ka(5, 'Fraction and decimal word problems'), yt('fraction and decimal word problems 5th grade')],
  '5.pa.1': [ka(5, 'Algebraic thinking: number patterns'), antics('Number Patterns', 'number patterns')],
  '5.pa.2': [ka(5, 'Coordinate plane unit'), antics('Graphing on the Coordinate Plane', 'graphing on the coordinate plane')],
  '5.al.1': [ka(5, 'Algebraic thinking unit'), antics('What Is Algebra?', 'what is algebra')],
  '5.al.2': [ka(5, 'Algebraic thinking: order of operations'), antics('Order of Operations', 'order of operations')],

  // ───────────────────────────────────────────────────────────────────────────
  // Grade 6 — Eanes ISD bridge (26 topics)
  // ───────────────────────────────────────────────────────────────────────────
  '6.ns.1': [ka(6, 'Negative numbers and the number system'), yt('classifying rational numbers 6th grade')],
  '6.ns.2': [ka(6, 'Negative numbers unit'), antics('Negative Numbers', 'negative numbers')],
  '6.ns.3': [ka(6, 'Negative numbers: absolute value'), antics('Absolute Value', 'absolute value')],
  '6.ns.4': [ka(6, 'Multiply and divide fractions'), antics('Dividing Fractions', 'dividing fractions')],
  '6.ns.5': [ka(6, 'Arithmetic with decimals'), antics('Decimal Arithmetic', 'decimal arithmetic')],
  '6.rr.1': [ka(6, 'Ratios unit'), antics('Ratios and Rates', 'ratios and rates')],
  '6.rr.2': [ka(6, 'Rates and unit rates'), antics('Ratios and Rates', 'ratios and rates')],
  '6.rr.3': [ka(6, 'Equivalent ratios and ratio tables'), antics('Proportions', 'proportions')],
  '6.rr.4': [ka(6, 'Rates and unit conversions'), antics('Converting Units', 'converting units')],
  '6.ee.1': [ka(6, 'Exponents and order of operations'), antics('Order of Operations', 'order of operations')],
  '6.ee.2': [ka(6, 'Variables and expressions'), antics('What Is Algebra?', 'what is algebra')],
  '6.ee.3': [ka(6, 'Equivalent expressions'), antics('The Distributive Property', 'distributive property')],
  '6.ee.4': [ka(6, 'Equations and inequalities'), antics('Solving Basic Equations', 'solving basic equations')],
  '6.ee.5': [ka(6, 'Equations and inequalities: one-step equations'), antics('Solving Basic Equations', 'solving basic equations')],
  '6.cp.1': [ka(6, 'Coordinate plane: all four quadrants'), antics('Graphing on the Coordinate Plane', 'graphing on the coordinate plane')],
  '6.cp.2': [ka(6, 'Coordinate plane: distances between points'), antics('Graphing on the Coordinate Plane', 'graphing on the coordinate plane')],
  '6.pr.1': [ka(6, 'Percents: fractions, decimals and percents'), antics('Percents and Equivalent Fractions', 'percents')],
  '6.pr.2': [ka(6, 'Percents: percent of a number'), antics('Finding a Percent of a Number', 'percent of a number')],
  '6.pr.3': [ka(6, 'Percent word problems'), antics('Percents: Missing Total', 'percent missing total')],
  '6.gm.1': [ka(6, 'Areas of triangles, parallelograms and trapezoids'), antics('Area', 'area')],
  '6.gm.2': [ka(6, 'Geometry: volume of rectangular prisms'), antics('Volume', 'volume')],
  '6.gm.3': [ka(6, 'Geometry: nets and surface area'), yt('surface area with nets 6th grade')],
  '6.ms.1': [ka(6, 'Unit conversions'), antics('Intro to the Metric System', 'metric system')],
  '6.da.1': [ka(6, 'Data and statistics: mean, median and mode'), antics('Mean, Median and Mode', 'mean median mode')],
  '6.da.2': [ka(6, 'Data and statistics: dot plots'), antics('Data and Graphs', 'data and graphs')],
  '6.da.3': [ka(6, 'Data and statistics: box plots'), yt('box and whisker plots 6th grade')],

  // ───────────────────────────────────────────────────────────────────────────
  // Grade 7 — Eanes ISD (47 topics)
  // ───────────────────────────────────────────────────────────────────────────
  '7.ns.1': [ka(7, 'Fractions, decimals and percentages'), antics('Negative Numbers', 'negative numbers')],
  '7.ns.2': [ka(7, 'Fractions, decimals and percentages'), antics('Negative Numbers', 'negative numbers')],
  '7.ns.3': [ka(7, 'Fractions, decimals and percentages: conversions'), antics('Converting Any Fraction', 'converting fractions')],
  '7.ns.4': [ka(7, 'Negative numbers: addition and subtraction'), antics('Adding and Subtracting Integers', 'integers')],
  '7.ns.5': [ka(7, 'Negative numbers: multiplication and division'), antics('Integer Multiplication and Division', 'integer multiplication')],
  '7.ee.1': [ka(7, 'Expressions, equations and inequalities: like terms'), antics('Simplifying Expressions', 'simplifying')],
  '7.ee.2': [ka(7, 'Expressions: the distributive property'), antics('The Distributive Property', 'distributive property')],
  '7.ee.3': [ka(7, 'Two-step equations'), antics('Solving 2-Step Equations', 'solving 2-step equations')],
  '7.ee.4': [ka(7, 'Two-step equation word problems'), yt('writing two-step equations from word problems')],
  '7.iq.1': [ka(7, 'Expressions, equations and inequalities'), yt('writing and graphing inequalities 7th grade')],
  '7.iq.2': [ka(7, 'Expressions, equations and inequalities'), yt('solving two-step inequalities 7th grade')],
  '7.pr.1': [ka(7, 'Rates and proportional relationships'), antics('Proportions', 'proportions')],
  '7.pr.2': [ka(7, 'Rates and proportional relationships'), antics('Proportions', 'proportions')],
  '7.pr.3': [ka(7, 'Percents: percent increase and decrease'), antics('Percents', 'percent')],
  '7.pr.4': [ka(7, 'Percent word problems: tax, tip and discount'), yt('tax tip and discount word problems 7th grade')],
  '7.pr.5': [ka(7, 'Percent word problems: simple interest'), yt('simple interest formula 7th grade')],
  '7.lr.1': [ka(7, 'Proportional relationships and graphs'), antics('Graphing on the Coordinate Plane', 'graphing on the coordinate plane')],
  '7.lr.2': [kaUrl('Khan Academy: Algebra basics — slope and graphing lines', KA_ALGEBRA_BASICS), antics('Slope and Distance', 'slope')],
  '7.lr.3': [kaUrl('Khan Academy: Algebra basics — linear equations and functions', KA_ALGEBRA_BASICS), antics('Basic Linear Functions', 'linear functions')],
  '7.pg.1': [ka(7, 'Geometry: scale copies and scale drawings'), yt('scale drawings 7th grade math')],
  '7.pg.2': [ka(7, 'Geometry: similar figures'), yt('similar figures and proportions 7th grade')],
  '7.ee.5': [ka(7, 'Equations and inequalities on number lines'), yt('graphing inequalities on a number line')],
  '7.ee.6': [ka(7, 'Expressions, equations and inequalities'), yt('writing word problems from equations')],
  '7.ee.7': [ka(7, 'Expressions, equations and inequalities'), antics('Solving Basic Equations', 'solving basic equations')],
  '7.pr.6': [ka(7, 'Rates and proportional relationships'), antics('Proportions', 'proportions')],
  '7.pr.7': [ka(7, 'Converting between measurement systems'), antics('Converting Units', 'converting units')],
  '7.lr.4': [kaUrl('Khan Academy: Algebra basics — slope-intercept form (y = mx + b)', KA_ALGEBRA_BASICS), antics('Basic Linear Functions', 'linear functions')],
  '7.lr.5': [kaUrl('Khan Academy: Algebra basics — writing linear equations', KA_ALGEBRA_BASICS), yt('writing linear equations from tables and graphs')],
  '7.pg.3': [ka(7, 'Geometry: similar and congruent figures'), yt('similar vs congruent figures')],
  '7.pg.4': [ka(7, 'Geometry: similar figures'), yt('missing side lengths similar figures proportions')],
  '7.pg.5': [ka(7, 'Geometry: scale drawings'), yt('scale factor and scale drawings')],
  '7.cg.1': [ka(7, 'Geometry: circles'), antics('Circles, What Is PI?', 'pi')],
  '7.cg.2': [ka(7, 'Geometry: area and circumference of circles'), antics('Circles: Circumference and Area', 'circumference')],
  '7.cg.3': [ka(7, 'Geometry: area of composite figures'), yt('area of composite figures 7th grade')],
  '7.cg.4': [ka(7, 'Geometry: angle relationships'), antics('Angle Basics', 'angles')],
  '7.cg.5': [ka(7, 'Geometry: triangle angles'), antics('Triangles', 'triangles')],
  '7.vl.1': [ka(7, 'Geometry: volume and surface area'), antics('Volume', 'volume')],
  '7.vl.2': [ka(7, 'Geometry: volume and surface area'), yt('volume of pyramids')],
  '7.vl.3': [ka(7, 'Geometry: surface area with nets'), yt('surface area using nets')],
  '7.st.1': [ka(7, 'Statistics and probability'), yt('box plots and dot plots 7th grade')],
  '7.st.2': [ka(7, 'Statistics: comparing data sets'), antics('Mean, Median and Mode', 'mean median mode')],
  '7.st.3': [ka(7, 'Statistics: random sampling'), yt('random samples and making inferences 7th grade')],
  '7.pf.1': [kaUrl('Khan Academy: Personal finance course', KA_PERSONAL_FINANCE), yt('net worth assets and liabilities explained')],
  '7.pf.2': [kaUrl('Khan Academy: Personal finance course', KA_PERSONAL_FINANCE), yt('what is a credit report and credit score')],
  '7.pf.3': [kaUrl('Khan Academy: Personal finance course', KA_PERSONAL_FINANCE), yt('debit card vs credit card explained')],
  '7.pf.4': [kaUrl('Khan Academy: Personal finance course', KA_PERSONAL_FINANCE), yt('cost of a loan simple interest explained')],
  '7.pf.5': [kaUrl('Khan Academy: Personal finance course', KA_PERSONAL_FINANCE), yt('saving for college explained')],

  // ───────────────────────────────────────────────────────────────────────────
  // Grade 8 — Eanes ISD (35 topics)
  // ───────────────────────────────────────────────────────────────────────────
  '8.rn.1': [ka(8, 'Numbers and operations: irrational numbers'), yt('rational and irrational numbers 8th grade')],
  '8.rn.2': [ka(8, 'Numbers and operations: approximating irrationals'), yt('approximating square roots on a number line')],
  '8.rn.3': [ka(8, 'Numbers and operations: scientific notation'), antics('Scientific Notation', 'scientific notation')],
  '8.rn.4': [ka(8, 'Numbers and operations: ordering real numbers'), yt('ordering real numbers with square roots and pi')],
  '8.sl.1': [ka(8, 'Linear equations and functions: slope'), antics('Slope and Distance', 'slope')],
  '8.sl.2': [ka(8, 'Linear equations and functions: proportional relationships'), antics('Proportions', 'proportions')],
  '8.sl.3': [ka(8, 'Linear equations and functions: slope and intercepts'), antics('Slope and Distance', 'slope')],
  '8.sl.4': [ka(8, 'Linear equations and functions: y = kx'), antics('Proportions', 'proportions')],
  '8.sl.5': [ka(8, 'Linear equations and functions: slope-intercept form'), antics('Basic Linear Functions', 'linear functions')],
  '8.sl.6': [ka(8, 'Linear equations and functions: word problems'), yt('linear equation word problems 8th grade')],
  '8.sl.7': [ka(8, 'Linear equations and functions: proportional vs non-proportional'), antics('Proportions', 'proportions')],
  '8.sl.8': [ka(8, 'Linear equations and functions'), yt('proportional vs non-proportional functions examples')],
  '8.sl.9': [ka(8, 'Linear equations and functions: writing y = mx + b'), antics('Basic Linear Functions', 'linear functions')],
  '8.fn.1': [ka(8, 'Linear equations and functions: recognizing functions'), antics('What Are Functions?', 'functions')],
  '8.sc.1': [ka(8, 'Data and modeling: scatter plots'), yt('scatter plots positive negative association')],
  '8.sc.2': [ka(8, 'Data and modeling: trend lines'), yt('line of best fit making predictions')],
  '8.sc.3': [ka(8, 'Data and modeling: constructing scatter plots'), yt('how to construct a scatter plot')],
  '8.sc.4': [
    kaUrl('Khan Academy: Mean absolute deviation (6th grade statistics unit)', KA_COURSES[6].url),
    yt('mean absolute deviation MAD'),
  ],
  '8.eq.1': [ka(8, 'Solving equations with one unknown'), yt('writing equations with variables on both sides')],
  '8.eq.2': [ka(8, 'Solving equations with one unknown'), antics('Solving 2-Step Equations', 'solving 2-step equations')],
  '8.eq.3': [ka(8, 'Solving equations: number of solutions'), yt('one solution no solution infinitely many solutions')],
  '8.sy.1': [ka(8, 'Systems of equations'), yt('solving systems of equations by graphing')],
  '8.vl.1': [ka(8, 'Geometry: volume of cylinders, cones and spheres'), antics('Volume', 'volume')],
  '8.vl.2': [ka(8, 'Geometry: surface area'), yt('surface area of prisms and cylinders')],
  '8.py.1': [ka(8, 'Geometry: Pythagorean theorem'), antics('The Pythagorean Theorem', 'pythagorean theorem')],
  '8.py.2': [ka(8, 'Geometry: Pythagorean theorem applications'), antics('The Pythagorean Theorem', 'pythagorean theorem')],
  '8.py.3': [ka(8, 'Geometry: Pythagorean theorem and distance'), antics('Slope and Distance', 'slope and distance')],
  '8.ag.1': [ka(8, 'Geometry: angles between intersecting lines'), yt('parallel lines cut by a transversal angle relationships')],
  '8.dl.1': [ka(8, 'Geometry: transformations and dilations'), yt('dilations on the coordinate plane')],
  '8.tr.1': [ka(8, 'Geometry: transformations (translations)'), yt('translations on the coordinate plane')],
  '8.tr.2': [ka(8, 'Geometry: transformations (reflections)'), yt('reflections on the coordinate plane')],
  '8.tr.3': [ka(8, 'Geometry: transformations (rotations)'), yt('rotations 90 180 270 about the origin')],
  '8.pf.1': [kaUrl('Khan Academy: Personal finance — interest and debt', KA_PERSONAL_FINANCE), yt('simple vs compound interest explained')],
  '8.pf.2': [kaUrl('Khan Academy: Personal finance — credit cards', KA_PERSONAL_FINANCE), yt('how credit card interest works')],
  '8.pf.3': [kaUrl('Khan Academy: Personal finance — paying for college', KA_PERSONAL_FINANCE), yt('ways to pay for college explained')],
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/** 1-3 curated videos for a topic, ALWAYS ending with a can't-404 search link. */
// ── Exact YouTube videos, one per topic ──────────────────────────────────────
// Curated by scripts/curate-youtube-videos.ts from live YouTube search
// (Khan Academy's official channel + Math Antics), each verified via oEmbed.
// YouTube plays instantly with no login — the primary link for every topic.

interface YouTubePick {
  id: string;
  title: string;
  channel: string;
  seconds: number;
}
const YOUTUBE_PICKS: Record<string, YouTubePick> = curatedYouTube as Record<string, YouTubePick>;

/** The single exact video to watch for a topic (null if none curated). */
export function getExactVideo(topicId: string): (TopicVideo & { videoId: string }) | null {
  const pick = YOUTUBE_PICKS[topicId];
  if (!pick) return null;
  return {
    videoId: pick.id,
    title: pick.title,
    url: `https://www.youtube.com/watch?v=${pick.id}`,
    source: pick.channel.toLowerCase().includes('khan') ? 'Khan Academy' : 'YouTube',
    minutes: pick.seconds ? Math.max(1, Math.round(pick.seconds / 60)) : undefined,
  };
}

export function getVideosForTopic(topic: {
  id: string;
  name: string;
  strand: string;
  gradeLevel: number;
}): TopicVideo[] {
  // The exact YouTube video comes FIRST — that's the one to watch.
  const exact = getExactVideo(topic.id);
  const rest: TopicVideo[] = [];

  // One "go deeper" link: the hand-curated KA entry, or the course page.
  const kaEntry = (TOPIC_VIDEOS[topic.id] ?? [])[0];
  if (kaEntry) {
    rest.push(kaEntry);
  } else {
    const course = KA_COURSES[topic.gradeLevel];
    if (course) {
      rest.push({
        title: `Khan Academy: ${course.label} math course`,
        url: course.url,
        source: 'Khan Academy',
      });
    }
  }
  if (!exact) {
    rest.push({
      title: `Search YouTube: ${topic.name}`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`khan academy ${topic.name}`)}`,
      source: 'YouTube',
    });
  }

  return [...(exact ? [exact] : []), ...rest].slice(0, 3);
}

/** Absolute URL of the "watch before you work" page for a worksheet (QR target). */
export function watchPageUrl(worksheetId: string): string {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL || 'https://mathmaestro-tan.vercel.app'
  ).replace(/\/+$/, '');
  return `${base}/watch/${worksheetId}`;
}

/**
 * Build the printed "Watch first" payload for an already-stored worksheet
 * (used when re-rendering PDFs). One video per topic, capped at 4 rows —
 * the /watch page itself shows everything.
 */
export function buildWatchInput(
  worksheetId: string,
  topics: Array<{ id: string; name: string; strand: string; gradeLevel: number }>
): { url: string; videos: Array<{ topicName: string; title: string; minutes?: number }> } {
  const videos = topics.slice(0, 4).flatMap((t) => {
    const v = getVideosForTopic(t)[0];
    return v ? [{ topicName: t.name, title: v.title, minutes: v.minutes }] : [];
  });
  return { url: watchPageUrl(worksheetId), videos };
}
