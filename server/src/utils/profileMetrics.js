function calculateProfileCompletion(user, profile) {
  let score = 0;
  
  // 1. Personal Details (25 points total)
  const pd = profile.personalDetails || {};
  let personalPoints = 0;
  if (pd.fullName) personalPoints += 3;
  if (pd.gender) personalPoints += 3;
  if (pd.dob) personalPoints += 3;
  if (pd.mobile) personalPoints += 3;
  if (pd.email) personalPoints += 3;
  if (pd.hostelName) personalPoints += 2;
  if (pd.section) personalPoints += 2;
  if (pd.permanentAddress) personalPoints += 2;
  if (pd.city && pd.pincode) personalPoints += 4;
  score += personalPoints; // max 25

  // 2. Family Details (25 points total)
  const fd = profile.familyDetails || {};
  let familyPoints = 0;
  if (fd.parentStatus) familyPoints += 5;
  if (fd.father?.name && fd.father?.occupation) familyPoints += 10;
  if (fd.mother?.name && fd.mother?.occupation) familyPoints += 10;
  score += Math.min(25, familyPoints);

  // 3. Professional Details (25 points total)
  let profPoints = 0;
  if (profile.education && profile.education.length > 0) profPoints += 10;
  if (profile.skills && profile.skills.length >= 3) profPoints += 5;
  if (profile.projects && profile.projects.length >= 1) profPoints += 5;
  if (profile.certifications && profile.certifications.length >= 1) profPoints += 5;
  score += profPoints;

  // 4. Coding Handles (25 points total)
  let codingPoints = 0;
  if (user.leetcodeUsername) codingPoints += 5;
  if (user.codechefUsername) codingPoints += 5;
  if (user.gfgUsername) codingPoints += 5;
  if (user.githubUsername) codingPoints += 5;
  if (user.hackerrankUsername) codingPoints += 5;
  score += codingPoints;

  return Math.min(100, score);
}

function getRatingScore(rating) {
  if (rating < 1200) return 0;
  if (rating < 1300) return 1;
  if (rating < 1400) return 2;
  if (rating < 1500) return 3;
  if (rating < 1600) return 4;
  if (rating < 1700) return 5;
  if (rating < 1750) return 6;
  return 7;
}

function getContestParticipationScore(contests) {
  if (contests >= 30) return 3;
  if (contests >= 20) return 2;
  if (contests >= 10) return 1;
  return 0;
}

function calculateDSAScore(leetcodeStats) {
  if (!leetcodeStats) return { total: 0, problemSolving: 0, difficulty: 0, topicCoverage: 0, contest: 0 };
  
  const totalSolved = leetcodeStats.totalSolved || 0;
  const easy = leetcodeStats.easySolved || 0;
  const medium = leetcodeStats.mediumSolved || 0;
  const hard = leetcodeStats.hardSolved || 0;
  
  // A. Problem Solving (30)
  const problemSolving = Math.min(totalSolved, 400) / 400 * 30;
  
  // B. Difficulty Distribution (30)
  const easyScore = Math.min(easy, 150) / 150 * 10;
  const mediumScore = Math.min(medium, 200) / 200 * 15;
  const hardScore = Math.min(hard, 50) / 50 * 5;
  const difficulty = easyScore + mediumScore + hardScore;
  
  // C. Topic Coverage (30)
  const topicCoverage = leetcodeStats.topicScores?.totalTopicScore || 0;
  
  // D. Contest Performance (10)
  const rating = leetcodeStats.rating || leetcodeStats.contestRating || 0;
  const contests = leetcodeStats.contestCount || 0;
  const contest = getRatingScore(rating) + getContestParticipationScore(contests);
  
  const total = Number((problemSolving + difficulty + topicCoverage + contest).toFixed(2));
  
  return {
    problemSolving: Number(problemSolving.toFixed(2)),
    difficulty: Number(difficulty.toFixed(2)),
    topicCoverage: Number(topicCoverage.toFixed(2)),
    contest: Number(contest.toFixed(2)),
    total
  };
}

function calculateGitHubScore(githubStats) {
  if (!githubStats) return 0;
  
  // Contributions (40 Marks): 500 contributions = 40 marks
  let totalContributions = 0;
  if (githubStats.contributions) {
    totalContributions = githubStats.contributions.reduce((sum, day) => sum + (day.contributionCount || 0), 0);
  }
  const contribScore = Math.min(totalContributions, 500) / 500 * 40;
  
  // Repositories (20 Marks): 10 repos = 20 marks
  const reposCount = githubStats.publicReposCount || 0;
  const repoScore = Math.min(reposCount, 10) / 10 * 20;
  
  // Recent commits (20 Marks): Up to 20 recent commits
  const commitsCount = (githubStats.recentCommits || []).length;
  const commitScore = Math.min(commitsCount, 20) / 20 * 20;
  
  // README/Profile (10 Marks): Proxy - 10 points if > 5 repos
  const profileScore = reposCount > 5 ? 10 : (reposCount > 0 ? 5 : 0);
  
  // Followers/Stars (10 Marks): 10 combined = 10 marks
  const starsAndFollowers = (githubStats.starsCount || 0) + (githubStats.followers || 0);
  const socialScore = Math.min(starsAndFollowers, 10) / 10 * 10;
  
  return Number((contribScore + repoScore + commitScore + profileScore + socialScore).toFixed(2));
}

function calculatePlacementReadiness(user, profile) {
  // Compute DSA Score (Max 100)
  const dsaBreakdown = calculateDSAScore(user.platformStats?.leetcode);
  const dsaScore = dsaBreakdown.total;
  
  // Compute Projects Score (Max 100)
  const projects = profile.projects || [];
  let projectsScore = 0;
  if (projects.length === 1) projectsScore = 50;
  else if (projects.length >= 2) projectsScore = 100;
  
  // Compute Technical Courses Score (Max 100)
  const ma = profile.mandatoryAccomplishments || user.mandatoryAccomplishments || {};
  const courses = ma.technicalCourses || [];
  const completedCourses = courses.filter(c => c.status === 'Completed').length;
  let coursesScore = 0;
  if (completedCourses === 1) coursesScore = 50;
  else if (completedCourses >= 2) coursesScore = 100;
  
  // Compute CGPA (Max 100)
  const cgpaRaw = profile.overallGpa || user.overallGpa || 0;
  const cgpaScore = Math.min(100, (cgpaRaw / 10) * 100);
  
  const dsaContrib = dsaScore * 0.60;
  const projContrib = projectsScore * 0.20;
  const coursesContrib = coursesScore * 0.10;
  const cgpaContrib = cgpaScore * 0.10;
  
  const finalScore = Number((dsaContrib + projContrib + coursesContrib + cgpaContrib).toFixed(2));
  
  // 1. Calculate Levels
  let dsaLevel = 'Needs Improvement Problem Solver';
  if (dsaScore >= 90) dsaLevel = 'Expert Problem Solver';
  else if (dsaScore >= 75) dsaLevel = 'Advanced Problem Solver';
  else if (dsaScore >= 60) dsaLevel = 'Intermediate Problem Solver';
  else if (dsaScore >= 40) dsaLevel = 'Beginner Problem Solver';

  let readinessLevel = 'Beginner';
  if (finalScore >= 90) readinessLevel = 'Outstanding';
  else if (finalScore >= 75) readinessLevel = 'Placement Ready';
  else if (finalScore >= 60) readinessLevel = 'Developing';
  else if (finalScore >= 40) readinessLevel = 'Foundation';

  // 2. Calculate Strengths & Weaknesses
  let sortedTopics = [];
  const lcStats = user.platformStats?.leetcode || {};
  const topicScores = lcStats.topicScores || {};
  const topicKeys = ['arrays', 'strings', 'hashTable', 'twoPointers', 'binarySearch', 'trees', 'dynamicProgramming', 'graphs', 'greedy', 'linkedList'];
  const topicNames = {
    arrays: 'Arrays', strings: 'Strings', hashTable: 'Hash Tables', twoPointers: 'Two Pointers',
    binarySearch: 'Binary Search', trees: 'Trees', dynamicProgramming: 'Dynamic Programming',
    graphs: 'Graphs', greedy: 'Greedy', linkedList: 'Linked Lists'
  };
  
  topicKeys.forEach(k => {
    if (topicScores[k]) sortedTopics.push({ key: k, label: topicNames[k], completion: topicScores[k].completion });
  });
  sortedTopics.sort((a, b) => b.completion - a.completion);
  
  const strengths = sortedTopics.filter(t => t.completion >= 50).slice(0, 3).map(t => t.label);
  const weaknesses = sortedTopics.filter(t => t.completion < 50).reverse().slice(0, 3).map(t => t.label);

  if (dsaBreakdown.difficulty > 20 && strengths.length < 3) strengths.push("Medium/Hard Problems");
  if (dsaBreakdown.difficulty < 10 && weaknesses.length < 3) weaknesses.push("Hard Problems");
  if (lcStats.rating < 1400 && weaknesses.length < 3) weaknesses.push("Contest Rating");
  if (lcStats.rating >= 1500 && strengths.length < 3) strengths.push("Contest Rating");
  if (dsaBreakdown.problemSolving >= 20 && strengths.length < 3) strengths.push("Consistency");

  // 3. Mentor Recommendations
  const recommendations = [];
  if (dsaBreakdown.problemSolving < 30) {
    const totalSolved = lcStats.totalSolved || 0;
    if (totalSolved < 400) recommendations.push(`Solve ${400 - totalSolved} more problems to reach the 400 benchmark.`);
  }
  const dpScore = topicScores['dynamicProgramming']?.completion || 0;
  if (dpScore < 50) recommendations.push(`Solve more Dynamic Programming problems to improve your topic coverage.`);
  if (lcStats.rating < 1500) recommendations.push(`Increase LeetCode Contest Rating to 1500+ by participating consistently.`);
  if (projects.length < 2) recommendations.push(`Complete at least one additional technical project with a live URL.`);
  if (!profile.mandatoryAccomplishments?.hackathons || profile.mandatoryAccomplishments.hackathons.length === 0) {
    if (!user.mandatoryAccomplishments?.hackathons || user.mandatoryAccomplishments.hackathons.length === 0) {
      recommendations.push(`Participate in at least one verified technical hackathon.`);
    }
  }
  if (recommendations.length === 0) recommendations.push(`Maintain your excellent consistency and start preparing for advanced mock interviews.`);

  // 4. Overall Remark
  let overallRemark = '';
  if (finalScore >= 70) {
    overallRemark = `The student has built a strong coding foundation with excellent consistency. Preparing for advanced mock interviews and system design will significantly enhance placement readiness.`;
  } else if (finalScore >= 55) {
    overallRemark = `The student shows good progress. Improving advanced DSA topics, contest performance, and technical projects will significantly enhance placement readiness.`;
  } else {
    overallRemark = `The student is currently falling behind the recommended benchmarks. Critical focus is required immediately to improve coding practice, clear basics, and update platform profiles.`;
  }

  return {
    dsa: { raw: dsaScore, weight: '60%', contribution: Number(dsaContrib.toFixed(2)), breakdown: dsaBreakdown },
    projects: { raw: projectsScore, weight: '20%', contribution: Number(projContrib.toFixed(2)) },
    courses: { raw: coursesScore, weight: '10%', contribution: Number(coursesContrib.toFixed(2)) },
    cgpa: { raw: cgpaScore, weight: '10%', contribution: Number(cgpaContrib.toFixed(2)) },
    finalScore,
    mentorship: {
      dsaLevel,
      readinessLevel,
      strengths,
      weaknesses,
      recommendations,
      overallRemark
    }
  };
}

module.exports = {
  calculateProfileCompletion,
  calculatePlacementReadiness,
  calculateDSAScore,
  calculateGitHubScore
};
