import { useQuery } from "@tanstack/react-query";
import type { Gastito, Share } from "@prisma/client";
import { numberFormatter } from ".";
import { format } from "date-fns";
import Link from "next/link";

export default function Page() {
  const { data, isError } = useQuery<
    (Share & { gastito: Gastito } & { name: string })[]
  >({
    queryKey: ["/shares/list"],
  });

  if (!data || isError) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 px-4 py-10 sm:px-0">
      <h1 className="pl-1 text-2xl font-bold text-slate-800">Mis gastitos!</h1>
      <div className="divide-y divide-slate-200/70 rounded-lg bg-white shadow-md shadow-slate-200">
        {data.length === 0 && (
          <div className="py-12 text-center text-sm italic text-slate-500">
            No hay gastitos por el momento...
          </div>
        )}
        {data.map((share) => (
          <Link
            key={share.id}
            href={`/cuentita/${share.gastito.cuentitaId}`}
            className="flex w-full items-center justify-between px-6 py-3 hover:bg-slate-50"
          >
            <div>
              <div className="flex flex-col items-start gap-x-2 sm:flex-row sm:items-center">
                <h2 className="text-lg font-semibold">{share.gastito?.name}</h2>

                <p className="inline-flex rounded-full bg-slate-200 px-2 text-sm text-slate-800">
                  {share.name}
                </p>
              </div>
              <p className="mt-1 text-sm capitalize text-slate-600 sm:mt-0">
                {share.gastito?.category}
              </p>
            </div>
            <div className="flex flex-col items-end text-red-500">
              <p>{numberFormatter.format(-Number(share.amount))}</p>
              <p className=" items-center text-sm font-normal text-slate-500">
                {format(new Date(share.gastito?.createdAt), "dd/MM/yyyy")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
