import { Check } from "@phosphor-icons/react";
import { ContactForm } from "@/components/contact-form";
import { useLanguage } from "@/components/language-provider";
import { Reveal } from "@/components/landing/primitives";
import { landing } from "@/lib/landing-copy";

/** The closing block of every page: a short promise on the left and the contact form on the right. */
export function ContactSection() {
  const { language: l } = useLanguage();
  const f = landing.final;
  return (
    <section id="kontakt" className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-24">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        <Reveal>
          <h2 className="max-w-[680px] text-3xl font-semibold md:text-4xl">{f.title[l]}</h2>
          <p className="mt-4 max-w-[680px] text-lg text-lp-muted">{f.text[l]}</p>
          <ul className="mt-8 flex flex-col gap-3">
            {f.points.map((point) => (
              <li key={point.de} className="flex items-center gap-2 text-base"><Check size={20} weight="bold" aria-hidden="true" />{point[l]}</li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={100}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
