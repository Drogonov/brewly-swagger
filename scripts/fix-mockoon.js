// File: scripts/fix-mockoon.js
const fs = require('fs-extra');
const path = require('path');
const envPath = 'mocks/mockoon.json';

(async () => {
  const env = await fs.readJson(envPath);
  const envDir = path.dirname(envPath);
  const endpointsDir = path.join(envDir, 'endpoints');

  // Pre-read the endpoints directory
  let files = [];
  try {
    files = fs.readdirSync(endpointsDir);
  } catch (err) {
    console.error(`Could not read endpoints directory: ${endpointsDir}`, err);
    process.exit(1);
  }

  env.routes.forEach(route => {
    // Remove inline TEXT responses
    route.responses = route.responses.filter(resp => resp.bodyType !== 'TEXT');

    // Attach file-based responses
    route.responses.forEach(resp => {
      const method = route.method.toUpperCase();
      const endpointSafe = route.endpoint.replace(/\//g, '_').replace(/^_+/, '');
      const code = resp.statusCode || resp.status;
      const pattern = new RegExp(`^${method}_${endpointSafe}_.+-${code}\\.json$`);
      const match = files.find(f => pattern.test(f));

      if (match) {
        resp.bodyType = 'FILE';
        resp.filePath = `./endpoints/${match}`;
      } else {
        console.warn(`Mock file not found for ${method} ${route.endpoint} status ${code}`);
      }
    });

    // Deduplicate responses by filePath
    const seen = new Set();
    route.responses = route.responses.filter(resp => {
      if (resp.filePath && seen.has(resp.filePath)) return false;
      seen.add(resp.filePath);
      return true;
    });
  });

  // Remove routes that have no file-based responses
  env.routes = env.routes.filter(route => {
    const hasFileResp = route.responses.some(r => r.bodyType === 'FILE');
    if (!hasFileResp) {
      console.log(`Removing route ${route.endpoint} - no file-based responses`);
    }
    return hasFileResp;
  });

  // Write updated environment
  await fs.writeJson(envPath, env, { spaces: 2 });
  console.log('✅ Cleaned up and pruned mockoon.json');
  (envPath, env, { spaces: 2 });
  console.log('✅ Cleaned up and pruned mockoon.json');

  const filePath = './swagger-linked.json';
  fs.rm(filePath, (err) => {
    if (err) {
      console.error(`❌ Error deleting file: ${err}`);
      return;
    }
    console.log(`✅ File ${filePath} deleted successfully.`);
  });
})();