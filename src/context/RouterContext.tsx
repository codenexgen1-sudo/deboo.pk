import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { applySeoMetadataToDocument } from '../hooks/useSeoMetadata';
import { buildSeoMetadata } from '../utils/seo';

interface RouterContextValue {
  pathname: string;
  search: string;
  searchParams: URLSearchParams;
  navigate: (to: string) => void;
  setPageMeta: (title: string, description?: string) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locationState, setLocationState] = useState(() => ({
    pathname: window.location.pathname || '/',
    search: window.location.search || '',
  }));

  useEffect(() => {
    const handlePopState = () => {
      setLocationState({
        pathname: window.location.pathname || '/',
        search: window.location.search || '',
      });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string) => {
    if (!to) return;
    const url = new URL(to, window.location.origin);
    if (url.pathname === window.location.pathname && url.search === window.location.search) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history.pushState({}, '', url.pathname + url.search);
    setLocationState({
      pathname: url.pathname,
      search: url.search,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const setPageMeta = useCallback(
    (title: string, description?: string) => {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      applySeoMetadataToDocument(
        buildSeoMetadata({
          title,
          description,
          pathname: window.location.pathname || '/',
          origin,
        })
      );
    },
    []
  );

  const searchParams = useMemo(() => new URLSearchParams(locationState.search), [locationState.search]);

  const value = useMemo(
    () => ({
      pathname: locationState.pathname,
      search: locationState.search,
      searchParams,
      navigate,
      setPageMeta,
    }),
    [locationState.pathname, locationState.search, searchParams, navigate, setPageMeta]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used inside RouterProvider');
  return ctx;
}
