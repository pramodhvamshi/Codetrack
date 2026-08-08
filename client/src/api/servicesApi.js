import { api } from './client';

export const servicesApi = {
  // Leave Requests
  submitLeave: (payload, token) => api.postJson('/services/leave', payload, token),
  getStudentLeaves: (token) => api.getJson('/services/leave/student', token),
  getCoordinatorLeaves: (token) => api.getJson('/services/leave/coordinator', token),
  updateLeaveStatus: (id, payload, token) => api.patchJson(`/services/leave/${id}/status`, payload, token),

  // Mentoring Requests & Calendar
  getSlots: (date, token) => api.getJson(`/services/mentoring/slots?date=${date}`, token),
  bookMentoring: (payload, token) => api.postJson('/services/mentoring/book', payload, token),
  getStudentMentoring: (token) => api.getJson('/services/mentoring/student', token),
  getCoordinatorMentoring: (token) => api.getJson('/services/mentoring/coordinator', token),
  approveModifyMentoring: (id, payload, token) => api.patchJson(`/services/mentoring/${id}/approve-modify`, payload, token),
  saveMeetingNotes: (id, payload, token) => api.patchJson(`/services/mentoring/${id}/meeting-notes`, payload, token),
  getStudentProfileNotes: (studentId, token) => api.getJson(`/services/mentoring/student-profile/${studentId}/notes`, token),

  // Laptop Inventory & Issues
  getLaptopInventory: (token) => api.getJson('/services/laptops/inventory', token),
  updateLaptopInventoryItem: (id, payload, token) => api.patchJson(`/services/laptops/inventory/${id}`, payload, token),
  reportLaptopIssue: (payload, token) => api.postJson('/services/laptops/report-issue', payload, token),
  getLaptopRequests: (token) => api.getJson('/services/laptops/requests', token),
  updateLaptopRequestStatus: (id, payload, token) => api.patchJson(`/services/laptops/request/${id}/status`, payload, token),
};
