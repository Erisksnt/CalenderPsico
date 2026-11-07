'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';

export default function ScrollReveal({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (
      !root ||
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const targets = root.querySelectorAll<HTMLElement>('h1, h2, h3, p, li, img');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-scroll-reveal', 'visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -8% 0px' },
    );

    targets.forEach((target) => {
      if (target.closest('#inicio')) return;
      target.setAttribute('data-scroll-reveal', 'pending');
      observer.observe(target);
    });

    root.setAttribute('data-scroll-reveal-ready', '');

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="contents" data-scroll-reveal-root="">
      {children}
    </div>
  );
}
