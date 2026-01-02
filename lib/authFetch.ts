import Router from 'next/router';

export async function authFetch(
  input: RequestInfo,
  init?: RequestInit
) {
  const res = await fetch(input, {
    ...init,
    credentials: 'include',
  });

  if (res.status === 401) {
    Router.replace('/auth/login');
    throw new Error('Not authenticated');
  }

  if (res.status === 403) {
    throw new Error('Not authorized');
  }

  return res;
}
