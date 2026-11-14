import { Button } from "@/components/ui/button";
import { ApiStatus } from "@/components/api-status"

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Embr</h1>
      <p className="max-w-md text-lg text-muted-foreground">
        A daily companion for living with arthritis.
      </p>
      <Button size="lg">Check in</Button>
      <ApiStatus />
    </main>
  );
}
