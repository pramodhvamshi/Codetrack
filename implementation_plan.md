# Mandatory Accomplishment Module Implementation Plan

This plan details the steps required to implement the Phase 2 Mandatory Accomplishment Module, which involves adding a new scoring system with extensible categories, extending the `StudentProfile` schema, updating sync services, extending the student profile frontend, coordinator view, and PDF report generation.

## Proposed Changes

### Database & Schema Updates

#### [MODIFY] [StudentProfile.js](file:///c:/Users/Medha%20Trust/Downloads/codetrack/server/src/models/StudentProfile.js)
- Add a new schema definition for `mandatoryAccomplishments` inside the existing `StudentProfileSchema`.
- **Design the schema to be extensible** so additional categories can be introduced later without changing the existing database structure. Avoid hardcoding assumptions that exactly seven categories will always exist.
- Include fields for:
  - `technicalCourses`: Array of course objects (name, platform, date, status, link).
  - `codingConsistency`: Object for arraysSolved, stringsSolved, and lastSyncedAt.
  - `projects`: Array of technical projects.
  - `contestPerformance`: Object for LC/CodeChef ratings and selectedPlatform.
  - `hackathons`: Array of hackathon objects.
  - `personalityActivities`: Array of activity objects.
  - `calculatedScores`: Object for all category scores and total score.

### Backend Calculation & Sync Engine

> [!IMPORTANT]
> **All Mandatory Accomplishment scores must be calculated exclusively on the backend. The frontend should only display the calculated values. Never calculate scores in React.**
> **Do not calculate scores every time the page loads.** The backend will calculate scores only when the student saves the profile or when LeetCode Sync runs. The calculated scores will be stored in MongoDB and read by the frontend, Coordinator view, and PDF Generation.

#### [NEW] [mandatoryAccomplishmentsUtils.js](file:///c:/Users/Medha%20Trust/Downloads/codetrack/server/src/utils/mandatoryAccomplishmentsUtils.js)
- Create an engine utility function `calculateMandatoryScores(profile, user)` that implements the scoring logic.
- Calculate scores for CGPA (max 10), Technical Courses (5 for 1, 10 for 2+), Coding Consistency (Arrays + Strings), Projects (5 for 1, 10 for 2+), Contest Performance (Normalized LC/CodeChef map), Hackathons (5, 7, 9, 10), Personality Development (10 for 1+).
- Return the recalculated `calculatedScores` object.

#### [MODIFY] [leetcodeService.js](file:///c:/Users/Medha%20Trust/Downloads/codetrack/server/src/services/leetcodeService.js)
- **First inspect the current LeetCode GraphQL queries already used in the project. Extend the existing queries if possible. If topic-wise solved counts are not available directly, implement an additional GraphQL query or processing logic to retrieve the solved count for the "Array" and "String" topics. Do not assume `tagProblemCounts` contains this data. Validate the response structure before implementation.**
- Expose these counts in the returned format data.

#### [MODIFY] [platformSyncService.js](file:///c:/Users/Medha%20Trust/Downloads/codetrack/server/src/services/platformSyncService.js)
- In `syncNormalizedProfiles`, map the newly fetched Arrays/Strings counts from Leetcode to `studentProfile.mandatoryAccomplishments.codingConsistency`.
- Call `calculateMandatoryScores` and save the recalculated `studentProfile`.

### Student Routes Updates

#### [MODIFY] [student.js](file:///c:/Users/Medha%20Trust/Downloads/codetrack/server/src/routes/student.js)
- Add a new set of API routes to get and update `mandatoryAccomplishments`:
  - `GET /me/profile/mandatory-accomplishments`
  - `PUT /me/profile/mandatory-accomplishments`
- Ensure updating sub-documents triggers a recalculation using `calculateMandatoryScores`.
- In `GET /me`, return the `mandatoryAccomplishments` object so it's accessible everywhere.

### Coordinator APIs Updates

#### [MODIFY] [coordinator.js](file:///c:/Users/Medha%20Trust/Downloads/codetrack/server/src/routes/coordinator.js)
- Ensure the student profile fetch for coordinator view includes `mandatoryAccomplishments` from `StudentProfile`.

### Frontend Updates

#### [MODIFY] [StudentProfileEdit.jsx](file:///c:/Users/Medha%20Trust/Downloads/codetrack/client/src/pages/student/StudentProfileEdit.jsx) (and related)
- Create a new tab for "Mandatory Accomplishments".
- Add forms/cards for:
  - Technical Courses (Add Course, List Courses)
  - Technical Projects (Add Project, List Projects)
  - Hackathons (Add Hackathon, List Hackathons)
  - Personality Activities (Add Activity, List Activities)
- Display read-only Coding Consistency (Arrays/Strings counts) based on user state.
- Display read-only Contest Performance.

#### [MODIFY] [PublicStudentProfile.jsx](file:///c:/Users/Medha%20Trust/Downloads/codetrack/client/src/pages/shared/PublicStudentProfile.jsx)
- Display the Mandatory Accomplishments section as read-only.
- Show Raw Evidence and Calculated Score for each category.

#### [MODIFY] [CoordinatorStudentProfile.jsx] (Or equivalent admin view file)
- Render the exact required table showing Category, Evidence, Score, and Total Score for Mandatory Accomplishments.
- **Coordinator should see raw evidence.** For example, for Coding Consistency:
  - Arrays: 148 / 300
  - Strings: 112 / 300
  - Score: 4.33 / 10

### PDF Report Integration

#### [MODIFY] [pdfReport.js](file:///c:/Users/Medha%20Trust/Downloads/codetrack/server/src/utils/pdfReport.js)
- Add a new dedicated section titled "MANDATORY ACCOMPLISHMENT SCORE".
- **The PDF must render the already stored calculated scores from MongoDB. It must not execute any score calculation during PDF generation.**
- Render a clear table mapping Categories to Supporting Evidence and Scores (out of 10).
- Render the Total Score out of 70 at the bottom without wrapping.

## Verification Plan

### Automated Tests
- No new automated test frameworks identified, but manual script tests (`test_lc.js`, etc.) can be modified to verify the GraphQL extraction logic.

### Manual Verification
- Log in as a student, navigate to profile edit, and fill out 2 courses, 1 project, 1 hackathon, and 1 personality activity.
- Verify scores calculate automatically in the backend when saved.
- Force a platform sync for LeetCode and verify Arrays and Strings populate properly in the database and UI.
- Log in as a coordinator, search for the student, and verify the structured score table.
- Download the PDF Report and visually inspect the new table alignment and data accuracy.
