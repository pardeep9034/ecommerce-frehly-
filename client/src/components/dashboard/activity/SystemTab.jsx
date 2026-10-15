import { Note } from "./LogParts";

// Nothing feeds this tab yet: service errors and warnings only go to each container's console and log files.
const WILL_SHOW = [
  ["Time and level", "Warning or error, to the second."],
  ["Service", "Which of the eleven services wrote it."],
  ["Message", "What went wrong, with secrets and query strings removed."],
  ["Request id", "One id that follows a request from the gateway through every service it touched."],
];

const SystemTab = () => (
  <div className="space-y-4">
    <Note tone="warning">
      <strong>System logs are not collected yet.</strong> Errors and warnings from the services exist only in each container's console and log files, so there is nothing for this page to read.
      The plan for collecting them is in <span className="font-mono">ACTIVITY_LOG_DESIGN.md</span>.
    </Note>

    <section className="rounded-xl border border-border bg-white p-5 shadow-card">
      <h2 className="font-display text-base font-semibold text-foreground">What this tab will show</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {WILL_SHOW.map(([title, text]) => (
          <div key={title}>
            <dt className="text-sm font-medium text-foreground">{title}</dt>
            <dd className="mt-0.5 text-sm text-muted-foreground">{text}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 text-sm text-muted-foreground">Until then, read a service's log from the server with <span className="font-mono">docker compose logs &lt;service&gt;</span>.</p>
    </section>
  </div>
);

export default SystemTab;
