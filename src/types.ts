export type Locale = "en" | "zh-CN";
export type ViewportId = "wide" | "desktop" | "tablet" | "mobile";
export type HeaderPhase = "entered" | "hidden" | "scrolled" | "menu-open";
export type HeroTaskPhase = "hidden" | "entering" | "visible" | "leaving";

export interface ViewportSpec {
  id: ViewportId;
  width: number;
  height: number;
}

export interface VisualStateFixture {
  enabled: boolean;
  locale?: Locale;
  verbIndex?: number;
  taskIndex?: number;
  unifiesProgress?: number;
  workflowStep?: 0 | 1 | 2;
  mediaTime?: number;
}

export interface ReferenceSnapshot {
  id: string;
  sourceUrl: string;
  capturedAt: string;
  status: "complete" | "partial";
  locales: Locale[];
  viewports: ViewportSpec[];
}

export interface ProductVideoState {
  status: "idle" | "ready" | "playing" | "paused" | "failed";
  currentTime: number;
  duration: number;
  lightboxOpen: boolean;
}

export interface LinkItem {
  id: string;
  label: string;
  href: string;
}

export interface QueryCard {
  id: string;
  text: string;
}

export interface WorkflowStep {
  id: string;
  number: string;
  title: string;
  description: string;
  alt: string;
  background: string;
  poster: string;
  video: string;
}

export interface Capability {
  id: string;
  number: string;
  title: string;
  description: string[];
  cta: string;
  href: string;
  alt: string;
  image: string;
}

export interface FooterGroup {
  id: string;
  heading: string;
  subheading?: string;
  links: LinkItem[];
  sections?: Array<{
    heading: string;
    links: LinkItem[];
  }>;
}

export interface SiteContent {
  locale: Locale;
  meta: { title: string; description: string };
  accessibility: {
    home: string;
    openMenu: string;
    closeMenu: string;
    soundOn: string;
    soundOff: string;
  };
  header: {
    products: string;
    enterprise: string;
    pricing: string;
    resources: string;
    cta: string;
    productLinks: LinkItem[];
    resourceLinks: LinkItem[];
  };
  hero: {
    product: string;
    verbs: string[];
    cta: string;
    queries: QueryCard[];
    building: string;
    soundOn: string;
    soundOff: string;
  };
  intro: {
    lead: string;
    detail: string;
    contrastLead: string;
    contrastMiddle: string;
    contrastEnd: string;
    running: string;
  };
  unifies: { title: string };
  workflow: {
    eyebrow: string;
    title: string;
    steps: WorkflowStep[];
  };
  capabilities: {
    eyebrow: string;
    title: string;
    items: Capability[];
  };
  finalCta: { title: string; description: string; cta: string };
  footer: {
    groups: FooterGroup[];
    copyright: string;
    tagline: string;
  };
  cookie: {
    title: string;
    body: string;
    reject: string;
    accept: string;
  };
}

export interface MediaAsset {
  sourceUrl: string;
  localPath: string;
  kind: "font" | "image" | "video" | "audio" | "icon" | "badge";
  mimeType: string;
  bytes: number;
  sha256: string;
  snapshotId?: string;
  sourceBundle?: string;
  durationSeconds?: number;
  dimensions?: {
    width: number;
    height: number;
  };
}
