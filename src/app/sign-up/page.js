"use client";

import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, Sparkles, CheckCircle } from "lucide-react";
import dynamic from "next/dynamic";

// Lazy load Clerk components for better performance - only load when needed
const SignUpComponent = dynamic(
  () => import("@clerk/nextjs").then(mod => mod.SignUp),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin"></div>
      </div>
    )
  }
);

export default function SignUpPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const mainAppUrl = process.env.NEXT_PUBLIC_MAIN_APP_URL || "/";

  // Non-blocking redirect check - don't wait for it, show content immediately
  useEffect(() => {
    // Only redirect if we're sure user is signed in (non-blocking)
    if (isLoaded && isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  // Show content immediately - don't wait for Clerk to load
  // The form will be interactive as soon as Clerk loads in the background

  const features = [
    "Unlimited practice questions",
    "Track your progress",
    "Daily practice problems",
    "Weekly contests",
    "Detailed solutions",
    "Performance analytics"
  ];

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Side - Benefits */}
          <div className="order-2 lg:order-1">
            <div className="bg-white border border-neutral-200 rounded-xl p-6 sm:p-8 shadow-sm">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 border border-neutral-200 mb-6">
                <Sparkles className="w-4 h-4 text-neutral-700" />
                <span className="text-sm font-medium text-neutral-700">Start Your Journey</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900 mb-4">
                Join 10tracker Today
              </h1>
              <p className="text-lg text-neutral-600 mb-8">
                Create your free account and start practicing smarter. Track your progress, 
                compete in contests, and achieve your exam goals.
              </p>

              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">What you&apos;ll get:</h3>
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-neutral-700" />
                    </div>
                    <p className="text-neutral-700">{feature}</p>
                  </div>
                ))}
              </div>

              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                <p className="text-sm text-neutral-600">
                  <span className="font-semibold text-neutral-900">Free to start</span> - No credit card required. 
                  Get unlimited access to practice questions and track your progress.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Sign Up Form */}
          <div className="order-1 lg:order-2">
            <div className="bg-white border border-neutral-200 rounded-xl p-6 sm:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Create Account</h2>
                <p className="text-neutral-600 text-sm">
                  Already have an account?{" "}
                  <Link
                    href="/sign-in"
                    className="text-neutral-900 font-semibold hover:text-neutral-700 underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>

              {/* Clerk SignUp Component with Custom Styling */}
              <div className="[&_.cl-rootBox]:!w-full [&_.cl-card]:!shadow-none [&_.cl-card]:!border-none [&_.cl-main]:!p-0 [&_.cl-formButtonPrimary]:!transition-all">
                <SignUpComponent
                  forceRedirectUrl={mainAppUrl}
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
                      showOptionalFields: false,
                    },
                  }}
                  routing="path"
                  path="/sign-up"
                  signInUrl="/sign-in"
                  afterSignUpUrl={mainAppUrl}
                  afterSignInUrl={mainAppUrl}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

