#!/usr/bin/env node
const { execSync } = require("child_process");


const args = process.argv.slice(2);

if (args.length < 1) {
  console.error("❌ Error: Please provide a commit message.");
  console.log('Usage: node git-cli.js "commit-message"');
  process.exit(1);
}

const commitMessage = args.join(" ");

try {

  const branchName = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
  console.log(`📌 Current branch: ${branchName}`);

  console.log("✅ Adding changes...");
  execSync("git add .", { stdio: "inherit" });

  console.log("✅ Committing changes...");
  execSync(`git commit -m "${commitMessage}"`, { stdio: "inherit" });

  console.log(`🚀 Pushing branch "${branchName}" to GitHub...`);
  execSync(`git push origin ${branchName}`, { stdio: "inherit" });

  console.log("🎉 All changes successfully pushed to GitHub!");
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
