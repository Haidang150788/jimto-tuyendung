"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SITE_CONTENT,
  type JobItem,
  type LocationItem,
  type SiteContent,
} from "./site-content";
import { getAdminToken } from "./admin-auth";

interface SiteContentContextValue {
  content: SiteContent;
  isLoaded: boolean;
  updateJobs: (updater: (jobs: JobItem[]) => JobItem[]) => Promise<void>;
  resetJobsToDefault: () => Promise<void>;
  updateLocations: (updater: (locations: LocationItem[]) => LocationItem[]) => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [isLoaded, setIsLoaded] = useState(false);
  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    let cancelled = false;

    fetch("/api/content")
      .then((res) => (res.ok ? (res.json() as Promise<SiteContent>) : null))
      .then((data) => {
        if (cancelled) return;
        if (data) setContent(data);
        setIsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setIsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function persist(patch: { jobs?: JobItem[]; locations?: LocationItem[] }) {
    const prev = contentRef.current;
    setContent({ ...prev, ...patch }); // optimistic update

    const token = getAdminToken();
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-admin-token": token } : {}),
        },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const saved = (await res.json()) as SiteContent;
      setContent(saved);
    } catch (err) {
      setContent(prev); // roll back the optimistic update
      throw err;
    }
  }

  const updateJobs = useCallback(
    (updater: (jobs: JobItem[]) => JobItem[]) => persist({ jobs: updater(contentRef.current.jobs) }),
    [],
  );

  const resetJobsToDefault = useCallback(
    () => updateJobs(() => DEFAULT_SITE_CONTENT.jobs),
    [updateJobs],
  );

  const updateLocations = useCallback(
    (updater: (locations: LocationItem[]) => LocationItem[]) =>
      persist({ locations: updater(contentRef.current.locations) }),
    [],
  );

  const value = useMemo(
    () => ({ content, isLoaded, updateJobs, resetJobsToDefault, updateLocations }),
    [content, isLoaded, updateJobs, resetJobsToDefault, updateLocations],
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const ctx = useContext(SiteContentContext);
  if (!ctx) {
    throw new Error("useSiteContent must be used within a SiteContentProvider");
  }
  return ctx;
}
