import { Navbar } from "@/components/Navbar";
import { VehicleCard } from "@/components/VehicleCard";
const cars=["Toyota One Ten","Toyota Noah","Toyota Surf 2TR","Toyota Prado","Toyota Hilux","Toyota Vitz"];
export default function Vehicles(){return <><Navbar/><main className="section"><div className="container"><span className="eyebrow">Search results</span><h1 style={{fontSize:48}}>Gaadiid diyaar ah</h1><div className="grid-3">{cars.map((name,i)=><VehicleCard key={name} name={name} category={i%2?"SUV":"4x4"} price={45+i*10} icon={i===1?"🚐":"🚙"} location={i%2?"Muqdisho":"Hargeysa"} rating={(4.5+i*.08).toFixed(1)}/>)}</div></div></main></>}
