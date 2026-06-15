export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'https://medhacodetrack-api.vercel.app'
).replace(/\/$/, "");

let currentToken = null;
let isRefreshing = false;
let refreshSubscribers = [];

export function setClientToken(token) {
  currentToken = token;
}

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

async function request(path, options = {}, token) {
  const headers = {
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const activeToken = token || currentToken;
  if (activeToken) {
    headers.Authorization = `Bearer ${activeToken}`;
  }

  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include'
  };

  let res = await fetch(`${API_BASE_URL}/api${path}`, fetchOptions);

  if (res.status === 401 && path !== '/auth/refresh' && path !== '/auth/login' && path !== '/auth/logout') {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          currentToken = data.token;
          isRefreshing = false;
          window.dispatchEvent(new CustomEvent('auth:refresh', { detail: data }));
          onTokenRefreshed(data.token);
        } else {
          isRefreshing = false;
          window.dispatchEvent(new CustomEvent('auth:expired'));
          throw new Error('Session expired');
        }
      } catch (err) {
        isRefreshing = false;
        window.dispatchEvent(new CustomEvent('auth:expired'));
        throw err;
      }
    }

    const retryOrigRequest = new Promise((resolve) => {
      subscribeTokenRefresh((newToken) => {
        headers.Authorization = `Bearer ${newToken}`;
        resolve(fetch(`${API_BASE_URL}/api${path}`, { ...fetchOptions, headers }));
      });
    });

    res = await retryOrigRequest;
  }

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
    ),
  deleteJson: (path, token) =>
    request(
      path,
      {
        method: 'DELETE'
      },
      token
    ),
  patchJson: (path, body, token) =>
    request(
      path,
      {
        method: 'PATCH',
        body: JSON.stringify(body)
      },
      token
    )
};

