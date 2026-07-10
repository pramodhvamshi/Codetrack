const DSASheet = require('../models/DSA/DSASheet');
const DSACategory = require('../models/DSA/DSACategory');
const DSAProblem = require('../models/DSA/DSAProblem');
const DSAProgress = require('../models/DSA/DSAProgress');

exports.getAllSheets = async () => {
  return DSASheet.find({}).lean();
};

exports.getSheetDetails = async (sheetId) => {
  const categories = await DSACategory.find({ sheetId }).sort({ order: 1 }).lean();
  const categoryIds = categories.map(c => c._id);
  const problems = await DSAProblem.find({ categoryId: { $in: categoryIds } }).sort({ order: 1 }).lean();

  return categories.map(cat => {
    cat.problems = problems.filter(p => p.categoryId.toString() === cat._id.toString());
    return cat;
  });
};

exports.getStudentProgress = async (studentId, sheetId) => {
  // To get progress for a specific sheet, we technically need the problems of that sheet.
  // However, since progress is mapped by problemId, we can just get all DSAProgress for the student
  // and the frontend can map it to the currently displayed problems.
  const progressList = await DSAProgress.find({ studentId }).lean();
  
  const progressMap = {};
  progressList.forEach(p => {
    progressMap[p.problemId.toString()] = p.status;
  });
  return progressMap;
};

exports.updateProgress = async (studentId, problemId, status) => {
  return DSAProgress.findOneAndUpdate(
    { studentId, problemId },
    { status },
    { upsert: true, new: true }
  );
};
