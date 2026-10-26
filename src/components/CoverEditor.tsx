import { useId, useState } from "react";
import { fileToCoverDataUrl, normalizeUrl } from "../lib/util";

interface Props {
  value: string;
  onSave: (url: string) => void;
  onCancel: () => void;
}

export function CoverEditor({ value, onSave, onCancel }: Props) {
  const [url, setUrl] = useState(value.startsWith("data:") ? "" : value);
  const [upload, setUpload] = useState<string | null>(value.startsWith("data:") ? value : null);
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That file isn’t an image.");
      return;
    }
    try {
      setUpload(await fileToCoverDataUrl(file));
      setUrl("");
      setError(null);
    } catch {
      setError("Couldn’t read that image. Try a JPEG or PNG.");
    }
  }

  return (
    <form
      className="cover-editor"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(upload ?? normalizeUrl(url));
      }}
    >
      <label className="field" htmlFor={`${id}-url`}>
        Image URL
        <input
          id={`${id}-url`}
          className="input"
          type="text"
          inputMode="url"
          placeholder="https://…/cover.jpg"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setUpload(null);
          }}
          autoFocus
        />
      </label>
      <label className="field" htmlFor={`${id}-file`}>
        or upload an image
        <input
          id={`${id}-file`}
          type="file"
          accept="image/*"
          className="small"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>
      {upload && <p className="small muted">Image ready — it’ll be stored in this browser.</p>}
      {error && (
        <p className="small" style={{ color: "var(--failed)" }} role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn--primary btn--sm" type="submit">
          Save cover
        </button>
        <button className="btn btn--ghost btn--sm" type="button" onClick={onCancel}>
          Cancel
        </button>
        {value && (
          <button className="btn btn--ghost btn--sm btn--danger" type="button" onClick={() => onSave("")}>
            Remove
          </button>
        )}
      </div>
    </form>
  );
}
