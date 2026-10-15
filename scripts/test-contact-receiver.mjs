import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const source=readFileSync(new URL("./sam-contact-receiver.gs",import.meta.url),"utf8");
const folders=[];
let created=0;
const folder={
  createFolder(name){
    created++;
    const files=[];
    const child={name,files,createFile(...args){files.push(args);return {}}};
    folders.push(child);return child;
  }
};
const ctx={
  HtmlService:{XFrameOptionsMode:{ALLOWALL:"ALLOWALL"},createHtmlOutput(html){
    return {html,setTitle(x){this.title=x;return this},setXFrameOptionsMode(x){this.xframe=x;return this}};
  }},
  DriveApp:{getFolderById(id){assert.equal(id,"1LQDh6HGkzjQHxqtpc4TtHSsLiv3kipK-");return folder}},
  Utilities:{
    formatDate(){return "20261016_123456"},
    getUuid(){return "aabbccdd-0000-0000-0000-000000000000"},
    newBlob(bytes,mime,name){return {bytes,mime,name}}
  },
  LockService:{getScriptLock(){return {waitLock(){},releaseLock(){}}}},
  MimeType:{PLAIN_TEXT:"text/plain"},
  Date,Error,String,RegExp,Array,Number,Object
};
const sandbox=vm.createContext(ctx);
new vm.Script(source).runInContext(sandbox);
const ui=sandbox.doGet();
assert.equal(ui.xframe,"ALLOWALL");
assert.match(ui.html,/google\.script\.run\.withSuccessHandler/);
assert.match(ui.html,/name="cv"/);
assert.match(ui.html,/name="email"/);
const application={
 name:"Alice Researcher",
 email:"alice@example.edu",
 topic:"Undergraduate research",
 message:"I am interested in the research group and would like to contribute.",
 website:"",
 cv:{getBytes(){return [37,80,68,70,45,49,46,55]}}
};
assert.throws(()=>sandbox.saveSubmission({...application,cv:{getBytes(){return [1,2,3]}}}),/PDF/);
assert.equal(created,0,"Invalid CV must not create a Drive folder");
assert.throws(()=>sandbox.saveSubmission({...application,message:"short"}),/message/);
assert.equal(created,0);
const done=sandbox.saveSubmission(application);
assert.equal(done.ok,true);
assert.match(done.receipt,/^SAM-20261016_123456-AABBCCDD$/);
assert.equal(created,1);
assert.equal(folders[0].files.length,2);
assert.equal(folders[0].files[0][0],"Response.txt");
assert.match(folders[0].files[0][1],/alice@example\.edu/);
assert.equal(folders[0].files[1][0].name,"CV.pdf");
const noCv=sandbox.saveSubmission({...application,cv:""});
assert.equal(noCv.ok,true);
assert.equal(folders[1].files.length,1);
console.log("SAM Apps Script contact receiver regression tests passed");
