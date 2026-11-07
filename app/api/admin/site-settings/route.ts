import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import {
  discardDraftSiteSettings,
  getAdminSiteSettings,
  publishDraftSiteSettings,
  saveDraftSiteSettings,
} from '@/lib/site-settings';
import { SiteSettingsSchema } from '@/lib/validators';
import type { SiteSettings } from '@/lib/site-settings-types';

export const dynamic = 'force-dynamic';

function isAllowedServiceUrl(value: string, hosts: string[]) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && hosts.includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function withGeneratedWhatsappLink(settings: SiteSettings): SiteSettings {
  const digits = settings.contacts.whatsapp_number.replace(/\D/g, '');
  if (!settings.contacts.whatsapp_link && digits.length >= 10 && digits.length <= 15) {
    const message = encodeURIComponent(settings.contacts.whatsapp_message);
    return {
      ...settings,
      contacts: {
        ...settings.contacts,
        whatsapp_link: `https://wa.me/${digits}${message ? `?text=${message}` : ''}`,
      },
    };
  }
  return settings;
}

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const content = await getAdminSiteSettings();
    return NextResponse.json(content.draft, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Has-Unpublished-Changes': String(content.hasUnpublishedChanges),
        'X-Published-Version': String(content.version),
        'X-Published-At': content.publishedAt?.toISOString() || '',
      },
    });
  } catch (error) {
    console.error('Erro ao carregar conteúdo do CMS:', error);
    return NextResponse.json({ error: 'Não foi possível carregar o conteúdo.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body: unknown = await request.json();
    const parsed = SiteSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Revise os campos indicados antes de salvar.',
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const settings = withGeneratedWhatsappLink(parsed.data);
    if (!isAllowedServiceUrl(settings.contacts.whatsapp_link, ['wa.me', 'api.whatsapp.com'])) {
      return NextResponse.json(
        { error: 'WhatsApp: use um link HTTPS de wa.me ou api.whatsapp.com.' },
        { status: 400 },
      );
    }
    if (!isAllowedServiceUrl(settings.contacts.instagram_url, ['instagram.com', 'www.instagram.com'])) {
      return NextResponse.json(
        { error: 'Instagram: use um link HTTPS de instagram.com.' },
        { status: 400 },
      );
    }
    if (
      !isAllowedServiceUrl(settings.contacts.tiktok_url, [
        'tiktok.com',
        'www.tiktok.com',
        'vm.tiktok.com',
      ])
    ) {
      return NextResponse.json(
        { error: 'TikTok: use um link HTTPS de tiktok.com ou vm.tiktok.com.' },
        { status: 400 },
      );
    }

    const draft = await saveDraftSiteSettings(settings);
    return NextResponse.json({
      success: true,
      message: 'Rascunho salvo. Ele ainda não está visível publicamente.',
      data: draft,
    });
  } catch (error) {
    console.error('Erro ao salvar rascunho do CMS:', error);
    return NextResponse.json({ error: 'Não foi possível salvar o rascunho.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || !('action' in body)) {
      return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
    }

    const action = body.action;
    if (action === 'publish') {
      const result = await publishDraftSiteSettings();
      return NextResponse.json({ success: true, ...result });
    }
    if (action === 'discard') {
      const settings = await discardDraftSiteSettings();
      return NextResponse.json({ success: true, settings });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao executar ação do CMS:', error);
    return NextResponse.json({ error: 'Não foi possível concluir a ação.' }, { status: 500 });
  }
}
