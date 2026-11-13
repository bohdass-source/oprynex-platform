import { Browser, ChatsCircle, Compass, TreeStructure } from "@phosphor-icons/react";
import type { ComponentType } from "react";

type Icon = ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean | "true" }>;

/** One icon per offer id, shared by the offer cards and the case cards in the hero. */
export const offerIcons: Record<string, Icon> = { chatbot: ChatsCircle, website: Browser, crm: TreeStructure, consulting: Compass };
