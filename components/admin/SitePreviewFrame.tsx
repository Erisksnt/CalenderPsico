'use client';

import { useEffect, useRef, useState } from 'react';
import type { SiteSettings } from '@/lib/site-settings-types';

export default function SitePreviewFrame({ settings }: { settings: SiteSettings }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frameRef.current?.contentWindow ||
        event.data?.type !== 'calenderpsico:preview-ready'
      ) {
        return;
      }
      setReady(true);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    frameRef.current?.contentWindow?.postMessage(
      { type: 'calenderpsico:preview-settings', settings },
      window.location.origin,
    );
  }, [ready, settings]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Preview mobile do rascunho</p>
        <a
          href="/admin/preview"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border px-3 py-1 text-xs font-medium"
        >
          Abrir preview desktop
        </a>
      </div>
      <div className="max-h-[75vh] overflow-auto rounded-xl border bg-white p-2">
        <iframe
          ref={frameRef}
          title="Preview completo do site"
          src="/admin/preview"
          className="min-h-[70vh] border-0"
          style={{ width: '390px', maxWidth: '100%' }}
        />
      </div>
    </div>
  );
}
