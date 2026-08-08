import { api } from './client';

export const jobApi = {
  getJobs: (page = 1, type = 'all', keyword = '', location = '') =>
    api.getJson(`/v2/jobs?page=${page}&type=${type}&keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`),

  createJob: (jobData) =>
    api.postJson('/v2/jobs', jobData),

  getStudentResumes: () =>
    api.getJson('/v2/jobs/student-resumes'),

  uploadResume: (formData) =>
    api.postForm('/v2/jobs/upload-resume', formData),

  applyToJob: (jobId, applicationData) =>
    api.postJson(`/v2/jobs/${jobId}/apply`, applicationData),

  getMyApplications: () =>
    api.getJson('/v2/jobs/applications/me'),

  getJobApplications: (jobId) =>
    api.getJson(`/v2/jobs/${jobId}/applications`),

  updateApplicationStatus: (applicationId, status) =>
    api.patchJson(`/v2/jobs/applications/${applicationId}/status`, { status })
};
