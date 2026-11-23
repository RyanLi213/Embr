import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthLayout, FORM_APPEARANCE } from "@/components/auth/auth-layout";

export const metadata: Metadata = { title: "Sign in" };

// "[[...sign-in]]" also catches Clerk's later steps, such as /sign-in/factor-one
export default function SignInPage() {
  return (
    <AuthLayout title="Welcome back." intro="Sign in to continue your journey with Embr.">
      {/* Clerk's form reads the address, so it waits in Suspense (needed by cacheComponents) */}
      <Suspense>
        <SignIn appearance={FORM_APPEARANCE} />
      </Suspense>
    </AuthLayout>
  );
}
