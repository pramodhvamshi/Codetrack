import { api } from '../../../api/client';

export const getDSASheets = async () => {
  const response = await api.getJson('/dsa');
  return response;
};

export const getDSASheetCategories = async (sheetId) => {
  const response = await api.getJson(`/dsa/${sheetId}/categories`);
  return response;
};

export const getDSAProgress = async (sheetId) => {
  const response = await api.getJson(`/dsa/progress/${sheetId}`);
  return response;
};

export const updateDSAProgress = async (problemId, status) => {
  const response = await api.putJson(`/dsa/progress/problem/${problemId}`, { status });
  return response;
};

export const getCoordinatorDSAProgress = async (studentId, sheetId) => {
  const response = await api.getJson(`/coordinator/dsa/${studentId}/${sheetId}/progress`);
  return response;
};
