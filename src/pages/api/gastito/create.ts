import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { type NextApiRequest, type NextApiResponse } from "next";
import { z } from "zod";

const newGastitoSchema = z.object({
  name: z
    .string({
      required_error: "El nombre es obligatorio",
      invalid_type_error: "El nombre debe ser un texto",
    })
    .min(3, "El nombre debe tener mínimo 3 caracteres")
    .max(64, "El nombre debe tener máximo 64 caracteres")
    .regex(
      /^[a-zA-ZÀ-ÖØ-öø-ÿ0-9\-_.!()?@:/ ]+$/,
      "El nombre debe ser letras, números o símbolos -_.!()?@:/",
    ),
  amount: z
    .number({
      required_error: "El monto es obligatorio",
      invalid_type_error: "El monto debe ser un número",
    })
    .positive("El monto debe ser positivo"),
  category: z
    .string({
      required_error: "La categoría es obligatoria",
      invalid_type_error: "La categoría debe ser un texto",
    })
    .min(1, "La categoría es obligatoria"),
  repetition: z.enum(["unico", "semanal", "mensual", "trimestral", "anual"]),
  cuentitaId: z.string({
    required_error: "El ID de la cuentita es obligatorio",
    invalid_type_error: "El ID de la cuentita debe ser un texto",
  }),
  ownerId: z.string({
    required_error: "El ID del acreedor es obligatorio",
    invalid_type_error: "El ID del acreedor debe ser un texto",
  }),
  shares: z
    .record(z.string(), z.number().nonnegative("La parte no debe ser negativa"))
    .refine((shares) => {
      return Object.keys(shares).length > 0;
    }, "Debe haber al menos un deudor"),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerAuthSession({ req, res });
  if (!session) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const newGastito = newGastitoSchema.safeParse(req.body);
  if (!newGastito.success) {
    res.status(400).json({
      success: false,
      errors: newGastito.error.errors.map((e) => e.message),
    });
    return;
  }

  const gastito = await db.gastito.create({
    data: {
      name: newGastito.data.name,
      amount: newGastito.data.amount,
      category: newGastito.data.category,
      repetition: newGastito.data.repetition,
      cuentitaId: newGastito.data.cuentitaId,
      ownerId: newGastito.data.ownerId,
    },
  });

  const totalShares = Object.values(newGastito.data.shares).reduce(
    (a: number, b: number) => a + b,
  );

  await db.share.createMany({
    data: Object.entries(newGastito.data.shares).map(([userId, share]) => {
      const amount = (share / totalShares) * Number(gastito.amount);
      return {
        gastitoId: gastito.id,
        userId,
        amount: Number(amount.toFixed(2)),
      };
    }),
  });

  res.json({ success: true });
}
