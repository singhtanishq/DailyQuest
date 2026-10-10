import { sqlChallenge, type QuestTemplate } from './framework.js';

/**
 * SQL pool — every quest ships a SQLite fixture and a reference query whose
 * result set is verified against SQLite at generation time (when the sqlite3
 * binary is available). Amounts use integer cents to keep expected values
 * exact and float-free.
 */

const SHOP_SCHEMA = `CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'refunded')),
  created_at TEXT NOT NULL
);

INSERT INTO users (id, name, city) VALUES
  (1, 'Ada',    'London'),
  (2, 'Grace',  'Berlin'),
  (3, 'Linus',  'Helsinki'),
  (4, 'Edsger', 'Berlin');

INSERT INTO orders (id, user_id, amount_cents, status, created_at) VALUES
  (101, 1,  12000, 'paid',     '2026-01-05'),
  (102, 1,   8050, 'refunded', '2026-01-07'),
  (103, 2,  20000, 'paid',     '2026-01-09'),
  (104, 3,   4500, 'pending',  '2026-01-11'),
  (105, 2,   6000, 'paid',     '2026-01-15'),
  (106, 99,  7000, 'paid',     '2026-01-20');`;

export const sqlTemplates: QuestTemplate[] = [
  sqlChallenge({
    id: 'sql.revenue-per-city',
    category: 'sql',
    challengeType: 'sql',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['joins', 'group by', 'aggregation'],
    tags: ['joins', 'aggregation'],
    skills: ['JOIN + GROUP BY composition'],
    subcategories: ['aggregation'],
    title: 'The City Ledger',
    subtitle: 'Revenue by city, paid orders only.',
    description: 'Join users to orders, filter to paid, and aggregate per city.',
    schema: SHOP_SCHEMA,
    question:
      'Write a query that returns each city and the total `amount_cents` of its **paid** orders, as columns `city` and `total_cents`, ordered by total descending.',
    query: `SELECT u.city, SUM(o.amount_cents) AS total_cents
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.status = 'paid'
GROUP BY u.city
ORDER BY total_cents DESC;`,
    expectedColumns: ['city', 'total_cents'],
    expectedRows: [
      ['Berlin', '26000'],
      ['London', '12000'],
    ],
    explanation: [
      'Order 106 (user_id 99) has no matching user, so an INNER JOIN drops it — the orphan order is invisible to city revenue.',
      'Order 102 is refunded and order 104 is pending: the WHERE clause excludes both before grouping.',
      'Berlin appears twice (orders 103 and 105) and its sums add to 26000; London has one paid order of 12000.',
      'ORDER BY total_cents DESC ranks Berlin above London.',
    ],
    mistakes: [
      'Filtering status after aggregation — `WHERE` must run before `GROUP BY`.',
      'Using a LEFT JOIN and forgetting that the orphan order lands in a NULL city group.',
    ],
    hints: ['Which rows survive the status filter first?', 'The orphan order (user_id 99) — does an inner join keep it?'],
    objectives: ['Compose JOIN + WHERE + GROUP BY + ORDER BY', 'Reason about inner-join semantics'],
  }),

  sqlChallenge({
    id: 'sql.customers-no-orders',
    category: 'sql',
    challengeType: 'sql',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['anti-joins', 'not exists'],
    tags: ['joins', 'subqueries'],
    skills: ['Anti-join patterns'],
    subcategories: ['joins'],
    title: 'The Silent Customers',
    subtitle: 'Find who never ordered.',
    description: 'An anti-join: users without a single order.',
    schema: SHOP_SCHEMA,
    question:
      'Return the `name` of every user who has NO orders at all, ordered alphabetically.',
    query: `SELECT u.name
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id
)
ORDER BY u.name;`,
    expectedColumns: ['name'],
    expectedRows: [['Edsger']],
    explanation: [
      'Every user has orders except Edsger (id 4): orders reference users 1, 2, 3 — and 99, who is not a user.',
      'NOT EXISTS checks per user whether any order row matches; the correlated subquery returns no row for Edsger.',
      'A LEFT JOIN … WHERE o.id IS NULL reaches the same result; NOT IN also works but changes semantics when NULLs appear.',
    ],
    mistakes: [
      'Writing `WHERE o.user_id IS NULL` with an INNER JOIN — inner joins already removed those rows.',
      'Using NOT IN with a nullable subquery column: one NULL makes the whole NOT IN return nothing.',
    ],
    hints: ['Which anti-join shapes do you know — NOT EXISTS, LEFT JOIN + IS NULL, NOT IN?', 'Order 106 points at user 99, who does not exist. Does that affect the answer?'],
    objectives: ['Implement anti-joins idiomatically', 'Know the NOT IN + NULL trap'],
  }),

  sqlChallenge({
    id: 'sql.top-spender',
    category: 'sql',
    challengeType: 'sql',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['aggregation', 'sorting', 'limit'],
    tags: ['aggregation'],
    skills: ['Top-N aggregation'],
    subcategories: ['aggregation'],
    title: 'The Top Spender',
    subtitle: 'One name, the largest paid total.',
    description: 'Aggregate per user and pick the winner.',
    schema: SHOP_SCHEMA,
    question:
      'Return the `name` and `total_cents` (paid orders only) of the user with the highest total, as a single row.',
    query: `SELECT u.name, SUM(o.amount_cents) AS total_cents
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.status = 'paid'
GROUP BY u.id, u.name
ORDER BY total_cents DESC
LIMIT 1;`,
    expectedColumns: ['name', 'total_cents'],
    expectedRows: [['Grace', '26000']],
    explanation: [
      'Paid totals: Ada 12000 (order 101), Grace 26000 (103 + 105). Order 106 joins to nobody and vanishes.',
      'GROUP BY u.id (with u.name for display) aggregates per user; ORDER BY … DESC LIMIT 1 picks the top row.',
      'Ties would be broken arbitrarily — for production code add a deterministic tiebreaker like u.name.',
    ],
    mistakes: [
      'Ordering by an aliased aggregate in engines that disallow it — order by the full expression instead.',
      'Forgetting the status filter, which would pull the 8050 refund into Ada’s total.',
    ],
    hints: ['Aggregate per user first; only then pick the maximum.', 'LIMIT 1 after a DESC sort is the simplest top-1.'],
    objectives: ['Nest aggregation into top-N selection', 'Think about tie-breaking determinism'],
  }),

  sqlChallenge({
    id: 'sql.second-highest',
    category: 'sql',
    challengeType: 'sql',
    difficulty: 'hard',
    minutes: 20,
    concepts: ['subqueries', 'aggregation'],
    tags: ['subqueries', 'aggregation'],
    skills: ['Nested aggregates'],
    subcategories: ['subqueries'],
    title: 'The Runner-Up Amount',
    subtitle: 'Second distinct maximum, without OFFSET tricks.',
    description: 'A classic interview question: the second-highest distinct value.',
    schema: SHOP_SCHEMA,
    question:
      'Return the second **distinct** highest `amount_cents` among paid orders, as column `second_highest`. If no second value exists, the query should return one row with NULL.',
    query: `SELECT MAX(amount_cents) AS second_highest
FROM orders
WHERE status = 'paid'
  AND amount_cents < (
    SELECT MAX(amount_cents) FROM orders WHERE status = 'paid'
  );`,
    expectedColumns: ['second_highest'],
    expectedRows: [['12000']],
    explanation: [
      'Paid amounts are 12000, 20000, 6000, 7000 — distinct maximum is 20000.',
      'The inner query computes 20000; the outer MAX then runs over amounts strictly below it, yielding 12000.',
      'MAX over an empty set returns NULL (not zero rows), so the "no runner-up" case is naturally handled.',
    ],
    mistakes: [
      'Using LIMIT 1 OFFSET 1 without handling ties — duplicates shift the offset.',
      'Forgetting DISTINCT semantics when duplicates of the maximum exist.',
    ],
    hints: ['What is the maximum, and what are you really asked to maximize over?', 'Two-level MAX is a clean pattern: max of "everything below the max".'],
    objectives: ['Solve top-N-without-OFFSET problems', 'Know MAX’s empty-set behaviour'],
  }),

  sqlChallenge({
    id: 'sql.null-is-not-equal',
    category: 'sql',
    challengeType: 'sql',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['null semantics', 'three-valued logic'],
    tags: ['null'],
    skills: ['Three-valued logic'],
    subcategories: ['null-semantics'],
    title: 'The Unassignable Reports',
    subtitle: '= NULL matches nothing, by design.',
    description: 'Why NULL = NULL is not true, and what to write instead.',
    schema: `CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  manager_id INTEGER REFERENCES employees(id),
  salary INTEGER NOT NULL
);

INSERT INTO employees (id, name, manager_id, salary) VALUES
  (1, 'Ada',    NULL, 200),
  (2, 'Grace',  1,    180),
  (3, 'Linus',  1,    150),
  (4, 'Edsger', 2,    120);`,
    question:
      'A teammate wrote `SELECT * FROM employees WHERE manager_id = NULL` to find top-level employees and got zero rows. Explain why, then write a query returning the count of employees with no manager, as column `top_level`.',
    query: `SELECT COUNT(*) AS top_level
FROM employees
WHERE manager_id IS NULL;`,
    expectedColumns: ['top_level'],
    expectedRows: [['1']],
    explanation: [
      'NULL means "unknown": any comparison with NULL — even NULL = NULL — evaluates to UNKNOWN, which the WHERE clause treats as false.',
      'Only Ada (id 1) has manager_id NULL; the IS operator tests for it explicitly.',
      'The same rule explains why `NOT IN` with a NULL in the list never matches anything.',
    ],
    mistakes: [
      'Reaching for IS NOT NULL to find values that "are not null-ish" — there is no null-ish; it is binary.',
      'Assuming COUNT(*) and COUNT(manager_id) are the same — the latter skips NULLs.',
    ],
    hints: ['What are the three truth values in SQL?', 'Which operator exists specifically for NULL testing?'],
    objectives: ['Explain three-valued logic', 'Use IS NULL correctly in filters'],
  }),

  sqlChallenge({
    id: 'sql.window-rank',
    category: 'sql',
    challengeType: 'sql',
    difficulty: 'hard',
    minutes: 25,
    concepts: ['window functions', 'ranking'],
    tags: ['window-functions'],
    skills: ['Window function fluency'],
    subcategories: ['window-functions'],
    title: 'The Salary Podium',
    subtitle: 'Rank within each team, not globally.',
    description: 'RANK() OVER (PARTITION BY …) — per-group ordering without collapsing rows.',
    schema: `CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  manager_id INTEGER REFERENCES employees(id),
  salary INTEGER NOT NULL
);

INSERT INTO employees (id, name, manager_id, salary) VALUES
  (1, 'Ada',    NULL, 200),
  (2, 'Grace',  1,    180),
  (3, 'Linus',  1,    150),
  (4, 'Edsger', 2,    120);`,
    question:
      'For every employee WITH a manager, return `name` and `rnk` — their salary rank within their manager’s group (highest salary ranks 1). Order the output by manager_id, then rank.',
    query: `SELECT name,
       RANK() OVER (
         PARTITION BY manager_id
         ORDER BY salary DESC
       ) AS rnk
FROM employees
WHERE manager_id IS NOT NULL
ORDER BY manager_id, rnk;`,
    expectedColumns: ['name', 'rnk'],
    expectedRows: [
      ['Grace', '1'],
      ['Linus', '2'],
      ['Edsger', '1'],
    ],
    explanation: [
      'PARTITION BY manager_id restarts the ranking per manager instead of ranking the whole table.',
      'Manager 1’s reports: Grace (180) ranks 1, Linus (150) ranks 2. Manager 2’s single report Edsger is rank 1 in their own partition.',
      'Unlike GROUP BY, window functions keep every row — the result has one row per employee, not one per group.',
      'RANK leaves gaps after ties; ROW_NUMBER never does. With no ties here they agree.',
    ],
    mistakes: [
      'Adding GROUP BY manager_id and collapsing to one row per group.',
      'Forgetting WHERE manager_id IS NOT NULL, which would create a NULL partition for Ada.',
    ],
    hints: ['Window functions run AFTER the WHERE clause and never reduce row count.', 'PARTITION BY is "GROUP BY that keeps the rows".'],
    objectives: ['Use PARTITION BY + ORDER BY windows', 'Distinguish RANK, ROW_NUMBER and DENSE_RANK'],
  }),

  sqlChallenge({
    id: 'sql.having-filter',
    category: 'sql',
    challengeType: 'sql',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['group by', 'having'],
    tags: ['aggregation'],
    skills: ['WHERE vs HAVING'],
    subcategories: ['aggregation'],
    title: 'The Busy Managers',
    subtitle: 'Filter groups, not rows.',
    description: 'HAVING applies after aggregation — WHERE cannot see counts.',
    schema: `CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  manager_id INTEGER REFERENCES employees(id),
  salary INTEGER NOT NULL
);

INSERT INTO employees (id, name, manager_id, salary) VALUES
  (1, 'Ada',    NULL, 200),
  (2, 'Grace',  1,    180),
  (3, 'Linus',  1,    150),
  (4, 'Edsger', 2,    120);`,
    question:
      'Return each `manager_id` that manages MORE than one direct report, together with the count as `reports`. Exclude top-level employees (their manager_id is NULL) from the result.',
    query: `SELECT manager_id, COUNT(*) AS reports
FROM employees
WHERE manager_id IS NOT NULL
GROUP BY manager_id
HAVING COUNT(*) > 1;`,
    expectedColumns: ['manager_id', 'reports'],
    expectedRows: [['1', '2']],
    explanation: [
      'WHERE runs BEFORE grouping and drops Ada’s NULL manager row.',
      'Groups: manager 1 → {Grace, Linus} (2 rows), manager 2 → {Edsger} (1 row).',
      'HAVING COUNT(*) > 1 keeps only manager 1 — a HAVING condition may reference aggregates, a WHERE may not.',
    ],
    mistakes: [
      'Writing WHERE COUNT(*) > 1 — aggregates cannot appear in WHERE; that is what HAVING is for.',
      'Dropping the WHERE and then filtering NULL groups with HAVING manager_id IS NOT NULL — works, but conflates row and group filters.',
    ],
    hints: ['Which clause sees individual rows, and which sees groups?', 'The pipeline is FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY.'],
    objectives: ['Place filters on the correct side of aggregation', 'Reconstruct the SQL execution pipeline'],
  }),

  sqlChallenge({
    id: 'sql.orphan-orders',
    category: 'sql',
    challengeType: 'sql',
    difficulty: 'intermediate',
    minutes: 15,
    concepts: ['left join', 'coalesce'],
    tags: ['joins'],
    skills: ['Outer join semantics'],
    subcategories: ['joins'],
    title: 'The Orphan Orders',
    subtitle: 'Keep the rows the join would drop.',
    description: 'LEFT JOIN + IS NULL to surface referential damage.',
    schema: SHOP_SCHEMA,
    question:
      'Order 106 references user 99, who does not exist. Return the `id` of every order whose buyer is missing, together with the buyer name rendered as `unknown` (use COALESCE), as columns `id` and `buyer`, ordered by id.',
    query: `SELECT o.id, COALESCE(u.name, 'unknown') AS buyer
FROM orders o
LEFT JOIN users u ON u.id = o.user_id
WHERE u.id IS NULL
ORDER BY o.id;`,
    expectedColumns: ['id', 'buyer'],
    expectedRows: [['106', 'unknown']],
    explanation: [
      'LEFT JOIN keeps every order row; orders without a matching user get NULL for all users columns.',
      'The WHERE u.id IS NULL filter is the anti-join idiom: keep exactly the unmatched left rows.',
      'COALESCE renders the display fallback, though the filter has already ensured the name is NULL here — in a report without the filter, it substitutes per row.',
    ],
    mistakes: [
      'Using an INNER JOIN — the orphan row disappears before you can find it.',
      'Testing u.name IS NULL when name is NOT NULL in the schema — the join key (u.id) is the reliable NULL marker.',
    ],
    hints: ['Which join type preserves unmatched left rows?', 'After a LEFT JOIN, what is NULL in an unmatched row?'],
    objectives: ['Detect referential orphans with LEFT JOIN', 'Use COALESCE for display fallbacks'],
  }),

  sqlChallenge({
    id: 'sql.date-range-count',
    category: 'sql',
    challengeType: 'sql',
    difficulty: 'easy',
    minutes: 10,
    concepts: ['date filtering', 'text comparisons'],
    tags: ['dates'],
    skills: ['ISO date reasoning'],
    subcategories: ['dates'],
    title: 'The January Window',
    subtitle: 'ISO dates sort as text — use it.',
    description: 'Filter orders inside a date range with ISO-8601 lexicographic ordering.',
    schema: SHOP_SCHEMA,
    question:
      'Return the number of orders created between 2026-01-05 and 2026-01-15 INCLUSIVE, as column `order_count`.',
    query: `SELECT COUNT(*) AS order_count
FROM orders
WHERE created_at BETWEEN '2026-01-05' AND '2026-01-15';`,
    expectedColumns: ['order_count'],
    expectedRows: [['5']],
    explanation: [
      'ISO-8601 dates in TEXT compare correctly as strings: lexicographic order equals chronological order for well-formed values.',
      'Orders 101–105 all fall inside the window; order 106 (2026-01-20) does not.',
      'BETWEEN is inclusive on both ends — a common source of off-by-one-day bugs with timestamps that carry a time component.',
    ],
    mistakes: [
      'Using BETWEEN on TIMESTAMP columns with a date-only upper bound, which cuts off the whole last day (2026-01-15T00:00:00 exactly).',
      'Storing dates in non-ISO formats and comparing text — the trick only works for ISO-8601.',
    ],
    hints: ['Compare the six created_at values with the window bounds as plain strings.', 'Is BETWEEN inclusive or exclusive?'],
    objectives: ['Exploit ISO-8601 ordering', 'Respect BETWEEN inclusivity'],
  }),

  sqlChallenge({
    id: 'sql.avg-and-cast',
    category: 'sql',
    challengeType: 'sql',
    difficulty: 'easy',
    minutes: 12,
    concepts: ['aggregation', 'type casting'],
    tags: ['aggregation'],
    skills: ['Aggregate + cast composition'],
    subcategories: ['aggregation'],
    title: 'The Salary Midpoint',
    subtitle: 'AVG, then cast the truth away carefully.',
    description: 'Average a column and control the numeric type of the result.',
    schema: `CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  manager_id INTEGER REFERENCES employees(id),
  salary INTEGER NOT NULL
);

INSERT INTO employees (id, name, manager_id, salary) VALUES
  (1, 'Ada',    NULL, 200),
  (2, 'Grace',  1,    180),
  (3, 'Linus',  1,    150),
  (4, 'Edsger', 2,    120);`,
    question:
      'Return the average salary across all four employees, truncated to an integer, as column `avg_salary`.',
    query: `SELECT CAST(AVG(salary) AS INTEGER) AS avg_salary
FROM employees;`,
    expectedColumns: ['avg_salary'],
    expectedRows: [['162']],
    explanation: [
      'The salaries sum to 650 over 4 employees: AVG = 162.5.',
      'AVG returns a REAL for integer input in SQLite; CAST to INTEGER truncates toward zero → 162.',
      'ROUND(AVG(salary)) would give 163 instead — the difference between rounding and truncating is the point of the quest.',
    ],
    mistakes: [
      'Expecting integer/integer division rules — AVG always produces a REAL in SQLite.',
      'Casting to INTEGER and expecting rounding: CAST truncates, ROUND rounds.',
    ],
    hints: ['What is 650 / 4 exactly?', 'In SQLite, does CAST ROUND or TRUNCATE?'],
    objectives: ['Predict AVG’s result type', 'Control truncation vs rounding explicitly'],
  }),
];
