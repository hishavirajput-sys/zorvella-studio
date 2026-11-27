import type { ReactEventHandler } from "react";

import {
  buildMediaSrcSet,
  getMediaFallbackSrc,
  resolveResponsiveMedia,
} from "@/lib/responsive-images";

export function ResponsiveStoreImage({
  src,
  alt,
  sizes,
  className,
  loading = "lazy",
  decoding = "async",
  fetchPriority,
  onError,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
  fetchPriority?: "high" | "low" | "auto";
  onError?: ReactEventHandler<HTMLImageElement>;
}) {
  const media = resolveResponsiveMedia(src);

  if (!media) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        referrerPolicy="no-referrer"
        onError={onError}
      />
    );
  }

  const avifSrcSet = buildMediaSrcSet(media, "avif");
  const webpSrcSet = buildMediaSrcSet(media, "webp");
  const fallbackSrc = getMediaFallbackSrc(media);

  return (
    <picture className="responsive-picture">
      <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
      <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
      <img
        src={fallbackSrc}
        srcSet={media.fallbackExt === "webp" ? webpSrcSet : undefined}
        sizes={media.fallbackExt === "webp" ? sizes : undefined}
        width={media.width}
        height={media.height}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        referrerPolicy="no-referrer"
        onError={onError}
      />
    </picture>
  );
}
