"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function MainError({ reset }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Image src="/pip/pip-coffee.svg" alt="" width={160} height={160} className="h-32 w-32 sm:h-40 sm:w-40" />
      <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Pip hit a snag</h2>
      <p className="max-w-md text-sm sm:text-base text-muted-foreground">
        Something went wrong on our side. Give it another go in a moment.
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
