'use client';

import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState } from './store';
import { useEffect, useRef } from 'react';
import { restoreAuth, logout, setHydrated } from './slices/authSlice';

const decodeJwtPayload = (token: string): Record<string, any> | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad =
      base64.length % 4 === 0 ? base64 : base64 + '='.repeat(4 - (base64.length % 4));
    const jsonPayload = decodeURIComponent(
      window
        .atob(pad)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const isTokenExpiredRaw = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return false;
  return Date.now() >= payload.exp * 1000;
};

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const isHydrated = useSelector((state: RootState) => state.auth.isHydrated);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || isHydrated) return;
    initializedRef.current = true;

    try {
      const storedToken =
        localStorage.getItem('token') ||
        (() => {
          const match = document.cookie.match(/(?:^|; )token=([^;]+)/);
          return match ? decodeURIComponent(match[1]) : '';
        })();

      if (!storedToken || isTokenExpiredRaw(storedToken)) {
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          document.cookie = 'token=; Max-Age=0; Path=/; SameSite=Lax';
        } catch {}
        dispatch(setHydrated());
        return;
      }

      // Fast restore from localStorage cached user
      const storedUser = (() => {
        try {
          const raw = localStorage.getItem('user');
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      })();

      if (storedUser && (storedUser._id || storedUser.id)) {
        dispatch(
          restoreAuth({
            token: storedToken,
            user: { ...storedUser, _id: storedUser._id || storedUser.id },
          })
        );
      } else {
        const payload = decodeJwtPayload(storedToken);
        if (payload) {
          dispatch(
            restoreAuth({
              token: storedToken,
              user: {
                _id: payload.userId || payload._id || payload.sub || '',
                name: payload.name || payload.fullName || '',
                email: payload.email || '',
                role: payload.role || 'learner',
              },
            })
          );
        } else {
          dispatch(setHydrated());
        }
      }
    } catch (e) {
      console.warn('Auth initialization error:', e);
      dispatch(setHydrated());
    }
  }, [dispatch, isHydrated]);

  return <>{children}</>;
}

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
