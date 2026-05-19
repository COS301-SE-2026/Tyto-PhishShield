import { useState } from 'react';

const colours = [
  ['Primary Navy', '#0F172A', 'Headers, sidebars, hero sections'],
  ['Accent Blue', '#2563EB', 'Buttons, links, focus states'],
  ['Accent Blue Hover', '#1D4ED8', 'Hover states'],
  ['Success Green', '#22C55E', 'XP gains and wins'],
  ['Warning Amber', '#F59E0B', 'Suspicion and warnings'],
  ['Danger Red', '#EF4444', 'Threats and errors'],
  ['Neutral Gray', '#64748B', 'Secondary text'],
  ['Light Blue Accent', '#60A5FA', 'Hero highlights'],
];

function App() {
  const [darkMode, setDarkMode] = useState(true);

  const page = darkMode
    ? 'bg-slate-950 text-slate-100'
    : 'bg-slate-50 text-slate-900';

  const surface = darkMode
    ? 'border-slate-800 bg-slate-900'
    : 'border-slate-200 bg-white';

  const mutedText = darkMode ? 'text-slate-400' : 'text-slate-500';
  const softSurface = darkMode ? 'bg-slate-900/70' : 'bg-white';
  const tableBorder = darkMode ? 'divide-slate-800' : 'divide-slate-200';

  return (
    <div className={`min-h-screen font-sans ${page}`}>
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-800 bg-[#0F172A] p-6 text-white lg:block">
        <div className="mb-10">
          <div className="text-xl font-bold tracking-tight">Tyto</div>
          <div className="mt-1 text-xs font-medium uppercase tracking-[0.24em] text-blue-300">
            PhishShield
          </div>
        </div>

        <nav className="space-y-2 text-sm">
          {['Brand', 'Colours', 'Typography', 'Components', 'Dashboard'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="block rounded-lg px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Security score
          </p>
          <p className="mt-2 text-2xl font-bold text-green-400">72%</p>
          <p className="mt-1 text-xs text-slate-400">Good awareness posture</p>
        </div>
      </aside>

      <main className="lg:ml-64">
        <header className="border-b border-slate-800 bg-gradient-to-r from-[#0F172A] to-slate-900 px-8 py-8 text-white">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">
                Tyto-PhishShield Design System
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                Design Specification Preview
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                A visual reference and preview for the current Tyto frontend design language:
                styling, semantic colours, compact dashboards and
                gamified security awareness patterns.
              </p>
            </div>

            <div className="flex items-center rounded-full border border-slate-700 bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => setDarkMode(false)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  !darkMode
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setDarkMode(true)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  darkMode
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Dark
              </button>
            </div>
          </div>
        </header>

        <section className="space-y-8 p-6 md:p-8">
          <section
            id="brand"
            className={`rounded-2xl border p-6 shadow-sm ${surface}`}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-500">
              Brand identity
            </p>
            <h2 className="text-2xl font-bold">
              Trustworthy. Intelligent. Protective. Motivating. Modern.
            </h2>
            <p className={`mt-3 max-w-3xl text-sm leading-6 ${mutedText}`}>
              The product should make employees part of the firewall by encouraging
              learning, confidence and fast reporting behaviour. Messaging should
              guide users without blame or fear-based language.
            </p>
          </section>

          <section
            id="colours"
            className={`rounded-2xl border p-6 shadow-sm ${surface}`}
          >
            <h2 className="mb-4 text-2xl font-bold">Colour System</h2>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {colours.map(([name, value, purpose]) => (
                <div
                  key={name}
                  className={`rounded-xl border p-4 ${
                    darkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div
                    className="mb-4 h-20 rounded-lg border border-black/10"
                    style={{ backgroundColor: value }}
                  />
                  <h3 className="font-semibold">{name}</h3>
                  <p className={`text-sm ${mutedText}`}>{value}</p>
                  <p className={`mt-1 text-sm ${mutedText}`}>{purpose}</p>
                </div>
              ))}
            </div>
          </section>

          <section
            id="typography"
            className={`rounded-2xl border p-6 shadow-sm ${surface}`}
          >
            <h2 className="mb-4 text-2xl font-bold">Typography</h2>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <h1 className="text-4xl font-extrabold tracking-tight">
                  Hero H1 / 32–50px
                </h1>
                <h2 className="text-3xl font-bold">H1 / 28–32px</h2>
                <h3 className="text-2xl font-bold">H2 / 22–24px</h3>
                <p className="text-base">Body / 14–16px</p>
                <p className={`text-xs ${mutedText}`}>Caption / 11–12px</p>
              </div>

              <div className={`rounded-xl border p-5 ${darkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                  Dashboard scale
                </p>
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Micro label
                    </p>
                    <p className="text-[13px] font-semibold">Compact dashboard body text</p>
                  </div>
                  <div>
                    <p className="text-[15px] font-bold">Dashboard title</p>
                    <p className={`text-[11px] ${mutedText}`}>Muted dashboard subtitle</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            id="components"
            className={`rounded-2xl border p-6 shadow-sm ${surface}`}
          >
            <h2 className="mb-4 text-2xl font-bold">UI Components</h2>

            <div className="flex flex-wrap gap-4">
              <button className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200">
                Primary
              </button>

              <button className="rounded-lg border border-blue-600 px-4 py-2 font-semibold text-blue-500 transition hover:bg-blue-600/10 focus:outline-none focus:ring-4 focus:ring-blue-200">
                Secondary
              </button>

              <button className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-200">
                Danger
              </button>

              <button className="rounded-lg px-4 py-2 font-semibold text-blue-500 transition hover:bg-blue-600/10 focus:outline-none focus:ring-4 focus:ring-blue-200">
                Ghost
              </button>

              <button
                disabled
                className="cursor-not-allowed rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white opacity-50"
              >
                Disabled
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <MetricCard
                darkMode={darkMode}
                title="Reported Emails"
                value="128"
                note="+12 this week"
              />
              <MetricCard
                darkMode={darkMode}
                title="Threats Detected"
                value="34"
                note="High confidence"
              />
              <MetricCard
                darkMode={darkMode}
                title="Training XP"
                value="8 450"
                note="Team improving"
              />
            </div>
          </section>

          <section
            id="dashboard"
            className={`rounded-2xl border p-6 shadow-sm ${surface}`}
          >
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Dashboard Layout Preview</h2>
                <p className={`mt-1 text-sm ${mutedText}`}>
                  Sidebar, topbar, metric cards, campaign table and leaderboard structure.
                </p>
              </div>
            </div>

            <div className={`overflow-hidden rounded-2xl border ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex min-h-[420px]">
                <div className="hidden w-20 bg-[#0F172A] md:block" />

                <div className={`flex-1 p-4 ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
                  <div className={`mb-4 flex h-12 items-center justify-between rounded-xl border px-4 ${
                    darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
                  }`}>
                    <div>
                      <div className="h-3 w-28 rounded bg-blue-500" />
                      <div className={`mt-2 h-2 w-20 rounded ${darkMode ? 'bg-slate-700' : 'bg-slate-300'}`} />
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-blue-600" />
                  </div>

                  <div className="mb-4 grid gap-4 md:grid-cols-3">
                    <DashboardCard darkMode={darkMode} label="Phishing Emails Sent" value="1,240" />
                    <DashboardCard darkMode={darkMode} label="Click Rate" value="8.4%" />
                    <DashboardCard darkMode={darkMode} label="Reports Filed" value="312" />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
                    <div className={`rounded-xl border p-4 ${softSurface} ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <h3 className="mb-4 text-sm font-bold">Campaign Report Table</h3>
                      <div className="overflow-hidden rounded-lg">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead>
                            <tr className={`border-b text-xs uppercase ${darkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-500'}`}>
                              <th className="py-3">User</th>
                              <th className="py-3">Department</th>
                              <th className="py-3">Status</th>
                              <th className="py-3">Risk</th>
                            </tr>
                          </thead>

                          <tbody className={`divide-y ${tableBorder}`}>
                            <TableRow user="Luke Skywalker" department="Finance" status="Completed" risk="Low" />
                            <TableRow user="Leia Organa" department="HR" status="In Progress" risk="Medium" />
                            <TableRow user="Darth Vader" department="Operations" status="Flagged" risk="High" />
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className={`rounded-xl border p-4 ${softSurface} ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <h3 className="mb-4 text-sm font-bold">Top Defenders</h3>
                      <div className="space-y-3">
                        {[
                          ['Master Yoda', '4 820 XP', '1'],
                          ['Luke Skywalker', '4 310 XP', '2'],
                          ['Obi-Wan Kenobi', '3 990 XP', '3'],
                        ].map(([name, xp, rank]) => (
                          <div key={rank} className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                              {rank}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{name}</p>
                              <p className={`text-xs ${mutedText}`}>{xp}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
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
  darkMode,
}: {
  title: string;
  value: string;
  note: string;
  darkMode: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-5 shadow-sm ${
        darkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'
      }`}
    >
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h2 className="mt-2 text-3xl font-extrabold">{value}</h2>
      <p className="mt-1 text-sm text-slate-500">{note}</p>
    </article>
  );
}

function DashboardCard({
  label,
  value,
  darkMode,
}: {
  label: string;
  value: string;
  darkMode: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
      }`}
    >
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
    </div>
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
    status === 'Completed'
      ? 'bg-green-500/15 text-green-500'
      : status === 'In Progress'
        ? 'bg-amber-500/15 text-amber-500'
        : 'bg-red-500/15 text-red-500';

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