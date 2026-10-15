/**
 * SAM CONTACT RESPONSES — ONE-FILE GOOGLE APPS SCRIPT WEB APP
 * 1. Open script.google.com/home/projects/create and replace Code.gs with this file.
 * 2. Deploy > New deployment > Web app.
 * 3. Execute as: Me; access: Anyone (not "Anyone with Google account").
 * 4. Copy the /exec URL to GitHub variable SAM_CONTACT_ENDPOINT; publish the site.
 *
 * Google Docs/Drive write permissions never become public; only submissions are
 * accepted through the Apps Script executor. The parent folder stays private.
 */
var SAM_CONTACT_FOLDER_ID = "1LQDh6HGkzjQHxqtpc4TtHSsLiv3kipK-";
var SAM_CV_MAX_BYTES = 5 * 1024 * 1024;
var SAM_CONTACT_TYPES = [
  "Undergraduate research",
  "Research collaboration",
  "Seminar or visit",
  "General inquiry"
];

function doGet() {
  return HtmlService.createHtmlOutput("<!doctype html>\n<html lang=\"en\">\n<head>\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<base target=\"_top\">\n<style>\n:root{font-family:Arial,Helvetica,sans-serif;color-scheme:dark}\n*{box-sizing:border-box}\nbody{margin:0;background:#0c111a;color:#e6edf5;font-size:14px;line-height:1.55}\n.container{max-width:760px;padding:12px 14px 25px;margin:0 auto}\n.row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}\nlabel{display:block;margin-bottom:14px;font-weight:600;color:#edf0f6}\ninput,textarea,select{display:block;width:100%;padding:13px 14px;margin-top:6px;border:1px solid #465264;border-radius:3px;background:#171f2c;color:#edf0f6;font:inherit}\ntextarea{min-height:132px;resize:vertical}\ninput[type=file]{padding:11px}\ninput:focus,textarea:focus,select:focus{outline:2px solid #df9fa7;outline-offset:2px}\n.note{color:#afbac9;font-size:13px;margin:2px 0 20px}\nbutton{border:0;border-radius:2px;color:white;background:#9a293b;padding:13px 25px;font-weight:700;cursor:pointer}\nbutton[disabled]{opacity:.6;cursor:wait}\n#status{margin:16px 0 0;font-size:14px;min-height:25px}\n#status.ok{color:#9fe8af}\n#status.error{color:#ffbbc3}\n.hp{position:absolute;left:-10000px;top:-10000px}\n@media(max-width:560px){.row{grid-template-columns:1fr;gap:0}.container{padding:10px}}\n</style>\n</head>\n<body><div class=\"container\">\n<p class=\"note\">Research inquiries, undergraduate research, seminars and collaborations. Your response and optional CV will be stored privately in SAM's Google Drive.</p>\n<form id=\"sam-contact\" enctype=\"multipart/form-data\">\n<div class=\"hp\" aria-hidden=\"true\"><label>Website<input name=\"website\" tabindex=\"-1\" autocomplete=\"off\"></label></div>\n<div class=\"row\">\n<label>Full name *<input name=\"name\" autocomplete=\"name\" maxlength=\"120\" required></label>\n<label>Email address *<input name=\"email\" type=\"email\" autocomplete=\"email\" maxlength=\"180\" required></label>\n</div>\n<label>Inquiry type *\n<select name=\"topic\" required>\n<option value=\"Undergraduate research\">Undergraduate research</option>\n<option value=\"Research collaboration\">Research collaboration</option>\n<option value=\"Seminar or visit\">Seminar or visit</option>\n<option value=\"General inquiry\">General inquiry</option>\n</select></label>\n<label>Message *<textarea name=\"message\" required minlength=\"20\" maxlength=\"6000\" placeholder=\"Tell us about your research interests, background, or inquiry.\"></textarea></label>\n<label>CV (optional, PDF up to 5 MB)<input name=\"cv\" type=\"file\" accept=\".pdf,application/pdf\"></label>\n<button id=\"send\" type=\"submit\">Send inquiry</button>\n<p role=\"status\" aria-live=\"polite\" id=\"status\"></p>\n</form></div>\n<script>\n(function(){\n var form=document.getElementById('sam-contact');\n var status=document.getElementById('status');\n var button=document.getElementById('send');\n form.addEventListener('submit',function(event){\n   event.preventDefault();\n   if(!form.reportValidity())return;\n   var chosen=form.querySelector('[name=cv]').files;\n   if(chosen.length&&chosen[0].size>5*1024*1024){\n      status.className='error';status.textContent='CV must be 5 MB or smaller.';return;\n   }\n   button.disabled=true;status.className='';status.textContent='Submitting your inquiry…';\n   google.script.run.withSuccessHandler(function(result){\n      button.disabled=false;\n      if(result&&result.ok){\n        status.className='ok';\n        status.textContent='Received successfully. Reference: '+result.receipt+'. Please keep this number.';\n        form.reset();\n      }else{\n        status.className='error';status.textContent='The server did not confirm receipt. Please retry.';\n      }\n   }).withFailureHandler(function(error){\n     button.disabled=false;\n     status.className='error';\n     status.textContent='Submission failed. Please retry or email the group directly.';\n   }).saveSubmission(form);\n });\n}());\n</script></body></html>")
    .setTitle("Contact SAM Research Group")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function saveSubmission(fields) {
  if (!fields || typeof fields !== "object") throw Error("Invalid submission");
  if (String(fields.website || "").trim()) throw Error("Rejected");
  var name = String(fields.name || "").trim();
  var email = String(fields.email || "").trim();
  var topic = String(fields.topic || "").trim();
  var message = String(fields.message || "").trim();
  if (name.length < 2 || name.length > 120) throw Error("Invalid name");
  if (email.length > 180 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error("Invalid email");
  if (SAM_CONTACT_TYPES.indexOf(topic) === -1) throw Error("Invalid category");
  if (message.length < 20 || message.length > 6000) throw Error("Invalid message");
  var cv = fields.cv;
  var bytes = cv && typeof cv.getBytes === "function" ? cv.getBytes() : [];
  if (bytes.length > SAM_CV_MAX_BYTES) throw Error("CV exceeds 5 MB");
  if (bytes.length && (bytes.length < 5 || bytes[0] !== 37 || bytes[1] !== 80 ||
      bytes[2] !== 68 || bytes[3] !== 70 || bytes[4] !== 45)) throw Error("CV must be a PDF");
  // Validate the PDF before creating any Drive folder, so rejected uploads do
  // not create incomplete application folders.
  var now = new Date();
  var stamp = Utilities.formatDate(now, "Asia/Dhaka", "yyyyMMdd_HHmmss");
  var receipt = "SAM-" + stamp + "-" + Utilities.getUuid().slice(0, 8).toUpperCase();
  var safeName = name.replace(/[^A-Za-z0-9 -]/g, "").trim().replace(/\s+/g, "-").slice(0, 65) || "Applicant";
  var response = [
    "Submission reference: " + receipt,
    "Name: " + name,
    "Email: " + email,
    "Inquiry type: " + topic,
    "Received: " + now.toISOString(),
    "",
    "Message:",
    message
  ].join("\n");
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var parent = DriveApp.getFolderById(SAM_CONTACT_FOLDER_ID);
    var folder = parent.createFolder(stamp + "_" + safeName + "_" + receipt.slice(-8));
    folder.createFile("Response.txt", response, MimeType.PLAIN_TEXT);
    if (bytes.length) {
      folder.createFile(Utilities.newBlob(bytes, "application/pdf", "CV.pdf"));
    }
    return { ok: true, receipt: receipt };
  } finally {
    lock.releaseLock();
  }
}
