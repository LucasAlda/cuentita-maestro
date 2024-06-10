import Head from "next/head";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { CalendarIcon, ChevronRight, Copy } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type User, type Cuentita } from "@prisma/client";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { type DateRange } from "react-day-picker";
import React from "react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";

export default function Home() {
  return (
    <>
      <Head>
        <title>Cuentita Maestro</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="mx-auto w-full max-w-xl space-y-4 px-4 py-10 sm:px-0">
        <div className="flex items-center justify-between">
          <h1 className="pl-1 text-2xl font-bold text-slate-800">
            Mis cuentitas!
          </h1>
          <CreateGroupDialog />
        </div>
        <GroupList />
      </main>
    </>
  );
}

export const numberFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
  minimumIntegerDigits: 2,
});

function GroupList() {
  const { data, isError } = useQuery<
    (Cuentita & { balance: number; users: User[] })[]
  >({
    queryKey: ["/cuentita/list"],
  });
  const [filterState, setFilterState] = useState<FilterState>({
    onlyNegativeBalance: false,
  });

  if (!data || isError) {
    return null;
  }

  const filteredData = data.filter((cuentita) => {
    const inCategory =
      !filterState.category || cuentita.category === filterState.category;

    const createdAt = new Date(cuentita.createdAt);
    const inDateRange =
      !filterState.date ||
      ((!filterState.date.from || createdAt >= filterState.date.from) &&
        (!filterState.date.to || createdAt <= filterState.date.to));

    const hasSelectedUser =
      !filterState.user ||
      cuentita.users.find((otherUser) => otherUser.id === filterState.user);

    const isNegative = !filterState.onlyNegativeBalance || cuentita.balance < 0;

    const inQuery =
      !filterState.query ||
      cuentita.name.toLowerCase().includes(filterState.query.toLowerCase());

    return (
      inCategory && inDateRange && hasSelectedUser && isNegative && inQuery
    );
  });

  return (
    <>
      <Filters state={filterState} setState={setFilterState} />
      <div className="divide-y divide-slate-200/70 rounded-lg bg-white shadow-md shadow-slate-200">
        {filteredData.length === 0 && (
          <div className="py-12 text-center text-sm italic text-slate-500">
            No hay Cuentitas
          </div>
        )}
        {filteredData.map((cuentita) => (
          <Link
            href={`/cuentita/${cuentita.id}`}
            key={cuentita.id}
            className="block"
          >
            <button className="flex w-full items-center justify-between px-6 py-3 text-left hover:cursor-pointer hover:bg-slate-50">
              <div>
                <h3 className="font-semibold">{cuentita.name}</h3>
                <p className="text-sm capitalize text-slate-500">
                  {cuentita.category}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p
                  className={
                    cuentita.balance >= 0 ? "text-green-600" : "text-red-600"
                  }
                >
                  {numberFormatter.format(cuentita.balance)}
                </p>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </button>
          </Link>
        ))}
      </div>
    </>
  );
}

function CreateGroupDialog() {
  const [invitationLink, setInvitationLink] = useState<string | undefined>();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setInvitationLink(undefined);
      }, 300);
    }
  }, [open]);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button>Crear Cuentita</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        {!invitationLink ? (
          <CreateCuentitaForm
            open={open}
            onCuentitaCreated={setInvitationLink}
          />
        ) : (
          <CreateCuentitaLink link={invitationLink} />
        )}
      </DialogContent>
    </Dialog>
  );
}

type CreateResponse =
  | { success: true; invitationLink: string }
  | { success: false; errors: string[] }
  | undefined;

function CreateCuentitaForm(props: {
  open: boolean;
  onCuentitaCreated: (link: string | undefined) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [inflation, setInflation] = useState(false);
  const [response, setResponse] = useState<CreateResponse>();

  const ctx = useQueryClient();

  const handleSubmit = () => {
    fetch("/api/cuentita/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, inflation }),
    })
      .then((res) => res.json())
      .then((data: CreateResponse) => {
        setResponse(data);
        if (data?.success) {
          props.onCuentitaCreated(data.invitationLink);
          ctx.invalidateQueries();
        }
      });
  };

  useEffect(() => {
    if (!props.open) {
      setTimeout(() => {
        setName("");
        setCategory("");
        setInflation(false);
        setResponse(undefined);
      }, 300);
    }
  }, [props.open]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Crear Cuentita</DialogTitle>
        <DialogDescription>
          Configure los datos de la cuentita.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-1">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            placeholder="Futbol 5 de los domingos"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="categoria" className="text-right">
            Categoría
          </Label>
          <Select
            value={category}
            onValueChange={(value) => setCategory(value)}
          >
            <SelectTrigger id="categoria" className="col-span-3">
              <SelectValue placeholder="Selecciona una Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="evento">Evento</SelectItem>
              <SelectItem value="familia">Familia</SelectItem>
              <SelectItem value="amigos">Amigos</SelectItem>
              <SelectItem value="deporte">Deporte</SelectItem>
              <SelectItem value="hogar">Hogar</SelectItem>
              <SelectItem value="viaje">Viaje</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="terms"
            checked={inflation}
            onCheckedChange={(checked) =>
              checked !== "indeterminate" && setInflation(checked)
            }
          />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Ajustar por inflación
          </label>
          <span className="text-xs text-slate-500">(Proximamente)</span>
        </div>
      </div>
      {response?.success === false && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm">
          <ul className="list-inside list-disc text-red-600">
            {response.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancelar</Button>
        </DialogClose>
        <Button onClick={handleSubmit}>Crear</Button>
      </DialogFooter>
    </>
  );
}

function CreateCuentitaLink(props: { link: string | undefined }) {
  const copy = () => {
    if (!props.link) return;
    navigator.clipboard.writeText(props.link);
    toast.success("Enlace copiado al portapapeles");
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>¡Cuentita Creada!</DialogTitle>
        <DialogDescription>
          ¡Ya puedes invitar a tus amigos a la cuentita!
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-1">
          <Label htmlFor="link">Enlace de Invitación</Label>
          <div className="flex gap-1">
            <Input id="link" value={props.link} readOnly />
            <Button size={"icon"} variant="outline" onClick={copy}>
              <Copy className="h-4 w-4 text-slate-600" />
            </Button>
          </div>
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cerrar</Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}

type FilterState = {
  category?: string;
  user?: string;
  date?: DateRange;
  onlyNegativeBalance: boolean;
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
            <p className="whitespace-nowrap">Solo deudor</p>
            <Checkbox
              checked={state.onlyNegativeBalance}
              onCheckedChange={(checked) =>
                checked !== "indeterminate" &&
                setState({ ...state, onlyNegativeBalance: checked })
              }
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setState({ onlyNegativeBalance: false, query: state.query })
              }
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
