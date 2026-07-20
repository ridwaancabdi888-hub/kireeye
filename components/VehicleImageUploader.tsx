"use client";

import { ChangeEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/auth";

export function VehicleImageUploader({ vehicleId }: { vehicleId: string }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

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

  return <div className="upload-box">
    {preview ? <img src={preview} alt="Vehicle preview" className="upload-preview" /> : <div className="upload-placeholder">📷</div>}
    <label className="btn btn-secondary upload-button">
      {uploading ? "Waa la gelinayaa..." : "Dooro sawirka gaadhiga"}
      <input hidden type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={upload}/>
    </label>
    {message && <p className="form-message">{message}</p>}
  </div>;
}
