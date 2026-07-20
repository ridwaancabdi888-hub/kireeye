"use client";

import { FormEvent, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { VehicleImageUploader } from "@/components/VehicleImageUploader";

export default function AddVehiclePage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [vehicleId, setVehicleId] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/company/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          make: form.get("make"),
          model: form.get("model"),
          year: Number(form.get("year")),
          category: form.get("category"),
          transmission: form.get("transmission"),
          seats: Number(form.get("seats")),
          driverAvailable: form.get("driver") !== null,
          selfDriveAllowed: form.get("selfDrive") !== null,
          intercityAllowed: form.get("intercity") !== null,
          priceHour: Number(form.get("priceHour")),
          priceDay: Number(form.get("priceDay")),
          priceWeek: Number(form.get("priceWeek")),
          priceMonth: Number(form.get("priceMonth")),
          description: form.get("description"),
          depositAmount: Number(form.get("deposit") || 0),
          fuelType: form.get("fuelType"),
          plateNumber: form.get("plateNumber"),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gaadhiga lama kaydin.");

      setVehicleId(result.vehicleId);
      setMessage("Gaadhiga waa la kaydiyey. Hadda geli sawirrada, kadib Admin ayaa ansixinaya.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gaadhiga lama kaydin.");
    } finally {
      setLoading(false);
    }
  }

  return <DashboardShell title="Ku dar gaadhi">
    {!vehicleId ? <form className="card form-grid" onSubmit={submit}>
      {[
        ["name","Magaca listing-ka","Toyota Land Cruiser One Ten"],
        ["make","Shirkadda","Toyota"],
        ["model","Model","Land Cruiser"],
        ["year","Sanadka","2020"],
        ["seats","Kuraasta","7"],
        ["plateNumber","Number plate","HGA 1234"],
        ["deposit","Deposit","200"],
        ["priceHour","Qiimaha saacaddii","15"],
        ["priceDay","Qiimaha maalintii","95"],
        ["priceWeek","Qiimaha toddobaadkii","600"],
        ["priceMonth","Qiimaha bishii","2200"],
      ].map(([name,label,placeholder]) => <div className="field" key={name}><label>{label}</label><input name={name} placeholder={placeholder} required={!['deposit','plateNumber'].includes(name)}/></div>)}
      <div className="field"><label>Category</label><select name="category"><option>4x4</option><option>SUV</option><option>Sedan</option><option>Hatchback</option><option>Minivan</option><option>Minibus</option><option>Bus</option><option>Pickup</option><option>Luxury</option><option>Cargo</option><option>Construction</option></select></div>
      <div className="field"><label>Transmission</label><select name="transmission"><option>Automatic</option><option>Manual</option></select></div>
      <div className="field"><label>Fuel</label><select name="fuelType"><option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>Electric</option></select></div>
      <div className="field form-span"><label>Sharaxaad</label><textarea name="description" rows={5} placeholder="Xaaladda gaadhiga, adeegyada, iyo shuruudaha kirada"/></div>
      <label className="checkbox"><input name="driver" type="checkbox" defaultChecked/> Darawal waa la heli karaa</label>
      <label className="checkbox"><input name="selfDrive" type="checkbox"/> Self-drive waa la oggol yahay</label>
      <label className="checkbox"><input name="intercity" type="checkbox"/> Safar magaalo kale waa la oggol yahay</label>
      <button className="btn btn-primary form-span" disabled={loading}>{loading ? "Waa la kaydinayaa..." : "Kaydi oo geli sawirrada"}</button>
      {message && <p className="form-message form-span">{message}</p>}
    </form> : <section className="card upload-stage">
      <span className="badge">Vehicle created</span>
      <h2>Geli sawirrada gaadhiga</h2>
      <p className="muted">Waxaad geli kartaa sawirro badan. Sawirrada JPEG, PNG ama WebP ha noqdaan.</p>
      <VehicleImageUploader vehicleId={vehicleId}/>
      {message && <p className="form-message">{message}</p>}
      <button className="btn btn-primary" onClick={() => { setVehicleId(null); setMessage(""); }}>Ku dar gaadhi kale</button>
    </section>}
  </DashboardShell>;
}
