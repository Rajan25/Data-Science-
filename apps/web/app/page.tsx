export const dynamic = "force-dynamic";

type HealthResponse = {
  status: string;
  service: string;
  databaseTime?: string | null;
};

async function getHealth(path: string): Promise<HealthResponse | { error: string }> {
  const baseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:3001";
  try {
    const res = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
    if (!res.ok) {
      return { error: `${res.status} ${res.statusText}` };
    }
    return (await res.json()) as HealthResponse;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "unknown error" };
  }
}

export default function HomePage() {
  const apiHealthPromise = getHealth("/health");
  const dbHealthPromise = getHealth("/health/db");

  return (
    <Page apiHealthPromise={apiHealthPromise} dbHealthPromise={dbHealthPromise} />
  );
}

async function Page({
  apiHealthPromise,
  dbHealthPromise
}: {
  apiHealthPromise: Promise<HealthResponse | { error: string }>;
  dbHealthPromise: Promise<HealthResponse | { error: string }>;
}) {
  const [apiHealth, dbHealth] = await Promise.all([apiHealthPromise, dbHealthPromise]);

  return (
    <main style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>LinkedIn Automation</h1>
      <p>Execution baseline is ready. Week 1 core services are active.</p>
      <section style={{ marginTop: 24 }}>
        <h2>Operator Status</h2>
        <ul>
          <li>
            API Health: {"error" in apiHealth ? `unreachable (${apiHealth.error})` : apiHealth.status}
          </li>
          <li>
            DB Health: {"error" in dbHealth ? `unreachable (${dbHealth.error})` : dbHealth.status}
          </li>
          <li>
            DB Time: {"error" in dbHealth ? "n/a" : dbHealth.databaseTime ?? "n/a"}
          </li>
        </ul>
      </section>
    </main>
  );
}
