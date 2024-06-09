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
import { User, type Cuentita } from "@prisma/client";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
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
  const id = useSession().data?.user.id;

  let { data, isError } = useQuery<
    (Cuentita & { balance: number; users: User[] })[]
  >({
    queryKey: ["/cuentita/list"],
  });

  const [category, setCategory] = useState("cualquiera");
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [user, setUser] = useState<string | undefined>("cualquiera");

  if (!data || isError) {
    return null;
  }

  data = data.filter((cuentita) => {
    const inCategory =
      category === "cualquiera" || cuentita.category === category;

    const createdAt = new Date(cuentita.createdAt as any as string);
    const inDateRange =
      !date ||
      ((!date.from || createdAt >= date.from) &&
        (!date.to || createdAt <= date.to));

    const hasSelectedUser =
      !user ||
      user == "cualquiera" ||
      cuentita.users.find((otherUser) => otherUser.id === user);

    return inCategory && inDateRange && hasSelectedUser;
  });

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
    <>
      <div className="flex-col items-center space-y-4">
        <div className="flex items-center space-x-4">
          <p>Categoria:</p>
          <Select
            value={category}
            onValueChange={(value) => setCategory(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Categoria</SelectLabel>
                <SelectItem value="cualquiera">Cualquiera</SelectItem>
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
        </div>
        <div className="flex items-center space-x-4">
          <p>Fecha:</p>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !date && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
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
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center space-x-4">
          <p>Miembro:</p>
          <Select value={user} onValueChange={(value) => setUser(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Categoria</SelectLabel>
                <SelectItem value="cualquiera">Cualquiera</SelectItem>
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
      </div>
      <div className="divide-y divide-slate-200/70 rounded-lg bg-white shadow-md shadow-slate-200">
        {data.length === 0 && (
          <div className="py-12 text-center text-sm italic text-slate-500">
            No hay Cuentitas
          </div>
        )}
        {data.map((cuentita) => (
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
