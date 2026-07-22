import { Navbar } from "@/components/Navbar";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata({
  title: "Cancellation and Refund Policy",
  description: "Akhri template-ka cancellation iyo refund policy ee Kireeye; provider rules iyo legal review ayaa wali loo baahan yahay.",
  path: "/cancellation",
});

export default function CancellationPage(){return <><Navbar/><main className="section"><article className="container legal-content"><span className="eyebrow">Cancellation & Refund Policy</span><h1 className="details-title">Booking cancellation iyo refund</h1><p className="muted">Template policy—Admin-ka ayaa settings-ka iyo provider rules-ka waafajin kara; legal review ayaa loo baahan yahay ka hor launch.</p><h2>Free cancellation</h2><p>Listing-ka calaamadsan free cancellation waxaa lacag la’aan lagu cancel-gareyn karaa waqtiga lagu muujiyey gaadhiga, tusaale 24 saac ka hor pickup-ka.</p><h2>Late cancellation</h2><p>Cancellation-ka dhow pickup-ka waxaa laga jari karaa service fee, maalinta koowaad ama percentage provider-ku dejiyey.</p><h2>Provider cancellation</h2><p>Haddii company ama owner-ku cancel-gareeyo isagoo aan replacement la mid ah bixin, customer-ku wuxuu heli karaa full refund lacagta Kireeye xaqiijiyey.</p><h2>No-show</h2><p>Customer-ka aan iman pickup-ka, aan soo bandhigin documents-ka required ama aan bixin deposit-ka waxaa laga yaabaa inuusan helin refund buuxa.</p><h2>Refund processing</h2><p>Manual mobile-money payments waxaa Admin-ku dib u xaqiijinayaa. Refund-ku wuxuu ku noqdaa habka la heli karo, waxaana system-ka lagu kaydiyaa reference iyo status.</p><h2>Disputes</h2><p>Customer ama provider wuxuu samayn karaa support ticket. Kireeye wuxuu eegi karaa booking history, messages, payment proof, documents iyo audit logs.</p></article></main></>}
