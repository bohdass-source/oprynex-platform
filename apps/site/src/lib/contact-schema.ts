import { z } from "zod";
import { PRODUCT_IDS } from "@/lib/product-choices";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Укажите имя и фамилию").max(100),
  email: z.string().trim().email("Проверьте email").max(255),
  company: z.string().trim().max(150).optional(),
  product: z.enum(PRODUCT_IDS).optional(),
  message: z.string().trim().min(10, "Опишите задачу чуть подробнее").max(2000),
  consent: z.literal(true, { error: "Подтвердите согласие на обработку данных" }),
});