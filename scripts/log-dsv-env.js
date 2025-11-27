#!/usr/bin/env node
// scripts/log-dsv-env.js
const name = 'REACT_APP_KNOWLEDGE_API_BASE_URL';
console.log(`${name} =`, process.env[name] ?? '<not set>');