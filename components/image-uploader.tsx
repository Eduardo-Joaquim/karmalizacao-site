"use client";

import { useState } from "react";
import { ImageIcon, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MAX_EMBEDDED_IMAGE_LENGTH } from "@/lib/character-data";

const MAX_SOURCE_BYTES = 8 * 1024 * 1024;

function loadImage(file: File): Promise<{ image: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, url });
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Não foi possível abrir esta imagem.")); };
    image.src = url;
  });
}

async function prepareImage(file: File): Promise<string> {
  if (!/^image\/(?:png|jpeg|webp)$/.test(file.type)) throw new Error("Use uma imagem PNG, JPG ou WebP.");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("A imagem original deve ter no máximo 8 MB.");

  const { image, url } = await loadImage(file);
  try {
    let longestSide = 512;
    let quality = 0.86;
    for (let attempt = 0; attempt < 14; attempt += 1) {
      const scale = Math.min(1, longestSide / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Seu navegador não conseguiu preparar a imagem.");
      context.drawImage(image, 0, 0, width, height);
      const encoded = canvas.toDataURL("image/webp", quality);
      if (encoded.length <= Math.min(64_000, MAX_EMBEDDED_IMAGE_LENGTH)) return encoded;
      quality -= 0.09;
      if (quality < 0.42) { longestSide = Math.max(192, Math.round(longestSide * 0.8)); quality = 0.78; }
    }
    throw new Error("A imagem continua grande demais. Escolha um arquivo com menos detalhes.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ImageUploader({
  id,
  label,
  value,
  alt,
  help,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  alt: string;
  help?: string;
  onChange: (value: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="image-uploader" data-has-image={Boolean(value)}>
      <div className="image-uploader-preview">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={alt} />
        ) : <><ImageIcon aria-hidden="true" /><span>Sem imagem</span></>}
      </div>
      <div className="image-uploader-copy">
        <strong>{label}</strong>
        <p>{help ?? "PNG, JPG ou WebP. O arquivo será reduzido a uma miniatura de até 512 px e cerca de 48 KB antes de ser salvo na ficha."}</p>
        <div>
          <label htmlFor={id} className="image-upload-button" aria-disabled={busy}>
            <Upload aria-hidden="true" /> {busy ? "Preparando…" : value ? "Trocar imagem" : "Escolher imagem"}
          </label>
          <input
            id={id}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={busy}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setBusy(true);
              setError("");
              try { onChange(await prepareImage(file)); }
              catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível preparar a imagem."); }
              finally { setBusy(false); }
            }}
          />
          {value ? <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")}><Trash2 aria-hidden="true" /> Remover</Button> : null}
        </div>
        {error ? <p className="image-uploader-error" role="alert">{error}</p> : null}
      </div>
    </div>
  );
}
