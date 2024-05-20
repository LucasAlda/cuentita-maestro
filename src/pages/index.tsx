import { useSession } from "next-auth/react";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const session = useSession();

  return (
    <>
      <Head>
        <title>Cuentita Maestro</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="p-10">
        <h1 className="text-3xl font-bold text-slate-800">
          Hola, {session.data?.user.name}!
        </h1>
        <CreateGroupDialog />
      </main>
    </>
  );
}

export function CreateGroupDialog() {
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
        <Button variant="outline">Crear Cuentita</Button>
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
