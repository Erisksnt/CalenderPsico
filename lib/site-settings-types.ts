export type PhotoFrameStyle = 'arch' | 'rounded' | 'oval' | 'bordered';

export type SiteSectionId =
  | 'hero'
  | 'about'
  | 'appointments'
  | 'method'
  | 'identification'
  | 'closing_cta';

export interface SiteSettings {
  brand: {
    name: string;
    professional_title: string;
    logo_url: string;
    footer_description: string;
    emergency_notice: string;
  };
  navigation: Array<{
    id: string;
    label: string;
    href: string;
  }>;
  contacts: {
    whatsapp_number: string;
    whatsapp_message: string;
    whatsapp_link: string;
    instagram_url: string;
    tiktok_url: string;
    email: string;
    phone: string;
    crp: string;
    address: string;
  };
  hero: {
    badge: string;
    title: string;
    title_highlight: string;
    subtitle: string;
    cta_text: string;
    secondary_cta_text: string;
    photo_url: string;
    photo_alt: string;
    photo_frame: PhotoFrameStyle;
    specialties: string[];
    highlights: string[];
  };
  about: {
    badge: string;
    title: string;
    paragraph_1: string;
    paragraph_2: string;
    work_method: string;
    photo_url: string;
    photo_alt: string;
    photo_frame: PhotoFrameStyle;
    features_heading: string;
    features: string[];
    cta_text: string;
  };
  appointments: {
    badge: string;
    title: string;
    modality_label: string;
    modality: string;
    duration_label: string;
    duration: string;
    paragraphs: string[];
    complementary_paragraphs: string[];
  };
  method: {
    badge: string;
    title: string;
    subtitle: string;
    steps: Array<{
      number: string;
      title: string;
      description: string;
    }>;
  };
  identification: {
    badge: string;
    title: string;
    subtitle: string;
    items: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
    bottom_text: string;
    cta_text: string;
  };
  closing_cta: {
    title: string;
    subtitle: string;
    button_text: string;
  };
  footer: {
    navigation_heading: string;
    contact_heading: string;
    registration_label: string;
    privacy_label: string;
    copyright_text: string;
  };
  appearance: {
    colors: {
      background: string;
      surface: string;
      accent: string;
      accent_dark: string;
      text: string;
      text_muted: string;
    };
    alignment: Record<SiteSectionId, 'left' | 'center'>;
    section_spacing: 'compact' | 'comfortable' | 'spacious';
    decorative_dividers: boolean;
    heading_font: 'The Seasons' | 'Cormorant Garamond' | 'Playfair Display' | 'Georgia';
    body_font: 'Garet' | 'Inter' | 'Montserrat' | 'Open Sans' | 'Arial';
    heading_font_size: number;
    body_font_size: number;
  };
  sections: {
    order: SiteSectionId[];
    visibility: Record<SiteSectionId, boolean>;
  };
}

export const SITE_SECTION_IDS: SiteSectionId[] = [
  'hero',
  'about',
  'appointments',
  'method',
  'identification',
  'closing_cta',
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brand: {
    name: '',
    professional_title: '',
    logo_url: '/images/logo-psicologa.jpg',
    footer_description: '',
    emergency_notice: '',
  },
  navigation: [
    { id: 'about', label: 'Sobre Mim', href: '#sobre' },
    { id: 'method', label: 'Método', href: '#abordagem' },
    { id: 'appointments', label: 'Atendimentos', href: '#atendimentos' },
  ],
  contacts: {
    whatsapp_number: '',
    whatsapp_message: '',
    whatsapp_link: '',
    instagram_url: '',
    tiktok_url: '',
    email: '',
    phone: '',
    crp: '',
    address: '',
  },
  hero: {
    badge: '',
    title: '',
    title_highlight: '',
    subtitle: '',
    cta_text: '',
    secondary_cta_text: '',
    photo_url: '',
    photo_alt: '',
    photo_frame: 'arch',
    specialties: [],
    highlights: [],
  },
  about: {
    badge: '',
    title: '',
    paragraph_1: '',
    paragraph_2: '',
    work_method: '',
    photo_url: '',
    photo_alt: '',
    photo_frame: 'arch',
    features_heading: '',
    features: [],
    cta_text: '',
  },
  appointments: {
    badge: '',
    title: '',
    modality_label: '',
    modality: '',
    duration_label: '',
    duration: '',
    paragraphs: [],
    complementary_paragraphs: [],
  },
  method: {
    badge: '',
    title: '',
    subtitle: '',
    steps: [],
  },
  identification: {
    badge: '',
    title: '',
    subtitle: '',
    items: [],
    bottom_text: '',
    cta_text: '',
  },
  closing_cta: {
    title: '',
    subtitle: '',
    button_text: '',
  },
  footer: {
    navigation_heading: '',
    contact_heading: '',
    registration_label: '',
    privacy_label: '',
    copyright_text: '',
  },
  appearance: {
    colors: {
      background: '#FDFCF9',
      surface: '#FAF7F2',
      accent: '#7C1D30',
      accent_dark: '#5C1020',
      text: '#25181B',
      text_muted: '#604C51',
    },
    alignment: {
      hero: 'left',
      about: 'left',
      appointments: 'left',
      method: 'left',
      identification: 'center',
      closing_cta: 'center',
    },
    section_spacing: 'comfortable',
    decorative_dividers: false,
    heading_font: 'Playfair Display',
    body_font: 'Inter',
    heading_font_size: 48,
    body_font_size: 16,
  },
  sections: {
    order: SITE_SECTION_IDS,
    visibility: {
      hero: true,
      about: true,
      appointments: true,
      method: true,
      identification: true,
      closing_cta: true,
    },
  },
};
