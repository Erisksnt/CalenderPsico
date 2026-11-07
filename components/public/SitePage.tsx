import { Fragment, type ReactNode } from 'react';
import type { SiteSectionId, SiteSettings } from '@/lib/site-settings-types';
import PublicShell from '@/components/public/PublicShell';

const SECTION_SPACING = {
  compact: 'py-12 sm:py-16',
  comfortable: 'py-16 sm:py-24',
  spacious: 'py-24 sm:py-32',
} as const;

function SectionHeading({
  eyebrow,
  title,
  description,
  alignment,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  alignment: 'left' | 'center';
}) {
  return (
    <header
      className="mx-auto mb-12 max-w-3xl space-y-4"
      style={{ textAlign: alignment }}
    >
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-accent)]">
          {eyebrow}
        </p>
      )}
      {title && (
        <h2 className="font-display text-3xl leading-tight text-[var(--site-text)] sm:text-4xl lg:text-5xl">
          {title}
        </h2>
      )}
      {description && <p className="text-base leading-relaxed opacity-80">{description}</p>}
    </header>
  );
}

function Photo({
  src,
  alt,
  frame,
}: {
  src: string;
  alt: string;
  frame: SiteSettings['hero']['photo_frame'];
}) {
  if (!src) return null;
  const frameClass = {
    arch: 'rounded-t-[50%] rounded-b-2xl',
    rounded: 'rounded-[2rem]',
    oval: 'rounded-[50%]',
    bordered: 'rounded-[2rem] border-[10px] border-white shadow-xl',
  }[frame];

  return (
    <img
      src={src}
      alt={alt}
      className={`aspect-[4/5] w-full object-cover ${frameClass}`}
    />
  );
}

function HeroSection({ settings }: { settings: SiteSettings }) {
  const { hero, contacts, appearance } = settings;
  const contactHref = contacts.whatsapp_link || '/agendar';

  return (
    <section
      id="inicio"
      className={`relative isolate overflow-hidden px-6 ${SECTION_SPACING[appearance.section_spacing]} sm:px-10 lg:px-16`}
      style={{ backgroundColor: appearance.colors.surface }}
    >
      <img
        src="/images/flor-liz.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-8 left-12 z-0 hidden w-24 -scale-x-100 opacity-15 lg:block"
      />
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div
          data-hero-reveal="copy"
          className="space-y-7"
          style={{ textAlign: appearance.alignment.hero }}
        >
          {hero.badge && (
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-accent)]">
              {hero.badge}
            </p>
          )}
          {(hero.title || hero.title_highlight) && (
            <h1 className="font-display text-4xl leading-[1.12] text-[var(--site-text)] sm:text-5xl lg:text-6xl">
              {hero.title}{' '}
              {hero.title_highlight && (
                <span className="text-[var(--site-accent)]">{hero.title_highlight}</span>
              )}
            </h1>
          )}
          {hero.subtitle && <p className="max-w-2xl text-lg leading-relaxed opacity-80">{hero.subtitle}</p>}
          {hero.specialties.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Áreas de atendimento">
              {hero.specialties.map((item, index) => (
                <li key={`${item}-${index}`} className="rounded-full border border-current/20 px-4 py-2 text-sm">
                  {item}
                </li>
              ))}
            </ul>
          )}
          {hero.highlights.length > 0 && (
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm opacity-75">
              {hero.highlights.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
            </ul>
          )}
          <div
            className="flex flex-wrap gap-3 pt-2"
            style={{ justifyContent: appearance.alignment.hero === 'center' ? 'center' : 'flex-start' }}
          >
            {hero.cta_text && (
              <a className="btn-marsala" href={contactHref} target={contacts.whatsapp_link ? '_blank' : undefined} rel={contacts.whatsapp_link ? 'noopener noreferrer' : undefined}>
                {hero.cta_text}
              </a>
            )}
            {hero.secondary_cta_text && (
              <a className="btn-outline-marsala" href="#sobre">{hero.secondary_cta_text}</a>
            )}
          </div>
        </div>
        <div
          data-hero-reveal="portrait"
          className="relative z-10 order-3 mx-auto w-full max-w-md lg:order-none"
        >
          <Photo src={hero.photo_url} alt={hero.photo_alt} frame={hero.photo_frame} />
        </div>
      </div>
    </section>
  );
}

function AboutSection({ settings }: { settings: SiteSettings }) {
  const { about, contacts } = settings;
  return (
    <section
      id="sobre"
      className={`relative isolate px-6 ${SECTION_SPACING[settings.appearance.section_spacing]} sm:px-10 lg:px-16`}
    >
      <img
        src="/images/borboleta.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-8 right-12 z-0 hidden w-20 opacity-20 lg:block"
      />
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="relative z-10 order-3 mx-auto w-full max-w-md lg:order-1">
          <Photo src={about.photo_url} alt={about.photo_alt} frame={about.photo_frame} />
        </div>
        <div className="relative z-10 order-1 space-y-6" style={{ textAlign: settings.appearance.alignment.about }}>
          {about.badge && (
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-accent)]">
              {about.badge}
            </p>
          )}
          {about.title && <h2 className="font-display text-3xl leading-tight sm:text-4xl">{about.title}</h2>}
          {about.paragraph_1 && <p className="leading-relaxed opacity-80">{about.paragraph_1}</p>}
          {about.paragraph_2 && <p className="leading-relaxed opacity-80">{about.paragraph_2}</p>}
          {about.work_method && (
            <p className="border-l-4 border-[var(--site-accent)] px-5 py-3 leading-relaxed">
              {about.work_method}
            </p>
          )}
          {about.features.length > 0 && (
            <div className="space-y-3">
              {about.features_heading && <h3 className="font-semibold">{about.features_heading}</h3>}
              <ul className="space-y-2">
                {about.features.map((feature, index) => (
                  <li key={`${feature}-${index}`} className="flex gap-3">
                    <span aria-hidden="true" className="text-[var(--site-accent)]">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {about.cta_text && (
            <a className="btn-marsala" href={contacts.whatsapp_link || '/agendar'} target={contacts.whatsapp_link ? '_blank' : undefined} rel={contacts.whatsapp_link ? 'noopener noreferrer' : undefined}>
              {about.cta_text}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function AppointmentsSection({ settings }: { settings: SiteSettings }) {
  const { appointments, appearance } = settings;
  const paragraphs = [...appointments.paragraphs, ...appointments.complementary_paragraphs];
  return (
    <section
      id="atendimentos"
      className={`relative isolate overflow-hidden px-6 ${SECTION_SPACING[appearance.section_spacing]} sm:px-10 lg:px-16`}
      style={{ backgroundColor: appearance.colors.surface }}
    >
      <img
        src="/images/flor-liz.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-10 top-8 z-0 hidden w-24 opacity-15 lg:block"
      />
      <img
        src="/images/borboleta.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-8 left-12 z-0 hidden w-20 -scale-x-100 opacity-15 lg:block"
      />
      <div className="relative z-10">
        <SectionHeading
          eyebrow={appointments.badge}
          title={appointments.title}
          alignment={appearance.alignment.appointments}
        />
        <div
          className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2"
          style={{ textAlign: appearance.alignment.appointments }}
        >
          <div className="space-y-6">
            {(appointments.modality || appointments.duration) && (
              <dl className="space-y-2 text-lg">
                {appointments.modality && (
                  <div className="flex flex-wrap gap-2">
                    <dt className="font-semibold">{appointments.modality_label}</dt>
                    <dd>{appointments.modality}</dd>
                  </div>
                )}
                {appointments.duration && (
                  <div className="flex flex-wrap gap-2">
                    <dt className="font-semibold">{appointments.duration_label}</dt>
                    <dd>{appointments.duration}</dd>
                  </div>
                )}
              </dl>
            )}
            {appointments.paragraphs.map((text, index) => (
              <p key={`main-${index}`} className="leading-relaxed opacity-80">{text}</p>
            ))}
          </div>
          <div className="space-y-6">
            {appointments.complementary_paragraphs.map((text, index) => (
              <p key={`complementary-${index}`} className="leading-relaxed opacity-80">{text}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MethodSection({ settings }: { settings: SiteSettings }) {
  const { method, appearance } = settings;
  return (
    <section
      id="abordagem"
      className={`relative isolate overflow-hidden px-6 ${SECTION_SPACING[appearance.section_spacing]} sm:px-10 lg:px-16`}
    >
      <img
        src="/images/flor-liz.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-8 right-12 z-0 hidden w-24 opacity-15 lg:block"
      />
      <div className="relative z-10">
        <SectionHeading
          eyebrow={method.badge}
          title={method.title}
          description={method.subtitle}
          alignment={appearance.alignment.method}
        />
        {method.steps.length > 0 && (
          <ol className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {method.steps.map((step, index) => (
              <li
                key={`${step.number}-${index}`}
                className="rounded-3xl border border-current/10 p-6 shadow-sm"
                style={{
                  backgroundColor: appearance.colors.surface,
                  textAlign: appearance.alignment.method,
                }}
              >
                {step.number && <p className="mb-4 text-2xl font-semibold text-[var(--site-accent)]">{step.number}</p>}
                {step.title && <h3 className="mb-3 font-display text-xl">{step.title}</h3>}
                {step.description && <p className="text-sm leading-relaxed opacity-80">{step.description}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function IdentificationSection({ settings }: { settings: SiteSettings }) {
  const { identification, contacts, appearance } = settings;
  return (
    <section
      id="identificacao"
      className={`px-6 ${SECTION_SPACING[appearance.section_spacing]} sm:px-10 lg:px-16`}
      style={{ backgroundColor: appearance.colors.surface }}
    >
      <SectionHeading
        eyebrow={identification.badge}
        title={identification.title}
        description={identification.subtitle}
        alignment={appearance.alignment.identification}
      />
      {identification.items.length > 0 && (
        <ul className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2">
          {identification.items.map((item, index) => (
            <li
              key={`${item.title}-${index}`}
              className="rounded-2xl border border-current/20 p-6"
              style={{ textAlign: appearance.alignment.identification }}
            >
              {item.icon && <span className="mb-2 block text-2xl" aria-hidden="true">{item.icon}</span>}
              {item.title && <h3 className="mb-2 font-semibold">{item.title}</h3>}
              {item.description && <p className="leading-relaxed opacity-80">{item.description}</p>}
            </li>
          ))}
        </ul>
      )}
      {identification.bottom_text && (
        <p
          className="mx-auto mt-10 max-w-3xl font-display text-xl text-[var(--site-accent)]"
          style={{ textAlign: appearance.alignment.identification }}
        >
          {identification.bottom_text}
        </p>
      )}
      {identification.cta_text && (
        <div className="mt-8" style={{ textAlign: appearance.alignment.identification }}>
          <a className="btn-marsala" href={contacts.whatsapp_link || '/agendar'} target={contacts.whatsapp_link ? '_blank' : undefined} rel={contacts.whatsapp_link ? 'noopener noreferrer' : undefined}>
            {identification.cta_text}
          </a>
        </div>
      )}
    </section>
  );
}

function ClosingSection({ settings }: { settings: SiteSettings }) {
  const { closing_cta, contacts, appearance } = settings;
  return (
    <section
      id="contato"
      className={`px-6 ${SECTION_SPACING[appearance.section_spacing]} text-white sm:px-10 lg:px-16`}
      style={{
        backgroundColor: 'var(--site-accent)',
        textAlign: appearance.alignment.closing_cta,
      }}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {closing_cta.title && <h2 className="font-display text-3xl leading-tight sm:text-4xl">{closing_cta.title}</h2>}
        {closing_cta.subtitle && <p className="mx-auto max-w-3xl leading-relaxed opacity-90">{closing_cta.subtitle}</p>}
        {closing_cta.button_text && (
          <a
            className="inline-flex rounded-full bg-white px-8 py-3 font-semibold text-[var(--site-accent)]"
            href={contacts.whatsapp_link || '/agendar'}
            target={contacts.whatsapp_link ? '_blank' : undefined}
            rel={contacts.whatsapp_link ? 'noopener noreferrer' : undefined}
          >
            {closing_cta.button_text}
          </a>
        )}
      </div>
    </section>
  );
}

const SECTION_COMPONENTS: Record<SiteSectionId, (settings: SiteSettings) => ReactNode> = {
  hero: (settings) => <HeroSection settings={settings} />,
  about: (settings) => <AboutSection settings={settings} />,
  appointments: (settings) => <AppointmentsSection settings={settings} />,
  method: (settings) => <MethodSection settings={settings} />,
  identification: (settings) => <IdentificationSection settings={settings} />,
  closing_cta: (settings) => <ClosingSection settings={settings} />,
};

const MOBILE_SECTION_ILLUSTRATIONS: Partial<
  Record<SiteSectionId, { src: string; side: 'left' | 'right'; flip?: boolean }>
> = {
  hero: { src: '/images/flor-liz.png', side: 'left', flip: true },
  about: { src: '/images/borboleta.png', side: 'right' },
  appointments: { src: '/images/borboleta.png', side: 'left', flip: true },
  method: { src: '/images/flor-liz.png', side: 'right' },
};

function MobileSectionIllustration({ after }: { after: SiteSectionId }) {
  const illustration = MOBILE_SECTION_ILLUSTRATIONS[after];
  if (!illustration) return null;

  return (
    <div
      aria-hidden="true"
      className={`relative z-10 flex h-12 items-center px-8 lg:hidden ${
        illustration.side === 'left' ? 'justify-start' : 'justify-end'
      }`}
    >
      <img
        src={illustration.src}
        alt=""
        className={`w-10 opacity-25 sm:w-12 ${illustration.flip ? '-scale-x-100' : ''}`}
      />
    </div>
  );
}

const SECTION_TRANSITIONS: Partial<Record<SiteSectionId, 'wave' | 'arch' | 'reverse-wave'>> = {
  hero: 'wave',
  appointments: 'arch',
  identification: 'reverse-wave',
};

function getSectionBackground(section: SiteSectionId, settings: SiteSettings) {
  if (section === 'closing_cta') return settings.appearance.colors.accent;
  if (section === 'hero' || section === 'appointments' || section === 'identification') {
    return settings.appearance.colors.surface;
  }
  return settings.appearance.colors.background;
}

function SectionTransition({
  from,
  to,
  shape,
  illustration,
  settings,
}: {
  from: SiteSectionId;
  to: SiteSectionId;
  shape: 'wave' | 'arch' | 'reverse-wave';
  illustration?: { src: string; side: 'left' | 'right'; flip?: boolean };
  settings: SiteSettings;
}) {
  const paths = {
    wave: 'M0 34 C220 8 440 10 660 30 C900 52 1160 54 1440 22 L1440 80 L0 80 Z',
    arch: 'M0 48 C360 48 360 8 720 8 C1080 8 1080 48 1440 48 L1440 80 L0 80 Z',
    'reverse-wave': 'M0 20 C240 52 480 56 720 34 C960 12 1200 8 1440 42 L1440 80 L0 80 Z',
  } as const;

  return (
    <div
      aria-hidden="true"
      className="relative z-10 -my-px h-12 w-full sm:h-16 lg:h-20"
      style={{ backgroundColor: getSectionBackground(from, settings) }}
    >
      <svg
        className="block h-full w-full"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        focusable="false"
      >
        <path d={paths[shape]} fill={getSectionBackground(to, settings)} />
      </svg>
      {illustration && (
        <div
          className={`pointer-events-none absolute inset-y-0 flex items-center px-8 lg:hidden ${
            illustration.side === 'left' ? 'left-0 justify-start' : 'right-0 justify-end'
          }`}
        >
          <img
            src={illustration.src}
            alt=""
            className={`w-10 opacity-25 sm:w-12 ${illustration.flip ? '-scale-x-100' : ''}`}
          />
        </div>
      )}
    </div>
  );
}

export default function SitePage({ settings }: { settings: SiteSettings }) {
  const visibleSections = settings.sections.order.filter(
    (section) => settings.sections.visibility[section],
  );

  return (
    <PublicShell settings={settings}>
      {visibleSections.map((section, index) => {
        const transition = SECTION_TRANSITIONS[section];
        const nextSection = visibleSections[index + 1];

        return (
          <Fragment key={section}>
            {SECTION_COMPONENTS[section](settings)}
            {nextSection && transition ? (
              <SectionTransition
                from={section}
                to={nextSection}
                shape={transition}
                illustration={MOBILE_SECTION_ILLUSTRATIONS[section]}
                settings={settings}
              />
            ) : (
              <>
                <MobileSectionIllustration after={section} />
                {settings.appearance.decorative_dividers && nextSection && (
                  <hr className="mx-auto max-w-7xl border-current/15" aria-hidden="true" />
                )}
              </>
            )}
          </Fragment>
        );
      })}
    </PublicShell>
  );
}
