import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { Gastito, Share } from "@prisma/client";
import { numberFormatter } from ".";
import { format } from "date-fns";

export default function Page() {
  const session = useSession();
  const { data, isError } = useQuery<
    (Share & { gastito: Gastito } & { name: string })[]
  >({
    queryKey: ["/shares/list"],
  });

  if (!data || isError) {
    return null;
  }

  return (
    <div className=" space-y-2 p-10">
      <h1 className="text-3xl font-bold text-slate-800">Mis Gastitos</h1>
      <div className="divide-y divide-slate-200/70 rounded-lg bg-white shadow-md shadow-slate-200">
        {data.length === 0 && (
          <div className="py-12 text-center text-sm italic text-slate-500">
            No hay gastitos por el momento...
          </div>
        )}
        {data.map((share) => (
          <div
            key={share.id}
            className="flex w-full items-center justify-between px-6 py-3"
          >
            <div>
              <h2 className="text-lg font-semibold">{share.gastito?.name}</h2>

              <p className="pl-2 text-sm text-slate-600">
                De la cuentita: {share.name}
              </p>
              <p className="pl-2 text-sm capitalize text-slate-600">
                {share.gastito?.category}
              </p>
            </div>
            <div>
              <p
                className={
                  share.gastito.ownerId === session.data?.user.id
                    ? " text-green-600"
                    : " text-red-600"
                }
              >
                {numberFormatter.format(Number(share.amount))}
              </p>
              <p className=" items-center text-sm font-normal text-slate-500">
                {" "}
                {format(new Date(share.gastito?.createdAt), "dd/MM/yyyy")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
