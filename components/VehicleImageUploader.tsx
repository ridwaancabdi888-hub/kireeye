"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/auth";

export function VehicleImageUploader({ vehicleId }: { vehicleId: string }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setMessage("Fadlan sawir sax ah dooro.");
    if (file.size > 10 * 1024 * 1024) return setMessage("Sawirku waa inuu ka yaraadaa 10MB.");

    setUploading(true);
    setMessage("");
    setPreview(URL.createObjectURL(file));

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Fadlan soo gal.");

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${vehicleId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("vehicle-images").upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("vehicle-images").getPublicUrl(path);
      const { error: insertError } = await supabase.from("vehicle_images").insert({
        vehicle_id: vehicleId,
        storage_path: path,
        public_url: publicData.publicUrl,
      });
      if (insertError) throw insertError;

      setMessage("Sawirka waa la geliyey.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sawirka lama gelin.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function addImageUrl(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploading(true);
    setMessage("");

    try {
      const parsed = new URL(imageUrl.trim());
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error("URL-ku waa inuu ku bilaabmaa http ama https.");
      }

      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Fadlan soo gal.");

      const { error } = await supabase.from("vehicle_images").insert({
        vehicle_id: vehicleId,
        storage_path: `external/${crypto.randomUUID()}`,
        public_url: parsed.toString(),
      });
      if (error) throw error;

      setPreview(parsed.toString());
      setImageUrl("");
      setMessage("URL-ka sawirka waa la kaydiyey.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "URL-ka sawirka lama kaydin.");
    } finally {
      setUploading(false);
    }
  }

  return <div className="upload-box">
    {preview ? <img src={preview} alt="Vehicle preview" className="upload-preview" /> : <div className="upload-placeholder">📷</div>}
    <label className="btn btn-secondary upload-button">
      {uploading ? "Waa la gelinayaa..." : "Dooro sawirka gaadhiga"}
      <input hidden type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={upload}/>
    </label>
    <div className="upload-divider"><span>ama</span></div>
    <form className="image-url-form" onSubmit={addImageUrl}>
      <div className="field">
        <label>URL-ka sawirka</label>
        <input
          type="url"
          inputMode="url"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="https://example.com/toyota-prado.jpg"
          required
        />
      </div>
      <button className="btn btn-primary" disabled={uploading || !imageUrl.trim()}>
        Ku dar URL-ka
      </button>
    </form>
    <p className="muted">Isticmaal direct image URL deggan. Google Images preview links mararka qaar way dhacaan; Wikimedia Commons ama website-ka sawirka asalka ahi wuu ka fiican yahay.</p>
    {message && <p className="form-message">{message}</p>}
  </div>;
}
