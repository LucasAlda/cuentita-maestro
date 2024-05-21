import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useState } from "react";
import { toast } from "sonner";

type Invitation =
  | {
      name: string;
      category: string;
      createdBy: string;
      alreadyMember: boolean;
    }
  | undefined;

export default function Invite() {
  const router = useRouter();
  const id = router.query.id;
  const [isSending, setSending] = useState(false);

  const { data: invitation, isError } = useQuery<Invitation>({
    queryKey: ["/cuentita/view-invitation", id],
    enabled: typeof id === "string",
  });

  function declineInvitation() {
    toast.error("Invitación rechazada");
    router.push("/");
  }

  function acceptInvitation() {
    if (typeof id !== "string" || isSending) return;
    setSending(true);

    fetch("/api/cuentita/join/" + id)
      .then(async (res) => {
        console.log(res.status);
        if (!res.ok) throw await res.json();

        toast.success("¡Te has unido a la cuentita!");
        router.push("/");
      })
      .catch((err) => {
        toast.error((err.message as string) ?? "Error al unirse a la cuentita");
        console.error(err);
        router.push("/");
      });
  }

  return (
    <div className="flex items-center justify-center pt-20">
      {isError ? (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Grupo no encontrado!</CardTitle>
            <CardDescription>
              Revise el link de invitación o contacte al creador de la cuentita
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {invitation ? (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Unite a la cuentita!</CardTitle>
            <CardDescription>
              Dividi, registra, y salda gastos compartidos con el resto de
              miembros de la cuentita
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="py-4 text-center">
              <p className="text-lg font-medium">{invitation.name}</p>
              <p className="text-sm capitalize text-slate-500 dark:text-slate-400">
                Categoría: {invitation.category}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Creado por {invitation.createdBy}
              </p>
            </div>
          </CardContent>
          {invitation.alreadyMember ? (
            <p className="pb-8 text-center italic text-slate-500">
              Ya eres miembro de la cuentita
            </p>
          ) : (
            <CardFooter className="flex justify-end gap-2">
              <Button onClick={declineInvitation} variant="outline">
                Rechazar
              </Button>
              <Button onClick={acceptInvitation} disabled={isSending}>
                {isSending ? "Uniendose..." : "Unirse"}
              </Button>
            </CardFooter>
          )}
        </Card>
      ) : null}
    </div>
  );
}
