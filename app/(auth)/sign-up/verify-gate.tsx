"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function VerifyGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Check if the signup code was validated
    const checkValidation = async () => {
      const response = await fetch("/api/auth/check-signup-validation");
      const data = await response.json();

      if (!data.validated) {
        // Redirect to signup gate if not validated
        router.push("/signup-gate");
      }
    };

    checkValidation();
  }, [router]);

  return <>{children}</>;
}
