type VehicleCardProps = { name:string; category:string; price:number; icon:string; location:string; rating:string };
export function VehicleCard({ name, category, price, icon, location, rating }: VehicleCardProps) {
  return <article className="card"><div className="car-cover">{icon}</div><div style={{marginTop:16}} className="row"><span className="badge">{category}</span><span>★ {rating}</span></div><h3 style={{fontSize:22,marginBottom:4}}>{name}</h3><p className="muted">📍 {location} · Automatic · AC</p><div className="row"><div><span className="price">${price}</span><span className="muted"> / maalintii</span></div><button className="btn btn-primary">Kirayso</button></div></article>
}
