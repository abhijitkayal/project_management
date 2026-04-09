'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { SpinnerFullscreen } from './ui/spinner';
import { useAuth } from './AuthContext';
import type { Collaborator } from './Header';

interface LayoutContextType {
  view: string;
  setView: (view: string) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a ClientLayout');
  }
  return context;
}

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, checkAuth } = useAuth();
   
  // Use state with lazy initialization to avoid hydration mismatch
  const [mounted, setMounted] = useState(() => {
    if (typeof window !== 'undefined') {
      return true;
    }
    return false;
  });
  const [view, setView] = useState('Dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [headerCollaborators, setHeaderCollaborators] = useState<Collaborator[]>([]);
  const [headerTitle, setHeaderTitle] = useState('Team Project');

  // Shared pages now use the same app chrome for consistent UX.
  const isSharedPage = pathname?.startsWith('/shared');
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup');

  // Set mounted on client
  if (typeof window !== 'undefined' && !mounted) {
    setMounted(true);
  }

  // Check auth on mount
  useEffect(() => {
    if (mounted) {
      checkAuth();
    }
  }, [mounted]);

  // Handle redirect after auth check - use setTimeout to avoid synchronous setState
  useEffect(() => {
    if (mounted && isAuthenticated && isAuthPage && user?.id) {
      setTimeout(() => {
        setRedirecting(true);
        router.push(`/${user.id}`);
      }, 0);
    }
  }, [mounted, isAuthenticated, isAuthPage, user?.id, router]);

  // Reset redirecting state when we leave auth pages or when pathname changes
  useEffect(() => {
    if (!isAuthPage) {
      setTimeout(() => {
        setRedirecting(false);
      }, 0);
    }
  }, [isAuthPage]);

  useEffect(() => {
    if (mounted) {
      // Use requestAnimationFrame to avoid setState in effect warning
      const animId = requestAnimationFrame(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 1500);
      });
      return () => {
        cancelAnimationFrame(animId);
      };
    }
  }, [pathname, mounted]);

  useEffect(() => {
    let cancelled = false;

    const deriveName = (email: string) => {
      const local = String(email || '').split('@')[0] || 'User';
      return local.replace(/[._-]+/g, ' ').trim();
    };

    const loadHeaderMeta = async () => {
      if (!pathname) return;

      setHeaderCollaborators([]);
      setHeaderTitle('Team Project');

      try {
        if (pathname.startsWith('/projects/')) {
          const segments = pathname.split('/').filter(Boolean);
          const projectId = segments[1];
          if (!projectId) return;

          const [collabRes, projectsRes] = await Promise.all([
            fetch(`/api/projects/${projectId}/collaborators`, { cache: 'no-store' }),
            fetch('/api/projects', { cache: 'no-store' }),
          ]);

          if (!cancelled && projectsRes.ok) {
            const projects = await projectsRes.json();
            if (Array.isArray(projects)) {
              const found = projects.find((p: any) => p?._id === projectId);
              if (found?.name) {
                setHeaderTitle(found.name);
              }
            }
          }

          if (!cancelled && collabRes.ok) {
            const data = await collabRes.json();
            const list = Array.isArray(data?.collaborators) ? data.collaborators : [];
            const normalized = list
              .filter((c: any) => c?.status === 'accepted' || c?.status === 'pending')
              .map((c: any, idx: number) => ({
                _id: `${c.email || idx}`,
                email: c.email,
                name: deriveName(c.email),
              }));
            setHeaderCollaborators(normalized);
          }
          return;
        }

        if (pathname.startsWith('/shared/')) {
          const segments = pathname.split('/').filter(Boolean);
          const token = segments[1];
          if (!token) return;

          const res = await fetch(`/api/shared/${token}`, { cache: 'no-store' });
          if (!res.ok || cancelled) return;

          const data = await res.json();
          if (!cancelled && data?.project?.name) {
            setHeaderTitle(data.project.name);
          }

          const list = Array.isArray(data?.collaborators) ? data.collaborators : [];
          const normalized = list
            .filter((c: any) => c?.status === 'accepted' || c?.status === 'pending')
            .map((c: any, idx: number) => ({
              _id: `${c.email || idx}`,
              email: c.email,
              name: deriveName(c.email),
            }));
          setHeaderCollaborators(normalized);
        }
      } catch {
        if (!cancelled) {
          setHeaderCollaborators([]);
        }
      }
    };

    if (mounted && (isAuthenticated || isSharedPage)) {
      void loadHeaderMeta();
    }

    return () => {
      cancelled = true;
    };
  }, [pathname, mounted, isAuthenticated, isSharedPage]);

  // Show loading while checking auth
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1625]">
        <SpinnerFullscreen text="Loading..." />
      </div>
    );
  }

  // Show redirecting spinner
  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1625]">
        <SpinnerFullscreen text="Redirecting..." />
      </div>
    );
  }

  const isDark = resolvedTheme === 'dark';

  // If not authenticated, show auth page without sidebar
  if (!isAuthenticated && !isSharedPage && !isAuthPage) {
    return (
      <LayoutContext.Provider value={{ view, setView }}>
        <div className="min-h-screen flex items-center justify-center bg-[#1a1625]">
          {children}
        </div>
      </LayoutContext.Provider>
    );
  }

  // Auth pages use their own layout and should not render app chrome.
  if (isAuthPage) {
    return (
      <LayoutContext.Provider value={{ view, setView }}>
        {children}
      </LayoutContext.Provider>
    );
  }

  return (
    <LayoutContext.Provider value={{ view, setView }}>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        <Sidebar view={view} setView={setView} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header collaborators={headerCollaborators} title={headerTitle} />

          <div className={`flex-1 overflow-y-auto transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-zinc-100'}`}>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="global-loader"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <SpinnerFullscreen />
                </motion.div>
              ) : (
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="h-full"
                >
                  {children}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
