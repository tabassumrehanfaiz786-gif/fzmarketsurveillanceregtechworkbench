// Browser-only: render a STOR draft as an FCA-style Annex I PDF.
import type { StorDraft } from "./stor";

export async function downloadStorPdf(d: StorDraft) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 18;
  const line = (t: string, size = 10, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size);
    for (const l of doc.splitTextToSize(t, 180) as string[]) { if (y > 280) { doc.addPage(); y = 18; } doc.text(l, 15, y); y += size * 0.5; }
    y += 1.5;
  };
  line("SUSPICIOUS TRANSACTION AND ORDER REPORT (DRAFT)", 14, true);
  line("Format modelled on Annex I, Commission Implementing Regulation (EU) 2016/378 · UK MAR Art 16 · FCA SUP 15.10", 8);
  line(`Reference: ${d.ref}    Created (UTC): ${d.createdAt}`, 9);
  y += 3;
  line("SECTION 1 — REPORTING ENTITY", 11, true); line("Name: ____________________   Role: research workbench (not a regulated firm)   Contact: ____________________");
  line("SECTION 2 — TRANSACTION / ORDER", 11, true); line(`Venue: ${d.venue}   Instrument: ${d.instrument}   Asset class: crypto spot (outside UK MAR scope; used as a research analogue)`);
  line("SECTION 3 — DESCRIPTION OF SUSPICION", 11, true); line(`Suspected typology: ${d.suspicion}   Indicator score: ${d.score.toFixed(2)}`);
  for (const r of d.reasons) line(`• ${r}`);
  line(d.narrative);
  line("SECTION 4 — PERSONS INVOLVED", 11, true); line("Unknown. Public anonymous feed; no participant is identified.");
  line("SECTION 5 — STATUTORY BASIS", 11, true); line("UK MAR Art 12 (market manipulation), Art 14 (insider dealing), Art 16(2) (detection and reporting); FCA SUP 15.10.");
  line("SECTION 6 — COMPLIANCE OFFICER REVIEW", 11, true);
  line("Reasonable suspicion formed:  [ ] Yes   [ ] No        Submitted to FCA:  [ ] Yes   [ ] No");
  line("Name: ____________________   Signature: ____________________   Date: ____________");
  y += 4; line("Statistical estimate generated automatically. Not filed with any regulator.", 8);
  doc.save(`${d.ref}.pdf`);
}
