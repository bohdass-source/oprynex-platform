import { ArrowCounterClockwise, Check, Cloud, Info } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { buttonClass } from "@/components/landing/classes";
import { offerIcons } from "@/components/landing/offer-icons";
import { useLanguage } from "@/components/language-provider";
import { solutionCopy } from "@/lib/landing-copy";
import { categoryLabel, trackConversion, type Offer } from "@/lib/offers";

const ui = {
  more: { ru: "Цены и условия", de: "Preise & Leistungen", en: "Prices & details" },
  back: { ru: "Назад", de: "Zurück", en: "Back" },
  included: { ru: "Что входит?", de: "Was ist enthalten?", en: "What's included?" },
  fit: { ru: "Подходит, если", de: "Passt, wenn", en: "A fit when" },
  price: { ru: "Стоимость", de: "Preis", en: "Price" },
};


/**
 * Card of one offer. Front: category (software, AI, custom development, consulting), what it is, what it costs and
 * a "prices & details" button. The button turns the card over to show what is included and the price again.
 */
export function OfferCard({ offer }: { offer: Offer }) {
  const { language: l } = useLanguage();
  const [flipped, setFlipped] = useState(false);
  const copy = solutionCopy(offer);
  const Icon = offerIcons[offer.id] ?? Cloud;
  const face = "lp-card flex flex-col rounded-2xl bg-lp-surface p-6 transition-[background-color] duration-500 ease-lp";
  return (
    <div className="lp-glow h-full w-full">
      <div className="lp-flip h-full w-full" data-flipped={flipped}>
        <div className="lp-flip-inner">
          <article className={`lp-flip-face ${face}`} aria-hidden={flipped} inert={flipped}>
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-lp-line bg-lp-raised"><Icon size={24} aria-hidden="true" /></span>
              <p className="rounded-full border border-lp-line px-3 py-1 text-sm font-medium text-lp-muted">{categoryLabel[offer.category][l]}</p>
            </div>
            <h3 className="mt-6 text-xl font-semibold">{copy.label[l]}</h3>
            <p className="mt-2 text-base font-medium">{copy.outcome[l]}</p>
            <p className="mt-2 text-sm text-lp-muted">{offer.short[l]}</p>
            <p className="mt-4 rounded-lg bg-lp-raised px-3 py-2 text-sm text-lp-muted"><span className="font-semibold text-lp-fg">{ui.fit[l]}:</span> {copy.fit[l]}</p>
            <p className="mt-auto pt-6 text-xl font-semibold">{offer.price[l]}</p>
            <div className="mt-4 flex justify-center">
              <button type="button" onClick={() => setFlipped(true)} className={buttonClass("secondary", "sm")}><Info size={16} aria-hidden="true" />{ui.more[l]}</button>
            </div>
          </article>

          <article className={`lp-flip-face lp-flip-back ${face}`} aria-hidden={!flipped} inert={!flipped}>
            <p className="text-sm font-medium text-lp-muted">{copy.label[l]}</p>
            <h3 className="mt-1 text-xl font-semibold">{ui.included[l]}</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {offer.included.map((item) => (
                <li key={item.de} className="flex items-start gap-2 text-sm"><Check size={16} weight="bold" className="mt-0.5 shrink-0" aria-hidden="true" />{item[l]}</li>
              ))}
            </ul>
            <p className="mt-auto pt-6 text-sm font-medium text-lp-muted">{ui.price[l]}</p>
            <p className="text-xl font-semibold">{offer.price[l]}</p>
            {offer.priceNote && <p className="mt-1 text-sm text-lp-muted">{offer.priceNote[l]}</p>}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={() => setFlipped(false)} className={buttonClass("secondary", "sm")}><ArrowCounterClockwise size={16} aria-hidden="true" />{ui.back[l]}</button>
              <Link to={offer.path} onClick={() => trackConversion(offer.id, "card_back_page")} className={buttonClass("primary", "sm")}>{offer.cta[l]}</Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

export function OfferGrid({ offers }: { offers: Offer[] }) {
  return <div className="grid gap-6 md:grid-cols-2">{offers.map((o) => <OfferCard key={o.id} offer={o} />)}</div>;
}
