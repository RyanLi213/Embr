import { useUser } from "@clerk/nextjs";

/** Who is using Embr right now, as every screen needs to know it */
export type Account =
  | { status: "loading" }
  | { status: "guest" }
  | {
      status: "signed-in";
      name: string | null;
      email: string | null;
      phone: string | null;
      /** One letter for the round avatar, for example "A" */
      initial: string;
    };

/**
 * Whether someone is signed in, and who. "loading" until Clerk has started in
 * the browser, so screens can wait instead of flashing the wrong thing.
 */
export function useAccount(): Account {
  const { isLoaded, isSignedIn, user } = useUser();
  if (!isLoaded) return { status: "loading" };
  if (!isSignedIn) return { status: "guest" };

  const name = user.fullName?.trim() || null;
  const email = user.primaryEmailAddress?.emailAddress ?? null;
  const phone = user.primaryPhoneNumber?.phoneNumber ?? null;
  const initial = (name ?? email ?? "?").charAt(0).toUpperCase();
  return { status: "signed-in", name, email, phone, initial };
}
