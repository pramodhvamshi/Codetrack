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

function calculatePlacementReadiness(user, profile, codingProfile, defaultResumeVersion) {
  const lcSolved = Number(user.platformStats?.leetcode?.problemsSolved || 0);
  const ccSolved = Number(user.platformStats?.codechef?.problemsSolved || 0);
  const gfgSolved = Number(user.platformStats?.geeksforgeeks?.totalProblemsSolved || user.platformStats?.geeksforgeeks?.problemsSolved || 0);
  const hrSolved = Number(codingProfile?.hackerrank?.problemSolving?.solved || user.hackerrank?.totalProblemsSolved || 0);
  
  const totalSolved = lcSolved + ccSolved + gfgSolved + hrSolved;
  const dsaScore = Math.min(100, Math.round((totalSolved / 300) * 100));

  const projects = profile.projects || [];
  const projectsScore = Math.min(100, projects.length * 25);

  const resumeScore = defaultResumeVersion ? (defaultResumeVersion.atsScore || defaultResumeVersion.completenessScore || 0) : 0;

  const profileScore = profile.profileCompletion || 0;

  const overallReadiness = Math.round((dsaScore + projectsScore + resumeScore + profileScore) / 4);

  return {
    dsaScore,
    projectsScore,
    resumeScore,
    profileScore,
    overallReadiness
  };
}

module.exports = {
  calculateProfileCompletion,
  calculatePlacementReadiness
};
