"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Host } from "@/lib/types";

const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

const formSchema = z.object({
  name: z.string().min(1, "Ein Host-Name wird benötigt."),
  ipAddress: z.string().regex(ipRegex, "Ungültige IPv4-Adresse."),
  sshPort: z.coerce.number().min(1, "Ein SSH-Port wird benötigt.").max(65535, "Ungültige Port-Nummer.").default(22),
});

type AddHostFormValues = z.infer<typeof formSchema>;

interface AddHostDialogProps {
  onAddHost: (host: Host) => void;
}

// Basic UUID generator that doesn't require a secure context
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function AddHostDialog({ onAddHost }: AddHostDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<AddHostFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      ipAddress: "",
      sshPort: 22,
    },
  });

  function onSubmit(values: AddHostFormValues) {
    const newHost: Host = {
        id: generateUUID(),
        ...values,
        status: 'offline',
        createdAt: Date.now(),
        containers: [],
        history: [],
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
    };
    onAddHost(newHost);
    form.reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Host hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Neuen Host hinzufügen</DialogTitle>
          <DialogDescription>
            Gib die Details für den neuen Host ein, den du überwachen möchtest.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Host-Name</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Produktions-Server" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ipAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IP-Adresse</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. 192.168.1.100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sshPort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SSH-Port</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="z.B. 22" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Host hinzufügen</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
