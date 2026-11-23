/**
 * A fake Clerk for unit tests, used instead of the real `@clerk/nextjs` (see
 * vitest.setup.ts). Everyone starts as a guest; a test calls `signInAs()` to
 * be signed in. Nothing here ever contacts Clerk.
 */
import { vi } from "vitest";

type FakeUser = { fullName: string | null; email: string | null; phone: string | null };

const state = {
  loaded: true,
  user: null as FakeUser | null,
};

/** Clerk's pretend sign-in token, and its sign-out button */
export const fakeClerk = {
  getToken: vi.fn(async (): Promise<string | null> => "test-token"),
  signOut: vi.fn(async () => {}),
};

/** Signs in a made-up person (change any detail with `user`) */
export function signInAs(user: Partial<FakeUser> = {}) {
  state.loaded = true;
  state.user = { fullName: "Alex Example", email: "alex@example.com", phone: null, ...user };
}

/** Clerk hasn't started yet, as on the server or the first moment in the browser */
export function clerkStillLoading() {
  state.loaded = false;
}

/** Back to a signed-out guest, before each test */
export function resetFakeClerk() {
  state.loaded = true;
  state.user = null;
  fakeClerk.getToken.mockClear();
  fakeClerk.getToken.mockImplementation(async () => "test-token");
  fakeClerk.signOut.mockClear();
}

/** The parts of `@clerk/nextjs` that Embr uses, faked */
export const fakeClerkModule = {
  useUser: () => {
    if (!state.loaded) return { isLoaded: false, isSignedIn: undefined, user: undefined };
    if (!state.user) return { isLoaded: true, isSignedIn: false, user: null };
    const { fullName, email, phone } = state.user;
    return {
      isLoaded: true,
      isSignedIn: true,
      user: {
        fullName,
        primaryEmailAddress: email ? { emailAddress: email } : null,
        primaryPhoneNumber: phone ? { phoneNumber: phone } : null,
      },
    };
  },
  useAuth: () => ({
    isLoaded: state.loaded,
    isSignedIn: state.loaded ? Boolean(state.user) : undefined,
    sessionId: state.user ? "sess_test" : null,
    getToken: fakeClerk.getToken,
  }),
  useClerk: () => ({ signOut: fakeClerk.signOut }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignIn: () => null,
  SignUp: () => null,
};
