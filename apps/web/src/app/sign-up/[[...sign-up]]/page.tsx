import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthLayout, FORM_APPEARANCE } from "@/components/auth/auth-layout";

export const metadata: Metadata = { title: "Create an account" };

// "[[...sign-up]]" also catches Clerk's later steps, such as /sign-up/verify-email-address
export default function SignUpPage() {
  return (
    <AuthLayout
      title="Keep your good days close."
      intro="Create a free account to protect your check-ins and use Embr anywhere."
    >
      {/* Clerk's form reads the address, so it waits in Suspense (needed by cacheComponents) */}
      <Suspense>
        <SignUp appearance={FORM_APPEARANCE} />
      </Suspense>
    </AuthLayout>
  );
}
