"use client";

import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";

// Lazy load Clerk components for better performance - only load when needed
const SignInComponent = dynamic(
  () => import("@clerk/nextjs").then(mod => mod.SignIn),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin"></div>
      </div>
    )
  }
);

export default function SignInPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();

  // Non-blocking redirect check - don't wait for it, show content immediately
  useEffect(() => {
    // Only redirect if we're sure user is signed in (non-blocking)
    if (isLoaded && isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  // Show content immediately - don't wait for Clerk to load
  // The form will be interactive as soon as Clerk loads in the background

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Back to Home Link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 sm:p-8 shadow-sm">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 border border-neutral-200 mb-4">
                <Sparkles className="w-4 h-4 text-neutral-700" />
                <span className="text-sm font-medium text-neutral-700">Welcome Back</span>
              </div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Sign In</h2>
              <p className="text-neutral-600 text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  href="/sign-up"
                  className="text-neutral-900 font-semibold hover:text-neutral-700 underline"
                >
                  Sign up
                </Link>
              </p>
            </div>

            {/* Clerk SignIn Component with Custom Styling */}
            <div className="[&_.cl-rootBox]:!w-full [&_.cl-card]:!shadow-none [&_.cl-card]:!border-none [&_.cl-main]:!p-0 [&_.cl-formButtonPrimary]:!transition-all">
              <SignInComponent
                forceRedirectUrl="/"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-none bg-transparent",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "bg-white border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors font-medium",
                    socialButtonsBlockButtonText: "text-neutral-900 font-medium",
                    formButtonPrimary: "bg-neutral-900 hover:bg-neutral-800 text-white font-semibold transition-colors",
                    formFieldLabel: "text-neutral-700 font-medium text-sm",
                    formFieldInput: "border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900 text-neutral-900",
                    footerActionLink: "text-neutral-900 font-semibold hover:text-neutral-700",
                    footerActionText: "text-neutral-600",
                    dividerLine: "bg-neutral-200",
                    dividerText: "text-neutral-500",
                    identityPreviewText: "text-neutral-900",
                    identityPreviewEditButton: "text-neutral-600 hover:text-neutral-900",
                    formResendCodeLink: "text-neutral-900 font-semibold hover:text-neutral-700",
                    otpCodeFieldInput: "border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900",
                    alertText: "text-neutral-700",
                    formFieldErrorText: "text-red-600",
                    formFieldSuccessText: "text-green-600",
                  },
                  layout: {
                    socialButtonsPlacement: "top",
                  },
                }}
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
                afterSignInUrl="/"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

