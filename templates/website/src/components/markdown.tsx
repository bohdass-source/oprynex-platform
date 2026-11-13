import { Fragment, type ReactNode } from "react";

/** Renders the small Markdown subset of the legal texts: # and ## headings, "- " lists, paragraphs with line breaks. */
export function Markdown({ source }: { source: string }) {
  const blocks = source.split(/\n{2,}/);
  return (
    <div className="space-y-4 text-base text-muted">
      {blocks.map((block, i) => {
        if (block.startsWith("# ")) return <h1 key={i} className="text-4xl font-bold text-text">{block.slice(2)}</h1>;
        if (block.startsWith("## ")) return <h2 key={i} className="pt-6 text-xl font-semibold text-text">{block.slice(3)}</h2>;
        const lines = block.split("\n");
        const list = lines.filter((line) => line.startsWith("- "));
        const intro = lines.filter((line) => !line.startsWith("- "));
        return (
          <Fragment key={i}>
            {intro.length > 0 && <p>{withBreaks(intro)}</p>}
            {list.length > 0 && <ul className="list-disc space-y-1 pl-6">{list.map((line) => <li key={line}>{line.slice(2)}</li>)}</ul>}
          </Fragment>
        );
      })}
    </div>
  );
}

export function withBreaks(lines: string[]): ReactNode[] {
  return lines.flatMap((line, i) => (i === 0 ? [line] : [<br key={i} />, line]));
}
