"use client";

import React, { useId, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Cloud,
  Eye,
  EyeOff,
  HardDrive,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Sparkles,
  User,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useStreamStore } from "@/store/useStreamStore";
import { cn } from "@/lib/utils";

export interface StudioUser {
  id: string;
  name: string;
  email: string;
}

export type StudioAuthMode = "sign-in" | "sign-up" | "guest";

interface StudioAuthFormProps {
  title?: string;
  description?: string;
  githubAuthEnabled?: boolean;
  googleAuthEnabled?: boolean;
  defaultMode?: StudioAuthMode;
  showGuestTab?: boolean;
  variant?: "card" | "embedded";
  onAuthenticated: (user: StudioUser) => void | Promise<void>;
  onContinueAsGuest?: () => void;
  guestActionLabel?: string;
}

const SIGN_UP_PERKS = [
  "Cloud DB Sync",
  "Public /watch URLs",
  "Cross-Device",
] as const;

const GUEST_CAPABILITIES = [
  "Up to 9 Simultaneous Live Feeds",
  "Local Browser Layout Storage (25 slots)",
  "Full Audio Mixer & Watch Party",
] as const;

/**
 * Shared Login, Sign Up, and Guest Studio Pass component powered by Better Auth & Zustand.
 */
export function StudioAuthForm({
  title,
  description,
  githubAuthEnabled = false,
  googleAuthEnabled = true,
  defaultMode = "sign-in",
  showGuestTab,
  variant = "card",
  onAuthenticated,
  onContinueAsGuest,
  guestActionLabel = "Continue with Guest Pass",
}: StudioAuthFormProps) {
  const formId = useId();
  const hasGuestTab = showGuestTab ?? Boolean(onContinueAsGuest);
  const initialMode: StudioAuthMode =
    defaultMode === "guest" && !hasGuestTab ? "sign-in" : defaultMode;

  const storedGuestName = useStreamStore((s) => s.guestName);
  const setGuestProfile = useStreamStore((s) => s.setGuestProfile);

  const [mode, setMode] = useState<StudioAuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [guestInputName, setGuestInputName] = useState(
    storedGuestName || "Guest Director"
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const isBusy = isSubmitting || isGithubLoading || isGoogleLoading;

  const passwordMetrics = useMemo(() => {
    const hasMinLength = password.length >= 8;
    const hasLetterAndNumber =
      /[a-zA-Z]/.test(password) && /\d/.test(password);
    const hasExtraComplexity =
      password.length >= 12 || /[^a-zA-Z0-9]/.test(password);

    let score = 0;
    if (password.length >= 4) score += 1;
    if (hasMinLength) score += 1;
    if (hasLetterAndNumber) score += 1;
    if (hasMinLength && hasExtraComplexity) score += 1;

    const strengthLabel =
      password.length === 0
        ? "Enter 8+ chars"
        : score <= 1
          ? "Weak"
          : score === 2
            ? "Fair"
            : score === 3
              ? "Good"
              : "Strong";

    return {
      hasMinLength,
      hasLetterAndNumber,
      score,
      strengthLabel,
    };
  }, [password]);

  const handleModeChange = (nextMode: StudioAuthMode) => {
    setMode(nextMode);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!normalizedEmail || !password) {
      const msg = "Please enter your email address and password.";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    if (mode === "sign-up") {
      if (!trimmedName) {
        const msg = "Please enter a display name for your Studio account.";
        setFormError(msg);
        toast.error(msg);
        return;
      }
      if (password.length < 8) {
        const msg = "Password must be at least 8 characters long.";
        setFormError(msg);
        toast.error(msg);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const result =
        mode === "sign-up"
          ? await authClient.signUp.email({
              email: normalizedEmail,
              password,
              name: trimmedName,
            })
          : await authClient.signIn.email({
              email: normalizedEmail,
              password,
            });

      if (result.error) {
        const msg =
          result.error.message ||
          (mode === "sign-up"
            ? "Could not create your account."
            : "Invalid email or password.");
        setFormError(msg);
        toast.error(msg);
        return;
      }

      const authUser = result.data?.user;
      if (!authUser) {
        const msg =
          "Authentication succeeded, but no user profile was returned.";
        setFormError(msg);
        toast.error(msg);
        return;
      }

      const nextUser: StudioUser = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name || normalizedEmail.split("@")[0],
      };

      await onAuthenticated(nextUser);
      toast.success(
        mode === "sign-up"
          ? `Account created! Welcome, ${nextUser.name}`
          : `Signed in as ${nextUser.name}`
      );
    } catch (error) {
      console.error("[StudioAuthForm] Auth error:", error);
      const msg = "Authentication failed. Please try again.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGithubSignIn = async () => {
    setFormError(null);
    setIsGithubLoading(true);
    try {
      const result = await authClient.signIn.social({
        provider: "github",
        callbackURL: "/",
      });

      if (result?.error) {
        const msg = result.error.message || "Could not start GitHub sign-in.";
        setFormError(msg);
        toast.error(msg);
        setIsGithubLoading(false);
      }
    } catch (error) {
      console.error("[StudioAuthForm] GitHub OAuth error:", error);
      const msg = "Could not start GitHub sign-in.";
      setFormError(msg);
      toast.error(msg);
      setIsGithubLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    setIsGoogleLoading(true);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });

      if (result?.error) {
        const msg = result.error.message || "Could not start Google sign-in.";
        setFormError(msg);
        toast.error(msg);
        setIsGoogleLoading(false);
      }
    } catch (error) {
      console.error("[StudioAuthForm] Google OAuth error:", error);
      const msg = "Could not start Google sign-in. Please ensure GOOGLE_CLIENT_ID is set in .env.";
      setFormError(msg);
      toast.error(msg);
      setIsGoogleLoading(false);
    }
  };

  const handleGuestContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedName = guestInputName.trim() || "Guest Director";
    setGuestProfile(resolvedName);
    toast.success(`Guest Studio Pass active as "${resolvedName}"`);
    onContinueAsGuest?.();
  };

  const headerConfig =
    mode === "guest"
      ? {
          icon: HardDrive,
          iconBoxClass:
            "border-sky-500/30 bg-sky-500/15 text-sky-600 dark:border-sky-400/30 dark:bg-sky-500/15 dark:text-sky-400",
          heading: "Studio Guest Pass",
          subtitle:
            "Watch, mix audio, and store layouts locally in this browser with zero account setup.",
        }
      : mode === "sign-up"
        ? {
            icon: UserPlus,
            iconBoxClass:
              "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-400",
            heading: "Create Studio Account",
            subtitle:
              "Persist multi-stream layouts to Neon PostgreSQL and publish shareable /watch links.",
          }
        : {
            icon: Cloud,
            iconBoxClass:
              "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-400",
            heading: title || "Welcome Back",
            subtitle:
              description ||
              "Sign in to sync your saved command walls across devices and manage /watch links.",
          };

  const HeaderIcon = headerConfig.icon;

  return (
    <div
      className={cn(
        "space-y-4",
        variant === "card" &&
          "rounded-2xl border border-zinc-200/90 bg-zinc-50/75 p-4 shadow-xs dark:border-zinc-800/90 dark:bg-zinc-900/55"
      )}
    >
      {/* Unified Segmented Switcher */}
      <div
        role="tablist"
        aria-label="Authentication mode"
        className={cn(
          "grid gap-1 rounded-xl border border-zinc-200/90 bg-zinc-100/90 p-1 dark:border-zinc-800 dark:bg-zinc-900/90",
          hasGuestTab ? "grid-cols-3" : "grid-cols-2"
        )}
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "sign-in"}
          onClick={() => handleModeChange("sign-in")}
          className={cn(
            "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-all",
            mode === "sign-in"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          )}
        >
          <LogIn className="size-3.5" />
          <span>Sign In</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mode === "sign-up"}
          onClick={() => handleModeChange("sign-up")}
          className={cn(
            "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-all",
            mode === "sign-up"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          )}
        >
          <UserPlus className="size-3.5" />
          <span>Sign Up</span>
        </button>

        {hasGuestTab && (
          <button
            type="button"
            role="tab"
            aria-selected={mode === "guest"}
            onClick={() => handleModeChange("guest")}
            className={cn(
              "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-all",
              mode === "guest"
                ? "bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            )}
          >
            <HardDrive className="size-3.5" />
            <span>Guest Pass</span>
          </button>
        )}
      </div>

      {/* Dynamic Mode Context Header */}
      <div className="space-y-2.5">
        <div className="flex items-start gap-2.5">
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-xl border",
              headerConfig.iconBoxClass
            )}
          >
            <HeaderIcon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {headerConfig.heading}
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {headerConfig.subtitle}
            </p>
          </div>
        </div>

        {mode === "sign-up" && (
          <div className="flex flex-wrap items-center gap-1.5">
            {SIGN_UP_PERKS.map((perk) => (
              <span
                key={perk}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
              >
                <Check className="size-2.5" />
                {perk}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Guest Pass Mode */}
      {mode === "guest" ? (
        <form onSubmit={handleGuestContinue} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label
              htmlFor={`${formId}-guest-name`}
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
            >
              Guest Display Name
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-sky-600 dark:text-sky-400" />
              <Input
                id={`${formId}-guest-name`}
                placeholder="Guest Director"
                value={guestInputName}
                onChange={(e) => setGuestInputName(e.target.value)}
                maxLength={40}
                className="h-9.5 rounded-xl border-zinc-200 bg-white pl-9 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:border-sky-500/60 focus-visible:ring-sky-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
            </div>
          </div>

          <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 p-3 dark:border-sky-500/20 dark:bg-sky-950/20">
            <div className="flex items-center justify-between text-[11px] font-semibold text-sky-800 dark:text-sky-300">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="size-3.5" />
                Included in Guest Studio Pass
              </span>
              <span className="rounded-md bg-sky-500/15 px-1.5 py-0.5 font-mono text-[10px]">
                LOCAL ONLY
              </span>
            </div>
            <ul className="mt-2 space-y-1.5">
              {GUEST_CAPABILITIES.map((capability) => (
                <li
                  key={capability}
                  className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300"
                >
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400">
                    <Check className="size-2.5" />
                  </span>
                  <span>{capability}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2.5 border-t border-sky-500/15 pt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              Need cloud database sync or public{" "}
              <code className="font-mono text-zinc-700 dark:text-zinc-300">
                /watch
              </code>{" "}
              links?{" "}
              <button
                type="button"
                onClick={() => handleModeChange("sign-up")}
                className="font-semibold text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400"
              >
                Create a free Studio Account
              </button>
              .
            </p>
          </div>

          <Button
            type="submit"
            className="h-9.5 w-full gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 text-xs font-semibold text-white shadow-sm hover:from-sky-500 hover:to-teal-500"
          >
            <HardDrive className="size-3.5" />
            <span>{guestActionLabel}</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </form>
      ) : (
        /* Sign In & Sign Up Form */
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "sign-up" && (
            <div className="space-y-1.5">
              <Label
                htmlFor={`${formId}-name`}
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Display Name
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <Input
                  id={`${formId}-name`}
                  placeholder="Studio Director"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="h-9.5 rounded-xl border-zinc-200 bg-white pl-9 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:border-emerald-500/60 focus-visible:ring-emerald-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  autoComplete="name"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label
              htmlFor={`${formId}-email`}
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
            >
              Email Address
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
              <Input
                id={`${formId}-email`}
                type="email"
                placeholder="director@multistream.studio"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formError) setFormError(null);
                }}
                className="h-9.5 rounded-xl border-zinc-200 bg-white pl-9 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:border-emerald-500/60 focus-visible:ring-emerald-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label
                htmlFor={`${formId}-password`}
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Password
              </Label>
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                  mode === "sign-up"
                    ? passwordMetrics.hasMinLength
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-zinc-200/70 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    : "text-zinc-400 dark:text-zinc-500"
                )}
              >
                {mode === "sign-up"
                  ? passwordMetrics.hasMinLength
                    ? "8+ chars met"
                    : "Min 8 chars"
                  : "Account credentials"}
              </span>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
              <Input
                id={`${formId}-password`}
                type={showPassword ? "text" : "password"}
                placeholder={
                  mode === "sign-up"
                    ? "At least 8 characters"
                    : "Enter your password"
                }
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formError) setFormError(null);
                }}
                className="h-9.5 rounded-xl border-zinc-200 bg-white pr-9 pl-9 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:border-emerald-500/60 focus-visible:ring-emerald-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                autoComplete={
                  mode === "sign-up" ? "new-password" : "current-password"
                }
                minLength={mode === "sign-up" ? 8 : undefined}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                {showPassword ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
              </button>
            </div>

            {/* Live Password Strength Meter (Sign Up only) */}
            {mode === "sign-up" && (
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map((segment) => {
                    const active = passwordMetrics.score >= segment;
                    const barColor =
                      passwordMetrics.score <= 1
                        ? "bg-rose-500"
                        : passwordMetrics.score === 2
                          ? "bg-amber-500"
                          : passwordMetrics.score === 3
                            ? "bg-sky-500"
                            : "bg-emerald-500";
                    return (
                      <span
                        key={segment}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors duration-200",
                          active
                            ? barColor
                            : "bg-zinc-200 dark:bg-zinc-800"
                        )}
                      />
                    );
                  })}
                  <span className="ml-1.5 min-w-14 text-right text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                    {passwordMetrics.strengthLabel}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                      passwordMetrics.hasMinLength
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
                    )}
                  >
                    <Check className="size-2.5" />
                    8+ characters
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                      passwordMetrics.hasLetterAndNumber
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
                    )}
                  >
                    <Check className="size-2.5" />
                    Letters & numbers
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                      passwordMetrics.hasMinLength &&
                        Boolean(name.trim()) &&
                        Boolean(email.trim())
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
                    )}
                  >
                    <Check className="size-2.5" />
                    Ready to create
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Inline Error Banner */}
          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-950/35 dark:text-red-300"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isBusy}
            className="h-9.5 w-full gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-semibold text-white shadow-sm hover:from-emerald-500 hover:to-teal-500"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>
                  {mode === "sign-up"
                    ? "Creating Studio Account..."
                    : "Signing In..."}
                </span>
              </>
            ) : (
              <>
                {mode === "sign-up" ? (
                  <Sparkles className="size-3.5" />
                ) : (
                  <Lock className="size-3.5" />
                )}
                <span>
                  {mode === "sign-up"
                    ? "Create Studio Account"
                    : "Sign In to Studio"}
                </span>
                <ArrowRight className="size-3.5" />
              </>
            )}
          </Button>
        </form>
      )}

      {/* Optional Social OAuth (Google & GitHub) */}
      {mode !== "guest" && (googleAuthEnabled || githubAuthEnabled) && (
        <>
          <div className="relative flex items-center py-0.5">
            <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800" />
            <span className="px-2.5 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
              or continue with
            </span>
            <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800" />
          </div>

          <div className="flex flex-col gap-2">
            {googleAuthEnabled && (
              <div className="space-y-1">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isBusy}
                  onClick={handleGoogleSignIn}
                  className="h-9.5 w-full gap-2 rounded-xl border-zinc-200 bg-white text-xs font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <svg className="size-3.5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Sign in with Google & Sync YouTube</span>
                </Button>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 text-center">
                  One-click sign in & automatic YouTube subscriptions sync
                </p>
              </div>
            )}

            {githubAuthEnabled && (
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={handleGithubSignIn}
                className="h-9.5 w-full gap-2 rounded-xl border-zinc-200 bg-white text-xs font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                {isGithubLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-3.5"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
                  </svg>
                )}
                <span>Continue with GitHub</span>
              </Button>
            )}
          </div>

          {/* Legal Compliance Notice */}
          <div className="pt-0.5 text-center text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            By continuing, you agree to our{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-700 underline hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-700 underline hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
            >
              Privacy Policy
            </a>
            .
          </div>
        </>
      )}

      {/* Compact Footer Switcher (when Guest Pass tab is hidden in embedded modals) */}
      {!hasGuestTab && onContinueAsGuest && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200/80 bg-zinc-100/70 px-3 py-2 text-xs dark:border-zinc-800/80 dark:bg-zinc-900/60">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            <HardDrive className="size-3.5 text-sky-600 dark:text-sky-400" />
            Prefer no account?
          </span>
          <button
            type="button"
            disabled={isBusy}
            onClick={onContinueAsGuest}
            className="inline-flex items-center gap-1 font-semibold text-sky-600 transition hover:text-sky-500 disabled:opacity-50 dark:text-sky-400 dark:hover:text-sky-300"
          >
            <span>{guestActionLabel}</span>
            <ArrowRight className="size-3" />
          </button>
        </div>
      )}
    </div>
  );
}
