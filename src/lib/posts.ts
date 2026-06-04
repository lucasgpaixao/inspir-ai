export type DeliveryFormat = 'feed' | 'story';
export type BackgroundSource = 'ai' | 'custom';

export interface Post {
  id: string;
  post_date: string;
  quote: string;
  caption: string;
  image_url: string;
  image_path?: string | null;
  custom_image_url?: string | null;
  custom_image_path?: string | null;
  delivery_format: DeliveryFormat;
  active_background_source: BackgroundSource;
  status: 'draft' | 'ready' | 'published';
}

export const ACCEPTED_CUSTOM_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export function normalizePost(raw: Record<string, unknown>): Post {
  const deliveryFormat =
    raw.delivery_format === 'story' ? 'story' : 'feed';
  const activeSource =
    raw.active_background_source === 'custom' ? 'custom' : 'ai';

  return {
    id: String(raw.id ?? `post-${raw.post_date}`),
    post_date: String(raw.post_date),
    quote: String(raw.quote ?? ''),
    caption: String(raw.caption ?? ''),
    image_url: String(
      raw.image_url ??
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600&auto=format&fit=crop'
    ),
    image_path: (raw.image_path as string | null) ?? null,
    custom_image_url: (raw.custom_image_url as string | null) ?? null,
    custom_image_path: (raw.custom_image_path as string | null) ?? null,
    delivery_format: deliveryFormat,
    active_background_source: activeSource,
    status:
      raw.status === 'draft' || raw.status === 'published'
        ? raw.status
        : 'ready',
  };
}

export function getActiveBackgroundUrl(post: Post): string {
  if (
    post.active_background_source === 'custom' &&
    post.custom_image_url
  ) {
    return post.custom_image_url;
  }
  return post.image_url;
}

export function hasCustomBackground(post: Post): boolean {
  return !!(post.custom_image_url || post.custom_image_path);
}

export function customImageExtension(mimeType: string): string {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/webp') return 'webp';
  return 'png';
}
