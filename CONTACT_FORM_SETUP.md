# Contact Responses — Deployment

Private Drive folder: https://drive.google.com/drive/folders/1LQDh6HGkzjQHxqtpc4TtHSsLiv3kipK-

1. Create an Apps Script project as the SAM Google Drive owner; paste `scripts/sam-contact-receiver.gs`.
2. Under Script Properties, set `SAM_CONTACT_FOLDER_ID=1LQDh6HGkzjQHxqtpc4TtHSsLiv3kipK-`.
3. Deploy as Web App (execute as owner). Anonymous visitors must be allowed to POST, but no Drive folder must be made publicly readable.
4. Set repository Actions variable `SAM_CONTACT_ENDPOINT` to the Apps Script deployed /exec endpoint. Redeploy website.
5. Run a test submission, inspect whether a uniquely timestamped applicant folder and Response.txt + PDF appear, and test a rejected bad PDF.

The form remains disabled until the endpoint variable exists. On cross-origin Apps Script responses, browsers generally cannot read the actual response, so client UI must not promise verified delivery. For stronger delivery receipts, spam control, abuse throttling and secure uploads, deploy a trusted same-origin proxy and return proper JSON / CAPTCHA checks.

Google Drive files saved by Apps Script are private to folder permissions, but anyone with the receiver endpoint may submit. Don't embed Google credentials in the website or commit private Drive file contents.
