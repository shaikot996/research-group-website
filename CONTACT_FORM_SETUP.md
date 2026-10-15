# SAM contact form — deploy in one Google Apps Script file

## Architecture

GitHub Pages publishes **static HTML** and intentionally removes Next.js hydration scripts.
Therefore the original React onSubmit handler never executes on the live website.
The secure form instead lives inside Google Apps Script HtmlService and uses
`google.script.run.saveSubmission(form)` with the actual HTML form as the only argument.

This transfers the optional PDF as a Google Apps Script Blob, runs validation
and Drive writes server-side, and shows **real confirmation** only after
`saveSubmission()` returns successfully. No cross-origin CORS hacks, no public
Drive file links, and no credentials shipped to the browser.

### One-time owner-only steps

1. As the Google account **owning the private SAM Drive folder**, open
   https://script.google.com/home/projects/create
2. Replace `Code.gs` entirely with the file
   [`scripts/sam-contact-receiver.gs`](scripts/sam-contact-receiver.gs) and save.
   The destination is already set to the private Contact Responses folder:
   https://drive.google.com/drive/folders/1LQDh6HGkzjQHxqtpc4TtHSsLiv3kipK-
3. In **Deploy > New deployment > Web app** set:
   - Execute as **Me**
   - Who has access **Anyone**
   - Deploy and authorize the Drive permission prompts.
   If a university Workspace policy blocks anonymous Apps Script web apps,
   ask the workspace admin or use a Google account that permits anonymous Apps Script web apps.
4. Copy the **/exec** deployment URL. In GitHub repository Settings >
   Secrets and variables > Actions > Variables, create/update:
   `SAM_CONTACT_ENDPOINT=https://script.google.com/macros/s/DEPLOYMENT_ID/exec`
5. Trigger workflow **Sync Drive profiles and publish demo** in GitHub Actions
   or push to `main`. The build uses `NEXT_PUBLIC_SAM_CONTACT_ENDPOINT`.
6. Open https://sam.cse.bracu.ac.bd/contact/ and submit a test with a PDF.
   The web form must return `Received successfully. Reference: SAM-...`.
   Confirm that a folder containing **Response.txt** and **CV.pdf** appears
   in Contact Responses. Test no-CV submission separately.
   
## Controls

- Full name, email, inquiry type and message are mandatory.
- CV optional, at most 5 MiB, magic bytes must start with `%PDF-`.
- One timestamped person-specific folder per accepted submission.
- File validation happens *before* folder creation.
- A honeypot catches trivial form automation.
- Private Drive folder access remains owner controlled; do **not** share it publicly.
- A publicly accessible intake app can still be spammed. If necessary, place
  rate limiting and CAPTCHA in front of the intake before promoting widely.

## Connecting from ChatGPT

The existing Google Drive/GitHub connectors cannot create or deploy an Apps
Script Web App, nor write GitHub Actions variables. The **one-time deployment**
above needs the account owner's authorization. All subsequent file storage is automatic.
