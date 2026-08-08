import { api } from './client';

export const alumniApi = {
  searchAlumni: (page = 1, query = '', batch = '', branch = '', company = '', location = '') =>
    api.getJson(`/v2/alumni?page=${page}&query=${encodeURIComponent(query)}&batch=${encodeURIComponent(batch)}&branch=${encodeURIComponent(branch)}&company=${encodeURIComponent(company)}&location=${encodeURIComponent(location)}`),

  getSuggestions: () =>
    api.getJson('/v2/alumni/suggestions'),

  addAlumnus: (alumniData) =>
    api.postJson('/v2/alumni/add', alumniData),

  importAlumni: (formData) =>
    api.postForm('/v2/alumni/import', formData),

  getPublicProfile: (userId) =>
    api.getJson(`/v2/alumni/${userId}`)
};
