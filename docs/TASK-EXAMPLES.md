# Task Examples - Question Randomizer AI Agent

Comprehensive examples of agent tasks showing real-world usage of the 15 agent tools.

## Table of Contents

- [Quick Reference](#quick-reference)
- [Basic Tasks](#basic-tasks)
- [Data Retrieval Tasks](#data-retrieval-tasks)
- [Data Organization Tasks](#data-organization-tasks)
- [Data Analysis Tasks](#data-analysis-tasks)
- [Multi-Step Workflows](#multi-step-workflows)
- [Batch Operations](#batch-operations)
- [Advanced Tasks](#advanced-tasks)
- [Writing Effective Task Descriptions](#writing-effective-task-descriptions)

---

## Quick Reference

### Task Categories

| Category | Duration | Execution Mode | Examples |
|----------|----------|----------------|----------|
| **Simple Queries** | < 5s | Sync | "List my categories" |
| **Data Analysis** | 5-15s | Sync/Stream | "Find duplicate questions" |
| **Batch Updates** | 15-30s | Stream | "Categorize 20 questions" |
| **Large Operations** | > 30s | Queue | "Analyze all 500 questions" |

### Common Task Patterns

```
Information Retrieval:   "Show me..."  "List..."  "Get..."
Data Creation:          "Create..."  "Add..."
Data Updates:           "Update..."  "Change..."  "Categorize..."
Data Analysis:          "Find..."  "Analyze..."  "Check for..."
Batch Operations:       "Categorize all..."  "Update all..."
```

---

## Basic Tasks

### 1. List Categories

**Task:**
```
List all my question categories
```

**Expected Tool Calls:**
1. `get_categories()`

**Sample Response:**
```
You have 4 categories:

1. JavaScript (cat-js-001)
   - 15 questions

2. Python (cat-py-002)
   - 8 questions

3. System Design (cat-sd-003)
   - 12 questions

4. Databases (cat-db-004)
   - 10 questions
```

**Use Case:** Quick overview of available categories

---

### 2. Count Questions

**Task:**
```
How many questions do I have in total?
```

**Expected Tool Calls:**
1. `get_questions({ limit: 1000 })`

**Sample Response:**
```
You currently have 45 interview questions in your database.

Breakdown:
- JavaScript: 15 questions
- Python: 8 questions
- System Design: 12 questions
- Databases: 10 questions
```

**Use Case:** Get statistics about question collection

---

### 3. View Specific Question

**Task:**
```
Show me the details of question q-12345
```

**Expected Tool Calls:**
1. `get_question_by_id({ questionId: "q-12345" })`

**Sample Response:**
```
Question ID: q-12345
Category: JavaScript
Difficulty: 3/5

Question:
"Explain the difference between call(), apply(), and bind() in JavaScript"

Answer:
[Full answer text...]

Created: 2025-11-15
Last Modified: 2025-11-20
```

**Use Case:** Review specific question details

---

## Data Retrieval Tasks

### 4. Search Questions by Keyword

**Task:**
```
Find all questions related to "closures"
```

**Expected Tool Calls:**
1. `search_questions({ searchText: "closures" })`

**Sample Response:**
```
Found 3 questions mentioning "closures":

1. [q-101] What is a closure in JavaScript? (JavaScript)
2. [q-205] Explain how closures work with event handlers (JavaScript)
3. [q-312] Compare closures in JavaScript vs Python (Python)
```

**Use Case:** Find questions by topic or keyword

---

### 5. Get Uncategorized Questions

**Task:**
```
Show me all questions that don't have a category assigned
```

**Expected Tool Calls:**
1. `get_uncategorized_questions()`

**Sample Response:**
```
You have 7 uncategorized questions:

1. [q-456] "What is the CAP theorem?"
2. [q-457] "Explain eventual consistency"
3. [q-458] "What are microservices?"
4. [q-459] "Describe REST vs GraphQL"
5. [q-460] "What is CI/CD?"
6. [q-461] "Explain Docker containers"
7. [q-462] "What is Kubernetes?"

Would you like me to help categorize these?
```

**Use Case:** Identify questions needing organization

---

### 6. Filter Questions by Category

**Task:**
```
List all JavaScript questions
```

**Expected Tool Calls:**
1. `get_categories()`
2. `get_questions({ categoryId: "cat-js-001", limit: 100 })`

**Sample Response:**
```
Found 15 JavaScript questions:

1. [q-101] What is a closure?
2. [q-102] Explain event delegation
3. [q-103] What is the difference between let and var?
4. [q-104] How does async/await work?
...
```

**Use Case:** Review questions in specific category

---

## Data Organization Tasks

### 7. Categorize Single Question

**Task:**
```
Categorize question q-456 about the CAP theorem as "System Design"
```

**Expected Tool Calls:**
1. `get_question_by_id({ questionId: "q-456" })`
2. `get_categories()`
3. `update_question_category({ questionId: "q-456", categoryId: "cat-sd-003" })`

**Sample Response:**
```
✓ Successfully categorized question q-456 as "System Design"

Question: "What is the CAP theorem?"
Previous Category: None
New Category: System Design
```

**Use Case:** Assign category to uncategorized question

---

### 8. Create New Category

**Task:**
```
Create a new category called "React" for frontend framework questions
```

**Expected Tool Calls:**
1. `get_categories()` (check if exists)
2. `create_category({ name: "React", description: "React framework questions" })`

**Sample Response:**
```
✓ Created new category: React (cat-react-005)

Description: React framework questions
Created: 2025-11-27

You can now assign questions to this category.
```

**Use Case:** Add new category for better organization

---

### 9. Batch Categorize by Topic

**Task:**
```
Categorize all uncategorized questions about databases into the "Databases" category
```

**Expected Tool Calls:**
1. `get_uncategorized_questions()`
2. `get_categories()`
3. `batch_update_questions({
     questionIds: ["q-789", "q-790"],
     updates: { categoryId: "cat-db-004" }
   })`

**Sample Response:**
```
✓ Categorized 2 database-related questions

Updated questions:
1. [q-789] "What is normalization?" → Databases
2. [q-790] "Explain ACID properties" → Databases

Remaining uncategorized: 5 questions
```

**Use Case:** Organize multiple questions at once

---

### 10. Update Question Details

**Task:**
```
Update question q-101: change the difficulty to 4 and add "advanced" to the tags
```

**Expected Tool Calls:**
1. `get_question_by_id({ questionId: "q-101" })`
2. `update_question({
     questionId: "q-101",
     difficulty: 4,
     tags: ["closures", "advanced"]
   })`

**Sample Response:**
```
✓ Updated question q-101

Changes:
- Difficulty: 3 → 4
- Tags: ["closures"] → ["closures", "advanced"]

Question: "What is a closure in JavaScript?"
Category: JavaScript
Last Modified: 2025-11-27 10:30:00
```

**Use Case:** Refine question metadata

---

## Data Analysis Tasks

### 11. Find Duplicate Questions

**Task:**
```
Check for duplicate questions in my database
```

**Expected Tool Calls:**
1. `get_questions({ limit: 1000 })`
2. `find_duplicate_questions({ similarityThreshold: 0.8 })`

**Sample Response:**
```
Found 3 potential duplicate groups:

Group 1: (90% similar)
- [q-101] "What is a closure in JavaScript?"
- [q-215] "Explain closures in JS"
→ Recommendation: Keep q-101 (more detailed), delete q-215

Group 2: (85% similar)
- [q-304] "What is the difference between SQL and NoSQL?"
- [q-405] "Compare SQL databases to NoSQL"
→ Recommendation: Merge into single question

Group 3: (82% similar)
- [q-567] "Explain REST API"
- [q-568] "What is a RESTful API?"
→ Recommendation: Keep q-567, delete q-568

Would you like me to remove the duplicates?
```

**Use Case:** Clean up duplicate content

---

### 12. Analyze Question Difficulty

**Task:**
```
Analyze the difficulty of all my JavaScript questions and suggest adjustments
```

**Expected Tool Calls:**
1. `get_categories()`
2. `get_questions({ categoryId: "cat-js-001", limit: 100 })`
3. `analyze_question_difficulty({ categoryId: "cat-js-001" })`

**Sample Response:**
```
JavaScript Questions Difficulty Analysis:

Overall Distribution:
- Easy (1-2): 5 questions (33%)
- Medium (3): 7 questions (47%)
- Hard (4-5): 3 questions (20%)

Recommendations:

1. Question q-102 "Explain event delegation"
   Current: 2 (Easy)
   Suggested: 3 (Medium)
   Reason: Requires understanding of event bubbling and DOM traversal

2. Question q-107 "What is hoisting?"
   Current: 4 (Hard)
   Suggested: 2 (Easy)
   Reason: Straightforward concept, well-documented

3. Question q-115 "Implement a Promise.all() polyfill"
   Current: 3 (Medium)
   Suggested: 5 (Expert)
   Reason: Requires deep understanding of async patterns

Would you like me to update these difficulty ratings?
```

**Use Case:** Ensure accurate difficulty ratings

---

## Multi-Step Workflows

### 13. Comprehensive Question Cleanup

**Task:**
```
Clean up my question database: find duplicates, categorize uncategorized questions, and fix difficulty ratings
```

**Expected Tool Calls:**
1. `get_questions({ limit: 1000 })`
2. `find_duplicate_questions({ similarityThreshold: 0.85 })`
3. `get_uncategorized_questions()`
4. `get_categories()`
5. `batch_update_questions({ ... })` (multiple calls)
6. `analyze_question_difficulty()`

**Sample Response:**
```
✓ Database Cleanup Complete

Phase 1: Duplicate Detection
- Found 4 duplicate groups
- Removed 4 duplicate questions
- Merged 2 similar questions

Phase 2: Categorization
- 7 uncategorized questions found
- Successfully categorized 7 questions:
  * 2 → System Design
  * 3 → Databases
  * 2 → JavaScript

Phase 3: Difficulty Calibration
- Analyzed 45 questions
- Updated 6 difficulty ratings
- Distribution now: 30% Easy, 50% Medium, 20% Hard

Summary:
- Before: 45 questions (7 uncategorized, 4 duplicates)
- After: 41 questions (all categorized, no duplicates)
- Quality Score: 95/100
```

**Use Case:** Complete database maintenance

---

### 14. Intelligent Categorization

**Task:**
```
Categorize all my uncategorized questions by analyzing their content and assigning them to the most appropriate category. If no suitable category exists, create new ones.
```

**Expected Tool Calls:**
1. `get_uncategorized_questions()`
2. `get_categories()`
3. `create_category({ name: "DevOps", ... })` (if needed)
4. `batch_update_questions({ questionIds: [...], updates: { categoryId: "..." } })`

**Sample Response:**
```
✓ Intelligent Categorization Complete

Analyzed 7 uncategorized questions:

Existing Categories:
- 3 questions → System Design
  * "What is the CAP theorem?"
  * "Explain microservices architecture"
  * "What is event-driven architecture?"

- 2 questions → Databases
  * "What is sharding?"
  * "Explain database replication"

New Categories Created:
✓ Created "DevOps" category

- 2 questions → DevOps
  * "What is CI/CD?"
  * "Explain Docker containers"

All questions are now categorized!
```

**Use Case:** Automated organization with intelligence

---

### 15. Question Quality Audit

**Task:**
```
Audit all my questions for quality issues: missing answers, short questions (< 10 words), missing difficulty ratings, and duplicate content
```

**Expected Tool Calls:**
1. `get_questions({ limit: 1000 })`
2. `find_duplicate_questions({ similarityThreshold: 0.85 })`
3. `analyze_question_difficulty()`

**Sample Response:**
```
✓ Quality Audit Complete

Issues Found: 12

1. Missing Answers (3 questions):
   - [q-234] "What is CORS?"
   - [q-345] "Explain JWT tokens"
   - [q-456] "What is OAuth 2.0?"
   → Recommendation: Add comprehensive answers

2. Short Questions (2 questions):
   - [q-111] "Closures?" (1 word)
   - [q-222] "What is REST?" (3 words)
   → Recommendation: Expand question text for clarity

3. Missing Difficulty (4 questions):
   - [q-567], [q-678], [q-789], [q-890]
   → Recommendation: Analyze content and assign difficulty

4. Potential Duplicates (3 questions):
   - [q-101] + [q-215] (90% similar)
   → Recommendation: Review and merge

Quality Score: 73/100

Would you like me to help fix these issues?
```

**Use Case:** Comprehensive quality check

---

## Batch Operations

### 16. Bulk Update Difficulty

**Task:**
```
Set all questions in the "JavaScript Basics" category to difficulty level 2
```

**Expected Tool Calls:**
1. `get_categories()`
2. `get_questions({ categoryId: "cat-js-basics", limit: 100 })`
3. `batch_update_questions({
     questionIds: ["q-1", "q-2", ...],
     updates: { difficulty: 2 }
   })`

**Sample Response:**
```
✓ Updated 15 questions in "JavaScript Basics"

Changes:
- Set difficulty to 2 (Easy-Medium) for all questions

Updated questions:
1. [q-101] "What is a variable?"
2. [q-102] "Explain data types"
3. [q-103] "What is a function?"
... (12 more)

All questions in this category now have consistent difficulty ratings.
```

**Use Case:** Standardize metadata across category

---

### 17. Mass Categorization

**Task:**
```
Review the first 50 uncategorized questions and categorize them appropriately
```

**Expected Tool Calls:**
1. `get_uncategorized_questions()`
2. `get_categories()`
3. Multiple `batch_update_questions()` calls

**Sample Response:**
```
✓ Processed 50 uncategorized questions

Categorization Results:

JavaScript (12 questions):
- ES6 features, async/await, closures, prototypes

System Design (8 questions):
- Scalability, caching, load balancing, microservices

Databases (10 questions):
- SQL queries, indexing, normalization, transactions

Python (7 questions):
- Decorators, generators, list comprehensions

Data Structures (6 questions):
- Trees, graphs, hash tables

Algorithms (5 questions):
- Sorting, searching, dynamic programming

DevOps (2 questions):
- Docker, Kubernetes

Progress: 50/50 categorized
Remaining uncategorized: 0
```

**Use Case:** Process large backlogs efficiently

---

## Advanced Tasks

### 18. Create Study Plan

**Task:**
```
Create a 30-day study plan for JavaScript interview preparation using my existing questions, organized by difficulty
```

**Expected Tool Calls:**
1. `get_categories()`
2. `get_questions({ categoryId: "cat-js-001", limit: 100 })`
3. `analyze_question_difficulty({ categoryId: "cat-js-001" })`

**Sample Response:**
```
✓ 30-Day JavaScript Interview Study Plan

Week 1: Fundamentals (Easy)
Day 1-2: Variables, Data Types, Operators (5 questions)
Day 3-4: Functions, Scope, Hoisting (4 questions)
Day 5-7: Objects, Arrays, String Methods (6 questions)

Week 2: Intermediate Concepts (Medium)
Day 8-10: Closures, Callbacks, Promises (5 questions)
Day 11-13: Async/Await, Event Loop (4 questions)
Day 14: Review Week 1-2 (All easy + medium)

Week 3: Advanced Topics (Medium-Hard)
Day 15-17: Prototypes, Inheritance, Classes (5 questions)
Day 18-20: ES6+ Features, Modules (4 questions)
Day 21: Practice Mixed Questions (10 questions)

Week 4: Expert Level (Hard)
Day 22-24: Design Patterns, Performance (4 questions)
Day 25-27: Advanced Async, Generators (3 questions)
Day 28-30: Mock Interviews (All difficulty levels)

Total Questions: 45 JavaScript questions
Daily Average: 1.5 questions
Difficulty Progression: Easy → Medium → Hard → Mixed

Would you like me to create specific question sets for each day?
```

**Use Case:** Structured learning path

---

### 19. Gap Analysis

**Task:**
```
Analyze my question collection and identify topics I'm missing compared to typical interview preparation
```

**Expected Tool Calls:**
1. `get_categories()`
2. `get_questions({ limit: 1000 })`
3. `search_questions({ searchText: "..." })` (multiple searches)

**Sample Response:**
```
✓ Gap Analysis Complete

Your Coverage (45 questions):

Strong Areas (10+ questions):
✓ JavaScript Fundamentals (15)
✓ System Design Basics (12)
✓ Database Concepts (10)

Moderate Areas (5-9 questions):
⚠ Python Basics (8)
⚠ Algorithms (7)
⚠ Data Structures (6)

Weak Areas (< 5 questions):
❌ React/Frontend Frameworks (2)
❌ Testing/TDD (1)
❌ Security (1)

Missing Topics (0 questions):
❌ TypeScript
❌ Node.js/Backend
❌ API Design
❌ Git/Version Control
❌ Authentication/Authorization
❌ Performance Optimization
❌ Web Security (OWASP)
❌ GraphQL

Recommendations:
1. Add 10-15 React questions
2. Add 8-10 Node.js/Backend questions
3. Add 5-8 Testing questions
4. Add 5-8 Security questions
5. Add 5 TypeScript questions

Would you like me to suggest specific questions to add?
```

**Use Case:** Identify knowledge gaps

---

### 20. Export Questions by Tag

**Task:**
```
Find all questions tagged with "interview-common" and organize them by difficulty for quick review
```

**Expected Tool Calls:**
1. `get_questions({ limit: 1000 })`
2. Filter by tag (client-side)

**Sample Response:**
```
✓ Found 18 questions tagged "interview-common"

Easy (6 questions):
1. [q-101] What is a closure?
2. [q-205] Explain the box model in CSS
3. [q-310] What is the difference between let and var?
4. [q-412] What is REST?
5. [q-501] Explain SQL JOINs
6. [q-607] What is Git?

Medium (8 questions):
1. [q-102] Implement debounce function
2. [q-203] Explain virtual DOM
3. [q-305] What is event delegation?
4. [q-408] Design a URL shortener
5. [q-509] Explain database indexing
6. [q-610] What is CI/CD pipeline?
7. [q-711] Implement Promise.all()
8. [q-812] Explain SOLID principles

Hard (4 questions):
1. [q-901] Design Twitter's architecture
2. [q-902] Implement React reconciliation algorithm
3. [q-903] Optimize database for 1M+ users
4. [q-904] Design real-time notification system

Perfect for quick review before interviews!
```

**Use Case:** Targeted interview preparation

---

## Writing Effective Task Descriptions

### Best Practices

**1. Be Specific**
```
❌ Bad:  "Do something with my questions"
✅ Good: "Find all duplicate JavaScript questions and remove them"
```

**2. Provide Context**
```
❌ Bad:  "Categorize questions"
✅ Good: "Categorize all uncategorized questions about databases into the 'Databases' category"
```

**3. State Your Goal**
```
❌ Bad:  "Look at my questions"
✅ Good: "Analyze my question collection and identify which topics need more coverage"
```

**4. Use Action Verbs**
```
✅ List, Show, Find, Create, Update, Delete, Categorize, Analyze, Search, Compare
```

**5. Specify Filters When Needed**
```
✅ "List all JavaScript questions with difficulty 4 or higher"
✅ "Find questions created in the last 30 days"
✅ "Show uncategorized questions containing 'async'"
```

---

### Task Description Templates

**Information Retrieval:**
```
"Show me [what] [with filter]"
"List all [what] [condition]"
"Find [what] [matching criteria]"
```

**Data Creation:**
```
"Create a new [category/question] named [name] about [topic]"
"Add a [category/question] for [purpose]"
```

**Data Updates:**
```
"Update [what] to [new value]"
"Change [what]'s [property] to [value]"
"Categorize [what] as [category]"
```

**Data Analysis:**
```
"Find duplicate [questions/categories]"
"Analyze difficulty of [category] questions"
"Check for [quality issues]"
```

**Batch Operations:**
```
"Categorize all [description] questions as [category]"
"Update all [category] questions to difficulty [level]"
"Find and remove all duplicates"
```

---

### Common Mistakes to Avoid

**1. Too Vague**
```
❌ "Fix my questions"
→ What needs fixing? Specify the issue.
```

**2. Multiple Unrelated Tasks**
```
❌ "Create a category, find duplicates, and update difficulty"
→ Break into separate tasks or clearly indicate multi-step workflow
```

**3. Missing Essential Information**
```
❌ "Update question q-123"
→ Update what? Specify which fields to change.
```

**4. Ambiguous References**
```
❌ "Categorize the questions"
→ Which questions? All? Uncategorized? Specific category?
```

---

## Task Complexity Levels

### Level 1: Single-Step Tasks (< 5 seconds)
- Simple data retrieval
- Single record lookup
- Basic queries

**Examples:**
- "List my categories"
- "Show question q-123"
- "Count total questions"

---

### Level 2: Multi-Step Tasks (5-15 seconds)
- Multiple tool calls
- Some analysis required
- Moderate data processing

**Examples:**
- "Find JavaScript questions tagged 'closures'"
- "Categorize question q-456 as System Design"
- "Search for questions about REST APIs"

---

### Level 3: Complex Tasks (15-30 seconds)
- Extensive analysis
- Batch operations
- Multiple decision points

**Examples:**
- "Find and categorize all uncategorized questions"
- "Analyze difficulty distribution across all categories"
- "Find duplicate questions and suggest which to keep"

---

### Level 4: Advanced Workflows (> 30 seconds)
- Comprehensive operations
- Large batch updates
- Multi-phase processing

**Examples:**
- "Complete database cleanup: remove duplicates, categorize all questions, fix difficulty ratings"
- "Audit all 500 questions for quality issues"
- "Create a 30-day study plan from my question collection"

**Recommendation:** Use **Queue mode** for Level 4 tasks!

---

## Related Documentation

- **[AGENT-TOOLS.md](./AGENT-TOOLS.md)** - Complete tool reference
- **[STREAMING.md](./STREAMING.md)** - Real-time execution
- **[QUEUE.md](./QUEUE.md)** - Background job processing
- **[SETUP.md](./SETUP.md)** - Getting started

---

**Start with simple tasks and gradually increase complexity as you learn the agent's capabilities!** 🚀
