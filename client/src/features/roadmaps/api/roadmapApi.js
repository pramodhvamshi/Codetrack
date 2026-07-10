import { api } from '../../../api/client';

export const getRoadmaps = async () => {
  const response = await api.getJson('/roadmaps');
  return response;
};

export const getRoadmapNodes = async (roadmapId) => {
  const response = await api.getJson(`/roadmaps/${roadmapId}/nodes`);
  return response;
};

export const getRoadmapProgress = async (roadmapId) => {
  const response = await api.getJson(`/roadmaps/progress/${roadmapId}`);
  return response;
};

export const updateNodeProgress = async (roadmapId, nodeId, status) => {
  const response = await api.putJson(`/roadmaps/progress/node/${nodeId}`, { roadmapId, status });
  return response;
};

export const getCoordinatorRoadmapProgress = async (studentId, roadmapId) => {
  const response = await api.getJson(`/coordinator/roadmaps/${studentId}/${roadmapId}/progress`);
  return response;
};
