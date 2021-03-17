#!/usr/bin/env node

const { patchViteIssue2390 } = require("./patch");
patchViteIssue2390();
/*
const { alreadyPatched } = require("./patch");

if (alreadyPatched()) {
  console.log("Vite already patched.");
} else {
  console.log("Vite not patched.");
}
*/
