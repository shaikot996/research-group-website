import type { Metadata } from "next";
// This Apps Script URL is intentionally public: the form is an embedded intake page.
// A repository variable may override it for future Google Apps Script deployments.
const DEFAULT_CONTACT_ENDPOINT = "https://script.google.com/macros/s/AKfycbyC9qstSB5g0Epdh5j6xA0TAB6Q7jOUU8Hdecm90SJjMYeKWqUC8FZuO_C79t8TStc/exec";
const rawEndpoint = process.env.NEXT_PUBLIC_SAM_CONTACT_ENDPOINT?.trim() || DEFAULT_CONTACT_ENDPOINT;
const endpoint = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec(?:\?.*)?$/.test(rawEndpoint) ? rawEndpoint : "";

export const metadata: Metadata = {
  title: "Contact SAM Research Group",
  description: "Contact SAM at BRAC University about undergraduate research, research collaborations, and seminar inquiries.",
  alternates: { canonical: "/contact/" },
};

export function ContactForm() {
  return <section aria-label="Contact SAM" className="border-t-2 academic-rule pt-6">
    <h2 className="font-serif text-3xl">Send an inquiry</h2>
    <p className="mt-3 mb-5 text-sm leading-7 text-muted">
      Introduce yourself and your research interests. You can attach a PDF CV (up to 5 MB).
      Submissions are stored in the group's private Google Drive.
    </p>
    {endpoint ? (
      <iframe
        title="SAM research inquiry and CV upload"
        src={endpoint}
        loading="lazy"
        className="w-full border academic-rule bg-[#0c111a]"
        style={{minHeight:"700px",height:"730px"}}
        referrerPolicy="no-referrer"
      />
    ) : (
      <div className="border academic-rule px-5 py-6">
        <p className="text-sm text-muted">
          The secure submission service is being activated. Please use one of the email contacts below until it is available.
        </p>
      </div>
    )}
  </section>;
}
