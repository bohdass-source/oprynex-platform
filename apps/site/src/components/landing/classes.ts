// Shared class strings for the landing page. Kept apart from the components so fast refresh keeps working.
export const linkFocus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-fg";

const button = `inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-semibold transition-[transform,opacity,background-color] duration-300 ease-lp active:scale-[0.98] ${linkFocus}`;
const variants = {
  primary: "bg-lp-fg text-lp-bg hover:opacity-85",
  secondary: "border border-lp-line bg-transparent text-lp-fg hover:bg-lp-raised",
};
const sizes = { md: "text-base", sm: "text-sm" };

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return `${button} ${variants[variant]} ${sizes[size]}`;
}

export const textLink = `inline-flex items-center gap-2 rounded-lg py-1 text-sm font-semibold text-lp-fg underline-offset-4 transition-opacity duration-300 ease-lp hover:underline ${linkFocus}`;
