#!/usr/bin/env node

const { execSync } = require('child_process');

// Get arguments from the command line
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Error: Please provide a branch name and a commit message.');
  console.log('Usage: node git-cli.js <branch-name> "<commit-message>"');
  process.exit(1);
}

const branchName = args[0];
const commitMessage = args.slice(1).join(' '); // Support multi-word commit messages

try {
  console.log('📌 Switching to branch:', branchName);
  execSync(`git checkout ${branchName}`, { stdio: 'inherit' });

  console.log('✅ Adding changes...');
  execSync('git add .', { stdio: 'inherit' });

  console.log('✅ Committing changes...');
  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

  console.log('🚀 Pushing changes to GitHub...');
  execSync(`git push origin ${branchName}`, { stdio: 'inherit' });

  console.log('🎉 All changes successfully pushed!');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
