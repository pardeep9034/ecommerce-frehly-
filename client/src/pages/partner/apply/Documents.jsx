import { Check, FileText } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { ApplySteps } from "@/components/partner/PartnerBits";
import { notify } from "@/lib/notify";
import { DOC_UPLOADS } from "@/lib/partnerDemoData";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const Documents = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState({});
  const [agreed, setAgreed] = useState(false);

  const pick = (key, file) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) return notify.error("Files must be 5 MB or smaller");
    setFiles((f) => ({ ...f, [key]: file.name }));
  };
  const missing = DOC_UPLOADS.filter((d) => !d.optional && !files[d.key]);

  const submit = () => {
    notify.notWired("Submitting applications");
    navigate("/partner/apply/status");
  };

  return (
    <MobileShell back="/partner/apply" title="Upload documents" subtitle="Step 2 of 3 · photos or PDF, max 5 MB">
      <ApplySteps current={2} />
      <ul className="space-y-2.5">
        {DOC_UPLOADS.map((d) => (
          <li key={d.key}>
            <label className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border border-border bg-white p-3 shadow-card">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${files[d.key] ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                {files[d.key] ? <Check className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{d.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{files[d.key] ? `${files[d.key]} · tap to replace` : d.hint}</span>
              </span>
              {!files[d.key] && <span className="text-sm font-semibold text-primary">Upload</span>}
              <input type="file" accept="image/*,.pdf" className="sr-only" onChange={(e) => pick(d.key, e.target.files[0])} />
            </label>
          </li>
        ))}
      </ul>

      <label className="flex items-start gap-3 text-sm text-foreground">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
        I agree to identity and background verification by Freshly.
      </label>

      <button
        type="button"
        disabled={!agreed || missing.length > 0}
        onClick={submit}
        className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-border disabled:text-muted-foreground"
      >
        Submit application
      </button>
      {missing.length > 0 && <p className="text-center text-xs text-muted-foreground">Still needed: {missing.map((d) => d.label).join(", ")}</p>}
    </MobileShell>
  );
};

export default Documents;
