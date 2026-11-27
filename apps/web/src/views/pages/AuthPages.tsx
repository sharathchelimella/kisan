import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useState, type ReactNode } from "react";
import {
  languageSchema,
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
  type Session,
} from "@kisan/contracts";
import { authClient } from "../../services/auth";
import { LanguagePicker } from "../layouts/AppLayout";
import { Brand } from "../components/Navigation";
import { Button, Card, Field } from "../components/ui";

type AuthLabel =
  | "email"
  | "password"
  | "displayName"
  | "businessName"
  | "village"
  | "verificationCode";
type AuthError = "invalid" | "unavailable" | "rejected";

function AuthField<T extends FieldValues>({
  form,
  name,
  label,
  type = "text",
  autoComplete,
}: {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  label: AuthLabel;
  type?: string;
  autoComplete?: string;
}) {
  const { t } = useTranslation();
  const invalid = form.getFieldState(name, form.formState).invalid;
  // Pass React Hook Form's ref through to the input (React 19).
  return (
    <Field
      label={t(`auth.${label}`)}
      type={type}
      autoComplete={autoComplete}
      error={invalid ? t("auth.checkField") : undefined}
      {...form.register(name)}
    />
  );
}

export function AuthPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-page">
      <div className="auth-heading">
        <Brand />
        <LanguagePicker />
      </div>
      <Card className="auth-card">
        <h1>{title}</h1>
        {children}
      </Card>
    </main>
  );
}

export function LoginPage({
  onSession,
}: {
  onSession: (session: Session) => void;
}) {
  const { t, i18n } = useTranslation();
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const [error, setError] = useState<AuthError>();
  const navigate = useNavigate();
  const submit = form.handleSubmit(async (input) => {
    setError(undefined);
    try {
      const session = await authClient.login(input);
      await i18n.changeLanguage(session.owner.preferredLanguage);
      onSession(session);
      navigate("/dashboard", { replace: true });
    } catch (reason) {
      setError(
        reason instanceof Error && reason.message === "INVALID_CREDENTIALS"
          ? "invalid"
          : "unavailable",
      );
    }
  });
  return (
    <AuthPanel title={t("auth.login")}>
      <form className="auth-form" onSubmit={submit} noValidate>
        <AuthField
          form={form}
          name="email"
          label="email"
          type="email"
          autoComplete="email"
        />
        <AuthField
          form={form}
          name="password"
          label="password"
          type="password"
          autoComplete="current-password"
        />
        {error && (
          <p role="alert" className="field-error">
            {t(`auth.${error}`)}
          </p>
        )}
        <Button type="submit" busy={form.formState.isSubmitting}>
          {t("auth.login")}
        </Button>
        <Link className="auth-link" to="/register">
          {t("auth.register")}
        </Link>
        <p>{t("auth.recovery")}</p>
      </form>
    </AuthPanel>
  );
}

export function RegisterPage() {
  const { t, i18n } = useTranslation();
  const language = languageSchema.safeParse(i18n.resolvedLanguage);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      preferredLanguage: language.success ? language.data : "en",
    },
  });
  const [error, setError] = useState<AuthError>();
  const [registered, setRegistered] = useState(false);
  const submit = form.handleSubmit(async (input) => {
    setError(undefined);
    try {
      const preferred = languageSchema.safeParse(i18n.resolvedLanguage);
      await authClient.register({
        ...input,
        preferredLanguage: preferred.success ? preferred.data : "en",
      });
      form.reset();
      setRegistered(true);
    } catch (reason) {
      setError(
        reason instanceof Error && reason.message === "REGISTRATION_REJECTED"
          ? "rejected"
          : "unavailable",
      );
    }
  });
  return (
    <AuthPanel title={t("auth.register")}>
      {registered ? (
        <p role="status">{t("auth.registered")}</p>
      ) : (
        <form className="auth-form" onSubmit={submit} noValidate>
          <AuthField
            form={form}
            name="displayName"
            label="displayName"
            autoComplete="name"
          />
          <AuthField
            form={form}
            name="businessName"
            label="businessName"
            autoComplete="organization"
          />
          <AuthField form={form} name="village" label="village" />
          <AuthField
            form={form}
            name="email"
            label="email"
            type="email"
            autoComplete="email"
          />
          <AuthField
            form={form}
            name="password"
            label="password"
            type="password"
            autoComplete="new-password"
          />
          <p>{t("auth.passwordHint")}</p>
          <AuthField
            form={form}
            name="verificationCode"
            label="verificationCode"
            autoComplete="one-time-code"
          />
          <p>{t("auth.codeHint")}</p>
          {error && (
            <p role="alert" className="field-error">
              {t(`auth.${error}`)}
            </p>
          )}
          <Button type="submit" busy={form.formState.isSubmitting}>
            {t("auth.register")}
          </Button>
        </form>
      )}
      <Link className="auth-link" to="/login">
        {t("auth.login")}
      </Link>
    </AuthPanel>
  );
}

export function ProfilePage({
  session,
  onLogout,
}: {
  session: Session;
  onLogout: () => void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function logout() {
    setBusy(true);
    setFailed(false);
    try {
      await authClient.logout();
      onLogout();
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }
  return (
    <section aria-labelledby="profile-heading">
      <h1 id="profile-heading">{t("auth.profile")}</h1>
      <Card className="auth-card">
        <dl className="auth-form">
          <div>
            <dt>{t("auth.displayName")}</dt>
            <dd>{session.owner.displayName}</dd>
          </div>
          {session.owner.email && (
            <div>
              <dt>{t("auth.email")}</dt>
              <dd>{session.owner.email}</dd>
            </div>
          )}
          <div>
            <dt>{t("auth.businessName")}</dt>
            <dd>{session.business.name}</dd>
          </div>
          <div>
            <dt>{t("auth.village")}</dt>
            <dd>{session.business.village}</dd>
          </div>
        </dl>
        {failed && (
          <p role="alert" className="field-error">
            {t("auth.unavailable")}
          </p>
        )}
        <Button busy={busy} onClick={() => void logout()}>
          {t("auth.logout")}
        </Button>
      </Card>
    </section>
  );
}
