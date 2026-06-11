'use client';

import { useEffect } from 'react';
import { create } from 'zustand';

interface PageMetaState {
  /** Override for the LAST breadcrumb segment — used by detail pages to show entity name. */
  breadcrumbOverride: string | null;
  /** Override <title> when the static `metadata` export can't (client-only contexts). */
  titleOverride: string | null;
  setBreadcrumbOverride: (label: string | null) => void;
  setTitleOverride: (title: string | null) => void;
}

export const usePageMetaStore = create<PageMetaState>((set) => ({
  breadcrumbOverride: null,
  titleOverride: null,
  setBreadcrumbOverride: (label) => set({ breadcrumbOverride: label }),
  setTitleOverride: (title) => set({ titleOverride: title }),
}));

/**
 * Use inside a client page when you have dynamic data (e.g. session name) that
 * should appear in the breadcrumb / browser tab title.
 *
 *   usePageMeta({ breadcrumb: session.name, title: session.name })
 *
 * Cleared automatically when the component unmounts.
 */
export function usePageMeta({
  breadcrumb,
  title,
}: { breadcrumb?: string | null; title?: string | null }) {
  const setBreadcrumb = usePageMetaStore((s) => s.setBreadcrumbOverride);
  const setTitle = usePageMetaStore((s) => s.setTitleOverride);

  useEffect(() => {
    if (breadcrumb !== undefined) setBreadcrumb(breadcrumb);
    if (title !== undefined) setTitle(title);

    if (title && typeof document !== 'undefined') {
      const prev = document.title;
      document.title = `${title} · eFit`;
      return () => {
        setBreadcrumb(null);
        setTitle(null);
        document.title = prev;
      };
    }

    return () => {
      setBreadcrumb(null);
      setTitle(null);
    };
  }, [breadcrumb, title, setBreadcrumb, setTitle]);
}
