# Analyze File

This command performs deep code analysis on a specified file to identify optimization opportunities, readability improvements, and adherence to best practices (Clean Code, DRY, SOLID).

**Works with any programming language:** C#, TypeScript, JavaScript, Python, Java, Go, Rust, and more.

## Usage

```bash
/analyze-file <file-path>
```

**Examples:**
- `/analyze-file src/QuestionRandomizer.Application/Commands/CreateQuestionCommandHandler.cs`
- `/analyze-file src/services/question-service.ts`
- `/analyze-file app/models/question.py`
- `/analyze-file pkg/handlers/question_handler.go`

## Your Task

1. **Read and understand the file:**
   - Read the specified file completely
   - **Auto-detect the programming language** based on file extension
   - Understand its purpose, dependencies, and context
   - Identify the type of code (component, service, repository, utility, etc.)
   - Apply language-specific analysis where appropriate

2. **Perform comprehensive analysis across these dimensions:**

   ### Code Organization & Structure
   - Are functions/methods too long or complex? (suggest splitting into smaller units)
   - Is the file doing too many things? (Single Responsibility Principle)
   - Are related functions grouped logically?
   - Is the code structure intuitive and easy to navigate?

   ### Naming Conventions & Intuitive Function Names ⚠️ CRITICAL
   **Function/Method Names:**
   - **Clarity:** Does the name clearly describe what the function does?
   - **Verb usage:** Does it use proper verbs? (get/fetch/load/create/update/delete/calculate/etc.)
   - **Verb accuracy:** Does "get" imply side-effect-free retrieval? Does "create" imply persistence?
   - **Length:** Is it concise but not abbreviated? (avoid: `updCtgQstLstId`, prefer: `updateQuestionCategory`)
   - **Consistency:** Do similar operations use consistent naming patterns?
   - **Intuitiveness:** Can a developer understand the purpose without reading implementation?
   - **Boolean methods:** Do predicates start with is/has/should/can? (e.g., `shouldSkipLoading`)
   - **Redundancy:** Does it avoid repeating type names? (bad: `UserService.getUserUser()`)

   **Parameter Names:**
   - **Descriptive:** Avoid abbreviations (bad: `usrId`, `qDic` - good: `userId`, `questionMap`)
   - **Conventions:** Follow language-specific naming conventions (camelCase, snake_case, PascalCase)
   - **Context:** Clear without needing to check types

   **Variable Names:**
   - Self-documenting code over comments
   - Avoid single letters (except loop indices)
   - Boolean variables should read like questions (e.g., `isLoading`, `hasError`)

   ### Readability & Documentation
   **Code Documentation:**
   - **Documentation coverage:** Do all public methods/functions have documentation comments?
   - **Documentation completeness:** Do they document parameters, return values, exceptions, and include examples?
   - **Documentation style:** Does it follow language conventions? (XML docs for C#, JSDoc for TS/JS, docstrings for Python, Javadoc for Java, etc.)
   - **Comment quality:** Are comments explaining "why" not "what"?
   - **Self-documenting code:** Is the code clear enough that comments aren't needed for basic understanding?

   **Code Clarity:**
   - **Complex expressions:** Are ternary operators nested? Boolean logic hard to parse?
   - **Magic values:** Are there hardcoded numbers/strings that should be named constants?
   - **Nesting depth:** Are there deeply nested conditions (>3 levels) or loops?
   - **Function length:** Can you understand a function without scrolling?
   - **Cognitive load:** Can you understand the code without keeping too much context in your head?

   ### Clean Code Principles
   **Function Design:**
   - **Single purpose:** Does each function do ONE thing well?
   - **Function size:** Are functions <20 lines ideally, <50 lines maximum?
   - **Parameter count:** Are there ≤3 parameters? (More suggests need for object parameter)
   - **Return consistency:** Do functions return same type consistently? (avoid mixed returns)

   **Code Organization:**
   - **Separation of concerns:** Are business logic, data access, and UI clearly separated?
   - **Abstraction levels:** Does each function operate at one level of abstraction?
   - **Dependencies:** Are dependencies injected rather than created internally?
   - **Cohesion:** Are related functions grouped together?

   ### DRY (Don't Repeat Yourself)
   - Identify duplicated code blocks
   - Repeated logic that could be extracted
   - Similar patterns that could use shared utilities
   - Duplicated type definitions

   ### SOLID Principles (Practical Checks)
   **Single Responsibility - Check for:**
   - Does the class/function have multiple reasons to change?
   - Can you describe what it does in one sentence without using "and"?
   - Does it mix concerns? (e.g., data fetching AND business logic AND UI updates)

   **Open/Closed - Check for:**
   - Are there long if/else or switch statements that need modification when adding features?
   - Could new behavior be added via composition/inheritance instead of modification?
   - Are enums/constants used that require code changes when new types are added?

   **Liskov Substitution - Check for:**
   - Do derived classes throw unexpected errors?
   - Do child classes violate parent class contracts?
   - Can you swap derived types without breaking code?

   **Interface Segregation - Check for:**
   - Do interfaces force implementations of unused methods?
   - Are there "fat" interfaces that do too much?
   - Could interfaces be split into smaller, focused contracts?

   **Dependency Inversion - Check for:**
   - Does code depend on concrete implementations instead of abstractions?
   - Are dependencies created with `new` instead of injected?
   - Could dependencies be mocked/swapped for testing?

   ### Error Handling & Resilience ⚠️ CRITICAL
   **Consistency:**
   - **Pattern uniformity:** Is error handling consistent across all methods?
   - **Centralization:** Is there repeated try-catch logic that could be centralized?
   - **DRY violation:** Is the same error handling code copy-pasted everywhere?

   **Quality:**
   - **Error messages:** Are error messages descriptive and actionable?
   - **Error types:** Are different error types handled appropriately?
   - **User communication:** Are user-facing errors clear and helpful?
   - **Logging:** Are errors logged with enough context for debugging?

   **Recovery:**
   - **Graceful degradation:** Does the app fail gracefully?
   - **Resource cleanup:** Are resources (subscriptions, connections) cleaned up on errors?
   - **Side effects:** Are partial state changes rolled back on error?

   ### Immutability & State Management ⚠️ CRITICAL
   **Direct Mutations - Check for:**
   - **Object mutations:** Are objects mutated directly instead of creating new instances?
   - **Collection mutations:** Using mutating operations (push, splice, sort, etc.) instead of immutable alternatives?
   - **Parameter mutations:** Are function parameters modified directly?
   - **Immutable patterns:** Are new instances created when updating state?

   **State Updates:**
   - **State management:** Does state management follow immutable patterns?
   - **Reference equality:** Are object references changed when state updates?
   - **Framework compatibility:** Does mutation handling align with framework expectations? (React/Angular need new references, others may differ)

   **Impact:**
   - **Change detection:** Will UI frameworks detect changes correctly?
   - **Debugging:** Are bugs caused by unintended mutations?
   - **Predictability:** Is state predictable and traceable?
   - **Concurrency:** Are race conditions or shared state issues possible?

   ### Side Effects & Command-Query Separation
   **Pure Functions:**
   - **Side effect identification:** Which functions have side effects (API calls, mutations, logging)?
   - **Function naming:** Do names accurately reflect side effects? ("get" should be side-effect-free)
   - **Isolation:** Are side effects isolated and clearly marked?

   **Command-Query Separation:**
   - **Queries:** Do "get/fetch/find" methods only return data without mutations?
   - **Commands:** Do "create/update/delete" methods only mutate without returning data (except IDs)?
   - **Violations:** Are there functions that both query AND command?

   ### Testability & Test Coverage
   **Code Testability:**
   - **Dependency injection:** Are dependencies injected (mockable) or hard-coded?
   - **Function size:** Are functions small enough to test easily?
   - **Pure functions:** How many functions are pure (easier to test)?
   - **Hidden dependencies:** Are there global state dependencies or static calls?

   **Test Existence:**
   - **Test file:** Does a corresponding test file exist? (Check for language conventions: `.test.js`, `.spec.ts`, `Test.cs`, `_test.go`, `_test.py`, etc.)
   - **Coverage:** What's the estimated test coverage for critical paths?
   - **Test quality:** Are tests meaningful or just achieving coverage?
   - **Edge cases:** Are error cases and edge cases tested?

   ### Dependencies & Coupling
   **Dependency Analysis:**
   - **Dependency count:** How many services/dependencies are injected? (>5 is a smell)
   - **Circular dependencies:** Are there circular dependencies?
   - **Tight coupling:** Is the code tightly coupled to specific implementations?
   - **God objects:** Are there dependencies that do too much?

   **Coupling Issues:**
   - **Feature envy:** Does code reach deep into other objects? (`obj.prop.subProp.value`)
   - **Inappropriate intimacy:** Does code know too much about other classes' internals?
   - **Hidden coupling:** Are there implicit dependencies (order of operations, shared state)?

   ### Performance & Optimization
   - Unnecessary computations or loops
   - Inefficient algorithms or data structures
   - Memory leaks (unclosed resources, event handlers, etc.)
   - Redundant API calls or database queries
   - Missing memoization/caching opportunities

   ### Language-Specific Best Practices
   **Auto-detect based on file extension and apply relevant checks:**

   **C# (.cs):**
   - Async/await usage (avoid blocking calls, use ConfigureAwait when appropriate)
   - LINQ efficiency (avoid multiple enumerations, use appropriate methods)
   - Nullable reference types (proper null handling)
   - IDisposable pattern (using statements, proper resource cleanup)
   - Expression-bodied members for simple properties/methods

   **TypeScript/JavaScript (.ts, .js, .tsx, .jsx):**
   - Type safety (avoid `any`, use proper type annotations)
   - Async/await vs Promises
   - Proper use of generics
   - Optional chaining and nullish coalescing
   - Framework-specific: React hooks, Angular change detection, Vue reactivity

   **Python (.py):**
   - Type hints (PEP 484)
   - List comprehensions vs loops
   - Context managers (with statements)
   - Generator usage for large datasets
   - PEP 8 compliance

   **Java (.java):**
   - Stream API usage
   - Optional handling for nulls
   - Try-with-resources
   - Proper exception hierarchy
   - Generics and type safety

   **Go (.go):**
   - Error handling patterns (return errors, not panic)
   - Goroutine and channel usage
   - Defer statements for cleanup
   - Interface design
   - Context usage for cancellation

   **Rust (.rs):**
   - Ownership and borrowing
   - Error handling (Result and Option types)
   - Trait implementation
   - Lifetime annotations
   - Unsafe code justification

   **Other languages:** Apply language-specific idioms and best practices as appropriate

3. **Generate detailed report with:**

   ### Issues Found
   For each issue, provide:
   - **Category:** (e.g., Naming, Readability, DRY, SOLID-SRP, Performance)
   - **Severity:** (High/Medium/Low)
   - **Location:** Line numbers or function names
   - **Description:** What the issue is
   - **Impact:** Why it matters
   - **Recommendation:** How to fix it

   **⚠️ MANDATORY: Naming Analysis Section**
   Always include a dedicated section analyzing **every** function/method name:
   - Evaluate each function name against naming criteria
   - For unclear/confusing names, provide 2-3 better alternatives
   - Include rationale for suggested changes
   - Show "Current" vs "Recommended" side-by-side
   - Note any parameter naming issues (abbreviations, conventions)
   - Assess consistency across the codebase

   **⚠️ MANDATORY: Error Handling Analysis Section**
   Always analyze error handling patterns:
   - Identify all error handling code
   - Check for consistency and DRY violations
   - Evaluate error message quality
   - Suggest centralization opportunities

   **⚠️ MANDATORY: Immutability Analysis Section**
   Always check for immutability violations:
   - Identify direct object/collection mutations
   - Check parameter mutations
   - Verify proper state update patterns
   - Assess impact on framework/library expectations (if applicable)

   **⚠️ MANDATORY: Testability Assessment**
   Always evaluate testability:
   - Check if test file exists
   - Assess test coverage gaps
   - Identify testability issues (hard dependencies, size, complexity)
   - Note missing edge case tests

   ### Code Examples
   - Show problematic code snippets
   - Provide concrete "before/after" examples
   - Explain the improvement benefits

   ### Summary Metrics
   - Total issues found by category (must include: Naming, Error Handling, Immutability, Testability, etc.)
   - Overall code quality assessment (X/10 scale)
   - Priority recommendations (by impact and effort)
   - Critical issues requiring immediate attention
   - Quality dimensions breakdown (Naming, Immutability, Error Handling, Testing, etc.)

4. **If user approves, implement improvements:**
   - **Fix immutability violations** (highest priority - prevents bugs)
   - **Centralize error handling** (high impact, reduces duplication)
   - **Rename functions/variables** with poor naming (high impact for readability)
   - **Create/improve tests** (ensures correctness during refactoring)
   - Apply the suggested refactorings
   - Maintain existing functionality (no breaking changes)
   - Update all references when renaming (use IDE-safe renames)
   - Preserve tests and update test names to match refactored code
   - Add new tests for uncovered edge cases
   - Document significant changes

## Analysis Principles

- **Language-adaptive:** Auto-detect language and apply appropriate idioms and best practices
- **Context-aware:** Consider the file's role in the broader architecture
- **Practical:** Prioritize impactful improvements over trivial changes
- **Non-breaking:** Maintain existing functionality and API contracts
- **Project-aligned:** Follow existing patterns and conventions in the codebase
- **Balanced:** Don't over-engineer simple code
- **Universal first, specific second:** Apply universal software engineering principles first, then layer on language-specific checks

## Example Output Format

```markdown
# Code Analysis: [FileName]

## Summary
- **Language:** [Auto-detected language]
- **Overall Quality:** Good (7/10)
- **Issues Found:** 18 (6 High, 8 Medium, 4 Low)
- **Primary Concerns:** [Top 3 concerns]
- **Quality Breakdown:**
  - Naming: 6/10 (4 poor function names)
  - Immutability: 5/10 (2 mutation violations)
  - Error Handling: 4/10 (6 duplicated patterns)
  - Testability: 7/10 (tests exist but missing edge cases)
  - Code Structure: 8/10 (well organized)

## Function Naming Analysis

### ✅ Good Function Names
- `LoadQuestions` / `loadQuestions` / `load_questions` - Clear, follows convention
- `ShouldRetry` / `shouldRetry` / `should_retry` - Proper boolean naming
- `ClearCache` / `clearCache` / `clear_cache` - Action is explicit

### ⚠️ Functions Needing Better Names

#### 1. `GetNewQuestions` - Misleading Verb
**Current:** `GetNewQuestions(userId)` or `getNewQuestions(userId)`
**Issue:** "get" implies retrieval without side effects, but this creates/persists records
**Severity:** High

**Recommended alternatives:**
- `CreateQuestions(userId)` ✅ Best - matches actual behavior
- `InitializeQuestions(userId)` ✅ Alternative
- `BuildQuestionList(userId)` ✅ Alternative

**Impact:** Violates Command-Query Separation, misleads developers

#### 2. `UpdQstCatId` - Poor Abbreviations
**Current:** `UpdQstCatId(qDic)` or `updQstCatId(qDic)`
**Issue:** Heavy abbreviations make code unreadable
**Severity:** High

**Recommended alternatives:**
- `UpdateQuestionCategoryIds(questionMap)` ✅ Best
- `SyncQuestionCategories(questionMap)` ✅ Alternative

**Parameter issue:** `qDic` → `questionMap` / `question_dict`

**Impact:** Reduces code readability, harder to maintain

[... more naming issues ...]

## Error Handling Analysis

### ❌ Critical Issues Found

#### Repeated Error Handling Pattern (DRY Violation)
**Severity:** High
**Occurrences:** 6 methods (lines 45, 67, 89, 112, 134, 156)

**Current Pattern:**
```
// Pattern repeated 6 times
catch (Exception ex)
{
    _logger.LogError(ex.Message ?? "Failed to perform action.");
}
```

**Issue:** Exact same error handling duplicated 6 times

**Recommendation:**
```
// Create centralized helper
private void HandleError(Exception ex, string defaultMessage)
{
    var errorMessage = ex.Message ?? defaultMessage;
    _logger.LogError(errorMessage);
}

// Usage
catch (Exception ex)
{
    HandleError(ex, "Failed to perform action.");
}
```

**Impact:** Reduces duplication from 48 lines to 8 lines, improves maintainability

## Immutability Analysis

### ❌ Critical Violations Found

#### 1. Direct Object Mutation in `UpdateQuestion`
**Severity:** High
**Lines:** 78-79

**Current Code:**
```
var question = GetQuestion();
question.Title = newTitle; // ❌ Direct mutation!
question.Category = newCategory; // ❌ Direct mutation!
SaveQuestion(question);
```

**Issue:** Mutates object directly, breaks immutability expectations

**Recommendation:**
```
var question = GetQuestion();
var updatedQuestion = question with // C# record syntax
{
    Title = newTitle,
    Category = newCategory
}; // ✅ New immutable instance
SaveQuestion(updatedQuestion);
```

**Impact:** Ensures predictable state management and proper change tracking

#### 2. Collection Mutation in `AddItem`
**Severity:** High
**Line:** 92

**Current Code:**
```
items.Add(newItem); // ❌ Mutates collection
```

**Recommendation:**
```
items = items.Append(newItem).ToList(); // ✅ New collection reference
// or
items = [..items, newItem]; // C# 12 collection expression
```

## Testability Assessment

### Current State
- **Test file exists:** ✅ Yes (test file detected)
- **Coverage estimate:** ~70% (good but gaps remain)
- **Testability score:** 7/10

### Missing Test Coverage

#### 1. Error Path Testing
**Severity:** Medium
**Issue:** Only happy paths tested, error scenarios missing

**Missing tests:**
- Error handling when external service fails
- Behavior with invalid data
- Timeout scenarios

#### 2. Edge Cases
**Severity:** Medium
**Missing scenarios:**
- Empty collection handling
- Concurrent updates
- Invalid IDs/null values

**Recommendation:** Add 8-10 additional test cases for error paths and edge cases

### Testability Issues

#### Hard-coded Dependencies
**Issue:** Dependencies created internally instead of injected
**Fix:** Use dependency injection pattern

## High Priority Issues

### 1. Function Complexity - `LoadQuestions` method
**Lines:** 45-89
**Issue:** Method is 45 lines long with nested conditionals and multiple responsibilities

**Recommendation:**
Split into smaller methods:
- `LoadQuestions()` - orchestration
- `FetchQuestionsFromDatabase()` - data retrieval
- `NormalizeQuestionData()` - transformation
- `UpdateStateWithQuestions()` - state updates

**Impact:** Improves testability, readability, and maintainability

[... more issues ...]

## Recommendations Summary

### Immediate (Critical) - Do First
1. **Fix immutability violations** (2 findings) - PREVENTS BUGS ⚠️
2. **Centralize error handling** (1 helper, removes 6 duplications) - HIGH IMPACT
3. **Add missing error/edge case tests** (8-10 tests) - SAFETY NET

### Short-term (High Impact)
4. **Rename unclear functions** (4 findings) - IMPROVES READABILITY
5. **Refactor complex methods** (2 findings) - IMPROVES MAINTAINABILITY
6. **Fix hard-coded dependencies** (1 finding) - IMPROVES TESTABILITY

### Long-term (Nice to Have)
7. **Consider performance optimizations** (3 findings) - MINOR GAINS

### Impact Analysis
- **Effort:** Medium (3-4 hours)
- **Risk:** Low (tests will catch regressions)
- **Value:** High (prevents bugs, improves maintainability)
- **Quality improvement:** 7/10 → 9/10

## Implementation Plan

If you'd like me to implement these improvements, I will proceed in this order:
1. **Fix immutability violations** (highest priority - prevents bugs)
2. **Centralize error handling** (high impact - removes duplication)
3. **Rename all functions with poor naming** (improves readability)
4. **Add missing tests** (safety net before refactoring)
5. **Refactor complex methods** (improves structure)
6. **Apply language-specific best practices** (idioms, type safety, etc.)
7. **Extract duplicated logic** (DRY)
8. **Update/add documentation** (completeness)

**Estimated time:** 3-4 hours
**Risk level:** Low (incremental changes with tests)
**Quality gain:** +2 points (7/10 → 9/10)

Would you like me to proceed with these improvements?
```

## Notes

- This command is read-only by default (analysis only)
- Requires user approval before making code changes
- Always run tests after applying improvements
- Consider creating a git branch for significant refactoring
- Lint checks should pass after changes
