import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function Invite() {
  return (
    <div className="flex items-center justify-center pt-20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Unite a la cuentita!</CardTitle>
          <CardDescription>
            Dividi, registra, y salda gastos compartidos con el resto de
            miembros de NombreCuentita{" "}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="py-4 text-center">
            <p className="text-sm font-medium">Nombre Cuentita</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Creado por Miembro creador
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline">Decline</Button>
          <Button>Accept</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
