import { useState } from "react";

function hueFor(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
  return h;
}

interface Props {
  src: string;
  title: string;
  author?: string;
  className?: string;
}

/** Book cover with a typographic fallback when there's no image or it fails to load. */
export function Cover({ src, title, author, className = "" }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;

  if (!src || failed) {
    return (
      <div
        className={`cover cover--fallback ${className}`}
        style={{ "--hue": hueFor(title) } as React.CSSProperties}
        role="img"
        aria-label={`${title} (no cover image)`}
      >
        <strong>{title}</strong>
        {author && <span>{author}</span>}
      </div>
    );
  }

  return (
    <div className={`cover ${className}`}>
      <img src={src} alt={`Cover of ${title}`} loading="lazy" onError={() => setFailedSrc(src)} />
    </div>
  );
}
