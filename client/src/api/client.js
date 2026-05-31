const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

async function request(path, options = {}, token) {
  const headers = {
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }

  return res;
}

export const api = {
  postJson: (path, body, token) =>
    request(
      path,
      {
        method: 'POST',
        body: JSON.stringify(body)
      },
      token
    ),
  putJson: (path, body, token) =>
    request(
      path,
      {
        method: 'PUT',
        body: JSON.stringify(body)
      },
      token
    ),
  getJson: (path, token) =>
    request(
      path,
      {
        method: 'GET'
      },
      token
    ),
  postForm: (path, formData, token) =>
    request(
      path,
      {
        method: 'POST',
        body: formData
      },
      token
    )
};

