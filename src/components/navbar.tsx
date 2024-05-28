import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { CircleUser, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const menuItems = [
  {
    label: "Cuentitas",
    link: "/",
  },
  {
    label: "Gastitos",
    link: "/gastitos",
  },
];

export function Navbar() {
  const session = useSession();

  return (
    <header className="sticky top-0 flex h-16 items-center justify-between gap-4 border-b bg-slate-800 px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-white md:text-base"
        >
          Cuentita Maestro
        </Link>
        {menuItems.map((item) => (
          <Link
            key={item.link}
            href={item.link}
            className="text-slate-400 transition-colors hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 border-slate-600 bg-slate-700 text-white hover:bg-slate-600 hover:text-white md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="#"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <span className="sr-only">Cuentita Maestro</span>
            </Link>
            {menuItems.map((item) => (
              <Link
                key={item.link}
                href={item.link}
                className="text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              {session.status === "authenticated" ? (
                <Avatar>
                  <AvatarImage src={session.data.user.image!} />
                  <AvatarFallback>
                    {session.data.user.name
                      ?.split(" ")
                      .map((word) => word[0].toUpperCase())}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <CircleUser className="h-5 w-5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {session.status === "authenticated" ? (
              <>
                <DropdownMenuLabel>{session.data.user.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  Cerrar sesión
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuLabel>Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signIn()}>
                  Iniciar sesión
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
