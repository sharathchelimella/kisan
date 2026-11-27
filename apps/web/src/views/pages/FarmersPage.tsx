import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  farmerDirectoryQuerySchema,
  farmerWriteSchema,
  type Farmer,
  type FarmerInput,
} from "@kisan/contracts";
import { useFarmers } from "../../controllers/useFarmers";
import { farmersClient } from "../../services/farmers";
import { Button, Card, Field, Loading } from "../components/ui";

export function FarmersPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const parsed = farmerDirectoryQuerySchema.safeParse(
    Object.fromEntries(params),
  );
  const query = parsed.success
    ? parsed.data
    : farmerDirectoryQuerySchema.parse({});
  const state = useFarmers(query);
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.set(key, value);
    next.set("page", "1");
    setParams(next, { replace: true });
  }
  return (
    <section>
      <div className="farmer-heading">
        <h1>{t("pages.farmers.title")}</h1>
        <Link className="button farmer-action" to="/farmers/new">
          {t("farmers.add")}
        </Link>
      </div>
      <p>{t("pages.farmers.description")}</p>
      <div className="farmer-filters">
        <Field
          label={t("farmers.search")}
          value={query.q ?? ""}
          onChange={(event) => filter("q", event.target.value)}
          type="search"
        />
        <Field
          label={t("farmers.village")}
          value={query.village ?? ""}
          onChange={(event) => filter("village", event.target.value)}
        />
        <label className="farmer-checkbox">
          <input
            type="checkbox"
            checked={query.archived === "true"}
            onChange={(event) =>
              filter("archived", String(event.target.checked))
            }
          />
          {t("farmers.archived")}
        </label>
      </div>
      {state.loading && <Loading />}
      {state.error && (
        <div role="alert">
          <p>{t("farmers.error")}</p>
          <Button onClick={state.refresh}>{t("auth.retry")}</Button>
        </div>
      )}
      {state.data && (
        <>
          {state.data.items.length === 0 ? (
            <Card className="farmer-card">{t("farmers.empty")}</Card>
          ) : (
            <>
              <div className="farmer-table-heading" aria-hidden="true">
                <span>{t("farmers.name")}</span>
                <span>{t("farmers.village")}</span>
                <span>{t("farmers.mobile")}</span>
              </div>
              <ul className="farmer-list">
                {state.data.items.map((farmer) => (
                  <li key={farmer.id}>
                    <Link
                      className="card farmer-row"
                      to={"/farmers/" + farmer.id}
                    >
                      <strong>{farmer.name}</strong>
                      <span>{farmer.village}</span>
                      <span>{farmer.mobile || t("farmers.noPhone")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <nav
            className="farmer-pagination"
            aria-label={t("farmers.pagination")}
          >
            <Button
              disabled={query.page <= 1}
              onClick={() =>
                setParams({
                  ...Object.fromEntries(params),
                  page: String(query.page - 1),
                })
              }
            >
              {t("farmers.previous")}
            </Button>
            <span>
              {t("farmers.page", {
                page: query.page,
                total: Math.max(
                  1,
                  Math.ceil(state.data.total / query.pageSize),
                ),
              })}
            </span>
            <Button
              disabled={query.page * query.pageSize >= state.data.total}
              onClick={() =>
                setParams({
                  ...Object.fromEntries(params),
                  page: String(query.page + 1),
                })
              }
            >
              {t("farmers.next")}
            </Button>
          </nav>
        </>
      )}
    </section>
  );
}

function FarmerEditor({
  farmer,
  onSave,
  onCancel,
}: {
  farmer?: Farmer;
  onSave: (value: Farmer) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const form = useForm<FarmerInput>({
    resolver: zodResolver(farmerWriteSchema),
    defaultValues: {
      name: farmer?.name ?? "",
      village: farmer?.village ?? "",
      mobile: farmer?.mobile ?? "",
      notes: farmer?.notes ?? "",
    },
  });
  const [matches, setMatches] = useState<Farmer[]>([]);
  const [pending, setPending] = useState<FarmerInput>();
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  async function save(input: FarmerInput) {
    setBusy(true);
    setFailed(false);
    try {
      onSave(await farmersClient.save(input, farmer?.id));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  const submit = form.handleSubmit(async (input) => {
    setFailed(false);
    setPending(undefined);
    try {
      const duplicates = await farmersClient.matches({
        name: input.name,
        village: input.village,
        mobile: input.mobile,
        excludeId: farmer?.id,
      });
      setMatches(duplicates);
      if (duplicates.length) setPending(input);
      else await save(input);
    } catch {
      setFailed(true);
    }
  });
  const disabled = busy || form.formState.isSubmitting;
  return (
    <form
      className="auth-form"
      onSubmit={submit}
      noValidate
      onChange={() => {
        setPending(undefined);
        setMatches([]);
      }}
    >
      {(["name", "village", "mobile", "notes"] as const).map((name) => (
        <Field
          key={name}
          label={t(`farmers.${name}`)}
          {...form.register(name)}
          disabled={disabled}
          type={name === "mobile" ? "tel" : "text"}
          error={form.formState.errors[name] ? t("auth.checkField") : undefined}
        />
      ))}
      {failed && (
        <p role="alert" className="field-error">
          {t("farmers.error")}
        </p>
      )}
      {pending && (
        <div role="status" className="duplicate-warning">
          <p>{t("farmers.duplicate")}</p>
          <ul>
            {matches.map((match) => (
              <li key={match.id}>
                <Link className="auth-link" to={"/farmers/" + match.id}>
                  {match.name} · {match.village}
                  {match.archivedAt ? " · " + t("farmers.archived") : ""}
                </Link>
              </li>
            ))}
          </ul>
          <Button disabled={disabled} onClick={() => void save(pending)}>
            {t("farmers.saveAnyway")}
          </Button>
        </div>
      )}
      <div className="farmer-actions">
        <Button type="submit" busy={disabled}>
          {t("farmers.save")}
        </Button>
        <Button disabled={disabled} onClick={onCancel}>
          {t("farmers.cancel")}
        </Button>
      </div>
    </form>
  );
}

export function NewFarmerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <section>
      <h1>{t("farmers.add")}</h1>
      <Card className="farmer-card">
        <FarmerEditor
          onSave={(farmer) =>
            navigate("/farmers/" + farmer.id, { replace: true })
          }
          onCancel={() => navigate("/farmers")}
        />
      </Card>
    </section>
  );
}

function FarmerDetails({ farmer: initial }: { farmer: Farmer }) {
  const { t } = useTranslation();
  const [farmer, setFarmer] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function archive() {
    setBusy(true);
    setError(false);
    try {
      setFarmer(await farmersClient.archive(farmer.id));
      setConfirm(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <Link className="auth-link" to="/farmers">
        {t("farmers.back")}
      </Link>
      <h1>{farmer.name}</h1>
      <Card className="farmer-card">
        {editing ? (
          <FarmerEditor
            farmer={farmer}
            onSave={(value) => {
              setFarmer(value);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            {farmer.archivedAt && (
              <p className="duplicate-warning">{t("farmers.archived")}</p>
            )}
            <dl className="auth-form">
              <div>
                <dt>{t("farmers.village")}</dt>
                <dd>{farmer.village}</dd>
              </div>
              <div>
                <dt>{t("farmers.mobile")}</dt>
                <dd>{farmer.mobile || t("farmers.noPhone")}</dd>
              </div>
              {farmer.notes && (
                <div>
                  <dt>{t("farmers.notes")}</dt>
                  <dd>{farmer.notes}</dd>
                </div>
              )}
            </dl>
            {!farmer.archivedAt && !confirm && (
              <div className="farmer-actions">
                <Button onClick={() => setEditing(true)}>
                  {t("farmers.edit")}
                </Button>
                <Button onClick={() => setConfirm(true)}>
                  {t("farmers.archive")}
                </Button>
              </div>
            )}
            {confirm && (
              <div className="auth-form">
                <p>{t("farmers.confirmArchive")}</p>
                <div className="farmer-actions">
                  <Button busy={busy} onClick={() => void archive()}>
                    {t("farmers.archive")}
                  </Button>
                  <Button disabled={busy} onClick={() => setConfirm(false)}>
                    {t("farmers.cancel")}
                  </Button>
                </div>
              </div>
            )}
            {error && (
              <p role="alert" className="field-error">
                {t("farmers.error")}
              </p>
            )}
          </>
        )}
      </Card>
    </section>
  );
}

export function FarmerProfilePage() {
  const { id = "" } = useParams();
  const { t } = useTranslation();
  const [state, setState] = useState<{
    id: string;
    farmer?: Farmer;
    error?: boolean;
  }>({ id });
  const [attempt, retry] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ id });
    void farmersClient.get(id).then(
      (farmer) => {
        if (active) setState({ id, farmer });
      },
      () => {
        if (active) setState({ id, error: true });
      },
    );
    return () => {
      active = false;
    };
  }, [id, attempt]);
  if (state.id !== id) return <Loading />;
  if (state.error)
    return (
      <section>
        <Link className="auth-link" to="/farmers">
          {t("farmers.back")}
        </Link>
        <p role="alert">{t("farmers.unavailable")}</p>
        <Button onClick={() => retry((value) => value + 1)}>
          {t("auth.retry")}
        </Button>
      </section>
    );
  return state.farmer ? (
    <FarmerDetails key={id + attempt} farmer={state.farmer} />
  ) : (
    <Loading />
  );
}
