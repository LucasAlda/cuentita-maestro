import { useQuery } from "@tanstack/react-query";
import type { Cuentita, Gastito, Share, User } from "@prisma/client";
import { numberFormatter } from ".";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { type DateRange } from "react-day-picker";
import { useState } from "react";

export default function Page() {
  const { data, isError } = useQuery<
    (Share & { gastito: Gastito } & { name: string } & { shares: Share[] })[]
  >({
    queryKey: ["/shares/list"],
  });

  const [filterState, setFilterState] = useState<FilterState>({});

  if (!data || isError) {
    return null;
  }

  const filteredData = data.filter((share) => {
    const inCategory =
      !filterState.category || share.gastito.category === filterState.category;

    const createdAt = new Date(share.gastito.createdAt);
    const inDateRange =
      !filterState.date ||
      ((!filterState.date.from || createdAt >= filterState.date.from) &&
        (!filterState.date.to || createdAt <= filterState.date.to));

    const hasSelectedUser =
      !filterState.user ||
      share.shares.some((share) => share.userId === filterState.user) ||
      share.gastito.ownerId === filterState.user;

    const inQuery =
      !filterState.query ||
      share.gastito.name
        .toLowerCase()
        .includes(filterState.query.toLowerCase());

    return inCategory && inDateRange && hasSelectedUser && inQuery;
  });

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 px-4 py-10 sm:px-0">
      <h1 className="pl-1 text-2xl font-bold text-slate-800">Mis gastitos!</h1>
      <Filters state={filterState} setState={setFilterState} />
      <div className="divide-y divide-slate-200/70 rounded-lg bg-white shadow-md shadow-slate-200">
        {filteredData.length === 0 && (
          <div className="py-12 text-center text-sm italic text-slate-500">
            No hay gastitos por el momento...
          </div>
        )}
        {filteredData.map((share) => (
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

type FilterState = {
  category?: string;
  user?: string;
  date?: DateRange;
  query?: string;
};

function Filters({
  state,
  setState,
}: {
  state: FilterState;
  setState: (state: FilterState) => void;
}) {
  const id = useSession().data?.user.id;

  const { data, isError } = useQuery<
    (Cuentita & { balance: number; users: User[] })[]
  >({
    queryKey: ["/cuentita/list"],
  });
  if (!data || isError) {
    return null;
  }

  const repeatedUsers = data.flatMap((cuentita) => {
    return cuentita.users;
  });
  const users = repeatedUsers.reduce((users: User[], user) => {
    if (
      user.id !== id &&
      !users.find((otherUser) => otherUser.id === user.id)
    ) {
      users.push(user);
    }
    return users;
  }, []);

  return (
    <div className="flex gap-2">
      <Input
        className="bg-white"
        placeholder="Filtrar por nombre"
        value={state.query}
        onChange={(e) =>
          setState({
            ...state,
            query: e.target.value,
          })
        }
      />
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Avanzado</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtros avanzados</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-[auto_1fr] items-center gap-4">
            <p>Categoria</p>
            <Select
              value={state.category ?? "cualquiera"}
              onValueChange={(category) =>
                setState({
                  ...state,
                  category: category === "cualquiera" ? undefined : category,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Categoria</SelectLabel>
                  <SelectItem value="cualquiera">Todas</SelectItem>
                  <SelectItem value="evento">Evento</SelectItem>
                  <SelectItem value="familia">Familia</SelectItem>
                  <SelectItem value="amigos">Amigos</SelectItem>
                  <SelectItem value="deporte">Deporte</SelectItem>
                  <SelectItem value="hogar">Hogar</SelectItem>
                  <SelectItem value="viaje">Viaje</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p>Fecha</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "justify-start text-left font-normal",
                    !state.date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {state.date?.from ? (
                    state.date.to ? (
                      <>
                        {format(state.date.from, "LLL dd, y")} -{" "}
                        {format(state.date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(state.date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Desde - Hasta</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={state.date?.from}
                  selected={state.date}
                  onSelect={(date) => setState({ ...state, date })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <p>Miembro</p>
            <Select
              value={state.user ?? "cualquiera"}
              onValueChange={(user) =>
                setState({
                  ...state,
                  user: user === "cualquiera" ? undefined : user,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Miembros</SelectLabel>
                  <SelectItem value="cualquiera">Todos</SelectItem>
                  {users.map((user) => {
                    return (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setState({ query: state.query })}
            >
              Limpiar filtros
            </Button>
            <DialogClose>
              <Button>Cerrar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
