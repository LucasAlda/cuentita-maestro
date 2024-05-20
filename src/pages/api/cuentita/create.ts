import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

const newCuentitaSchema = z.object({
  name: z
    .string({
      required_error: "El nombre es obligatorio",
      invalid_type_error: "El nombre debe ser un texto",
    })
    .min(3, "El nombre debe tener mínimo 3 caracteres")
    .max(64, "El nombre debe tener máximo 64 caracteres")
    .regex(
      /^[a-zA-Z0-9\-_.!()?@:/]+$/,
      "el nombre debe ser letras, números o símbolos -_.!()?@:/",
    ),
  category: z
    .string({
      required_error: "La categoría es obligatoria",
      invalid_type_error: "La categoría debe ser un texto",
    })
    .min(1, "La categoría es obligatoria"),
  inflation: z.boolean(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const newCuentita = newCuentitaSchema.safeParse(req.body);
  if (!newCuentita.success) {
    res
      .status(400)
      .json({
        success: false,
        errors: newCuentita.error.errors.map((e) => e.message),
      });
  }

  console.log(`Creada:`, req.body);
  res.json({
    success: true,
    invitationLink: "https://cuentita.vercel.app/invite/123",
  });
}
