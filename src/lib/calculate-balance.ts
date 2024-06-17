import type { Cuentita, User } from "@prisma/client";
import { db } from "@/server/db";

export async function calculateBalance(
  userId: User["id"],
  cuentitaId: Cuentita["id"],
) {
  const shares = await db.share.findMany({
    where: {
      gastito: {
        cuentitaId: cuentitaId,
      },
      userId: userId,
    },
  });

  const ownedGastitos = await db.gastito.aggregate({
    where: {
      ownerId: userId,
      cuentitaId: cuentitaId,
    },
    _sum: {
      amount: true,
    },
  });

  const ownedAmount = Number(ownedGastitos._sum.amount ?? 0);

  const sharesAmount = shares.reduce(
    (balance: number, share) =>
      Number((balance + Number(share.amount)).toFixed(2)),
    0,
  );

  return ownedAmount - sharesAmount;
}
