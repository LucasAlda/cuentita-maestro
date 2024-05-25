import { Button, type buttonVariants } from "@/components/ui/button";
import {
  Dialog as DialogRoot,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { type VariantProps } from "class-variance-authority";
import { useEffect, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

export async function requestConfirmation(props: {
  title: string;
  description?: string;
  body?: ReactNode;
  onCancel?: () => void;
  action?:
    | string
    | {
        label: string;
        variant?: VariantProps<typeof buttonVariants>["variant"];
      };
  cancel?:
    | string
    | {
        label: string;
        variant?: VariantProps<typeof buttonVariants>["variant"];
      };
}): Promise<boolean> {
  return new Promise((resolve) => {
    let open = true;

    const onCancel = () => {
      open = false;
      render();
      resolve(false);
    };

    const onConfirm = () => {
      open = false;
      resolve(true);
      render();
    };

    const mountRoot = createRoot(document.createElement("div"));

    const render = () => {
      mountRoot.render(
        <Dialog
          open={open}
          props={props}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />,
      );
    };

    render();
  });
}
function Dialog({
  open,
  props,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  props: {
    title: string;
    description?: string | undefined;
    body?: ReactNode;
    onCancel?: (() => void) | undefined;
    action?:
      | string
      | {
          label: string;
          variant?: VariantProps<typeof buttonVariants>["variant"];
        };
    cancel?:
      | string
      | {
          label: string;
          variant?: VariantProps<typeof buttonVariants>["variant"];
        };
  };
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onCancel, open]);

  return (
    <DialogRoot open={open}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle>{props.title}</DialogTitle>
          </DialogHeader>
          {props.description && (
            <DialogDescription>{props.description}</DialogDescription>
          )}
          {props.body}
          <DialogFooter>
            <DialogClose asChild onClick={onCancel}>
              <Button variant="outline">
                {typeof props.cancel === "string"
                  ? props.cancel
                  : props.cancel?.label ?? "Cancelar"}
              </Button>
            </DialogClose>
            <DialogClose asChild onClick={onCancel}>
              <Button
                variant={
                  typeof props.action !== "string"
                    ? props.action?.variant ?? "success"
                    : "success"
                }
                onClick={onConfirm}
              >
                {typeof props.action === "string"
                  ? props.action
                  : props.action?.label ?? "Confirmar"}
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}
