import { useLanguage } from "@/components/language-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRODUCT_IDS, productLabel, productPlaceholder, type ProductId } from "@/lib/product-choices";

/** The dropdown of everything Oprynex offers, shared by the contact form and the chat. */
export function ProductSelect({ id, value, onChange }: { id: string; value: ProductId | ""; onChange: (value: ProductId) => void }) {
  const { language } = useLanguage();
  return (
    <Select value={value} onValueChange={(next) => onChange(next as ProductId)}>
      <SelectTrigger id={id} className="min-h-10 h-auto text-left"><SelectValue placeholder={productPlaceholder[language]} /></SelectTrigger>
      <SelectContent className="z-[60]">
        {PRODUCT_IDS.map((product) => <SelectItem key={product} value={product} className="min-h-10">{productLabel(product)[language]}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
