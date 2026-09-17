/**
 * Helper utility for parsing and embedding YouTube links
 */

/**
 * Extracts the 11-character YouTube video ID from various link formats:
 * - https://www.youtube.com/watch?v=xxxx
 * - https://youtu.be/xxxx
 * - https://www.youtube.com/embed/xxxx
 * - https://www.youtube.com/shorts/xxxx
 * - https://www.youtube.com/live/xxxx
 * - raw 11-char ID
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // If already exactly an 11-char alphanumeric ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);

    // Query parameter `v`
    const vParam = urlObj.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
      return vParam;
    }

    // Short domain youtu.be/xxxx
    if (urlObj.hostname.includes('youtu.be')) {
      const pathId = urlObj.pathname.replace(/^\/+/, '').split('/')[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(pathId)) {
        return pathId;
      }
    }

    // Path routes: /embed/xxxx, /shorts/xxxx, /live/xxxx, /v/xxxx
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const triggerIdx = pathParts.findIndex((p) =>
      ['embed', 'shorts', 'v', 'live'].includes(p.toLowerCase())
    );
    if (triggerIdx !== -1 && pathParts[triggerIdx + 1]) {
      const candidate = pathParts[triggerIdx + 1];
      if (/^[a-zA-Z0-9_-]{11}$/.test(candidate)) {
        return candidate;
      }
    }
  } catch {
    // If URL parsing fails, attempt regex fallback
  }

  // Regex fallback matching standard patterns
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i
  );

  return match ? match[1] : null;
}

/**
 * Generates the YouTube thumbnail URL
 */
export function getYouTubeThumbnail(videoId: string, quality: 'hq' | 'mq' | 'maxres' = 'hq'): string {
  if (!videoId) return '';
  if (quality === 'maxres') {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  if (quality === 'mq') {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Generates an embedded YouTube iframe URL
 */
export function getYouTubeEmbedUrl(videoId: string, autoplay = false): string {
  if (!videoId) return '';
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1`;
}
