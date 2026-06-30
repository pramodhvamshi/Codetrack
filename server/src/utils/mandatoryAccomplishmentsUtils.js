/**
 * Utility to calculate Mandatory Accomplishment Scores
 */

function getLeetCodeNormalizedScore(rating) {
  if (rating < 1200) return 0;
  if (rating < 1280) return 1;
  if (rating < 1360) return 2;
  if (rating < 1440) return 3;
  if (rating < 1520) return 4;
  if (rating < 1600) return 5;
  if (rating < 1680) return 6;
  if (rating < 1760) return 7;
  if (rating < 1840) return 8;
  if (rating < 1920) return 9;
  return 10;
}

function getCodeChefNormalizedScore(rating) {
  if (rating < 1000) return 0;
  if (rating < 1200) return 1;
  if (rating < 1300) return 2;
  if (rating < 1400) return 3;
  if (rating < 1500) return 4;
  if (rating < 1600) return 5;
  if (rating < 1700) return 6;
  if (rating < 1800) return 7;
  if (rating < 1900) return 8;
  if (rating < 2000) return 9;
  return 10;
}

function getHackathonScore(position) {
  const pos = (position || "").toLowerCase();
  if (pos.includes('winner') || pos.includes('1st')) return 10;
  if (pos.includes('2nd') || pos.includes('3rd') || pos.includes('top 3')) return 9;
  if (pos.includes('top 10')) return 7;
  return 5; // participation
}

function calculateMandatoryScores(profile, userOverallGpa = 0) {
  const ma = profile.mandatoryAccomplishments || {};
  
  // 1. CGPA
  // Need to get CGPA from AcademicProfile or User. We passed it as userOverallGpa.
  let cgpaScore = Number(userOverallGpa) || 0;
  if (cgpaScore > 10) cgpaScore = 10; // safety

  // 2. Technical Courses
  const courses = ma.technicalCourses || [];
  const completedCourses = courses.filter(c => c.status === 'Completed').length;
  let coursesScore = 0;
  if (completedCourses === 1) coursesScore = 5;
  else if (completedCourses >= 2) coursesScore = 10;

  // 3. Coding Consistency (Arrays + Strings)
  const consistency = ma.codingConsistency || {};
  const arraysSolved = Math.min(consistency.arraysSolved || 0, 300);
  const stringsSolved = Math.min(consistency.stringsSolved || 0, 300);
  const arraysScore = (arraysSolved / 300) * 5;
  const stringsScore = (stringsSolved / 300) * 5;
  const codingConsistencyScore = arraysScore + stringsScore;

  // 4. Technical Projects
  const projects = ma.projects || [];
  let projectsScore = 0;
  if (projects.length === 1) projectsScore = 5;
  else if (projects.length >= 2) projectsScore = 10;

  // 5. Contest Performance
  const contest = ma.contestPerformance || {};
  const lcScore = getLeetCodeNormalizedScore(contest.leetcodeRating || 0);
  const ccScore = getCodeChefNormalizedScore(contest.codechefRating || 0);
  let contestScore = 0;
  let selectedPlatform = "";
  if (lcScore >= ccScore && lcScore > 0) {
    contestScore = lcScore;
    selectedPlatform = "LeetCode";
  } else if (ccScore > lcScore && ccScore > 0) {
    contestScore = ccScore;
    selectedPlatform = "CodeChef";
  }

  // 6. Technical Hackathons
  const hackathons = ma.hackathons || [];
  let hackathonsScore = 0;
  if (hackathons.length > 0) {
    // Take the maximum score among all hackathons
    hackathonsScore = Math.max(...hackathons.map(h => getHackathonScore(h.position)));
  }

  // 7. Personality Development
  const personality = ma.personalityActivities || [];
  const personalityScore = personality.length > 0 ? 10 : 0;

  const totalScore = cgpaScore + coursesScore + codingConsistencyScore + projectsScore + contestScore + hackathonsScore + personalityScore;

  return {
    cgpa: Number(cgpaScore.toFixed(2)),
    technicalCourses: coursesScore,
    codingConsistency: Number(codingConsistencyScore.toFixed(2)),
    projects: projectsScore,
    contestPerformance: contestScore,
    hackathons: hackathonsScore,
    personalityDevelopment: personalityScore,
    total: Number(totalScore.toFixed(2))
  };
}

module.exports = {
  calculateMandatoryScores
};
