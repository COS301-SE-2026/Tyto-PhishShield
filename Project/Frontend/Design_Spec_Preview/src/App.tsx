const colours = [
  ["Primary Navy", "#0F172A", "Headers / navbars"],
  ["Accent Blue", "#2563EB", "Buttons / links"],
  ["Success Green", "#22C55E", "XP gains / wins"],
  ["Warning Amber", "#F59E0B", "Suspicion"],
  ["Danger Red", "#EF4444", "Threats / danger"],
  ["Neutral Gray", "#64748B", "Secondary text"],
];

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 bg-slate-950 p-6 text-white lg:block">
        <div className="mb-10 text-xl font-bold">🛡️ PhishShield</div>

        <nav className="space-y-2 text-sm">
          {["Colours", "Typography", "Buttons", "Cards", "Table", "Dashboard"].map(
            (item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="block rounded-lg px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {item}
              </a>
            )
          )}
        </nav>
      </aside>

      <main className="lg:ml-64">
        <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-8 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Design Specification Preview
            </h1>
            <p className="mt-2 text-slate-500">
              A small visual reference for the PhishShield design system.
            </p>
          </div>

          <button className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200">
            Report Phish
          </button>
        </header>

        <section className="space-y-6 p-6 md:p-8">
          <section className="rounded-2xl border-l-4 border-blue-600 bg-white p-6 shadow-sm">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
              Brand personality
            </p>
            <h2 className="text-2xl font-bold">
              Trustworthy. Intelligent. Protective. Motivating. Modern.
            </h2>
            <p className="mt-3 max-w-3xl text-slate-500">
              The interface should encourage users instead of blaming them.
              Example tone: “Well done! You identified a phishing attempt.”
            </p>
          </section>

          <section id="colours" className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">Colour System</h2>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {colours.map(([name, value, purpose]) => (
                <div
                  key={name}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div
                    className="mb-4 h-20 rounded-lg"
                    style={{ backgroundColor: value }}
                  />
                  <h3 className="font-semibold">{name}</h3>
                  <p className="text-sm text-slate-500">{value}</p>
                  <p className="mt-1 text-sm text-slate-500">{purpose}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="typography" className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">Typography</h2>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold">H1 / 32px</h1>
              <h2 className="text-2xl font-bold">H2 / 24px</h2>
              <h3 className="text-xl font-semibold">H3 / 20px</h3>
              <p className="text-base text-slate-500">
                Body / 16px — clear, helpful, encouraging and professional.
              </p>
              <p className="text-xs text-slate-500">Caption / 12px</p>
            </div>
          </section>

          <section id="buttons" className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">Buttons</h2>

            <div className="flex flex-wrap gap-4">
              <button className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200">
                Primary
              </button>

              <button className="rounded-lg border border-blue-600 px-4 py-2 font-semibold text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-200">
                Secondary
              </button>

              <button className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-200">
                Danger
              </button>

              <button className="rounded-lg px-4 py-2 font-semibold text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-200">
                Ghost
              </button>

              <button
                disabled
                className="cursor-not-allowed rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white opacity-50"
              >
                Disabled
              </button>
            </div>
          </section>

          <section id="cards" className="grid gap-4 md:grid-cols-3">
            <MetricCard title="Reported Emails" value="128" note="+12 this week" />
            <MetricCard title="Threats Detected" value="34" note="High confidence" />
            <MetricCard title="Training XP" value="8 450" note="Team improving" />
          </section>

          <section id="table" className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">Campaign Report Table</h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="py-3">User</th>
                    <th className="py-3">Department</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Risk</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  <TableRow user="Luke Skywalker" department="Finance" status="Completed" risk="Low" />
                  <TableRow user="Leia Organa" department="HR" status="In Progress" risk="Medium" />
                  <TableRow user="Darth Vader" department="Operations" status="Flagged" risk="High" />
                </tbody>
              </table>
            </div>
          </section>

          <section id="dashboard" className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">Dashboard Layout Preview</h2>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="flex h-72">
                <div className="w-20 bg-slate-950" />
                <div className="flex-1 bg-slate-50 p-4">
                  <div className="mb-4 h-10 rounded-lg bg-white shadow-sm" />
                  <div className="mb-4 grid grid-cols-3 gap-4">
                    <div className="h-16 rounded-lg bg-white shadow-sm" />
                    <div className="h-16 rounded-lg bg-white shadow-sm" />
                    <div className="h-16 rounded-lg bg-white shadow-sm" />
                  </div>
                  <div className="h-28 rounded-lg bg-white shadow-sm" />
                </div>
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function MetricCard({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <article className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h2 className="mt-2 text-3xl font-bold">{value}</h2>
      <p className="mt-1 text-sm text-slate-500">{note}</p>
    </article>
  );
}

function TableRow({
  user,
  department,
  status,
  risk,
}: {
  user: string;
  department: string;
  status: string;
  risk: string;
}) {
  const statusClass =
    status === "Completed"
      ? "bg-green-100 text-green-700"
      : status === "In Progress"
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";

  return (
    <tr>
      <td className="py-4 font-medium">{user}</td>
      <td className="py-4 text-slate-500">{department}</td>
      <td className="py-4">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}>
          {status}
        </span>
      </td>
      <td className="py-4 text-slate-500">{risk}</td>
    </tr>
  );
}

export default App;