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

    route.responses.forEach(resp => {
      // Determine HTTP method and endpoint
      const method = route.method.toUpperCase();
      const endpointSafe = route.endpoint.replace(/\//g, '_').replace(/^_+/, '');
      const code = resp.statusCode || resp.status;

      // Build a regex to match the file: METHOD_endpointSafe_<DTO>-<code>.json
      const pattern = new RegExp(`^${method}_${endpointSafe}_.+-${code}\.json$`);
      const match = files.find(f => pattern.test(f));

      if (match) {
        // Attach file
        resp.bodyType = 'FILE';
        resp.filePath = `./endpoints/${match}`;
      } else {
        console.warn(`Mock file not found for ${method} ${route.endpoint} status ${code}`);
      }
    });
  });

  await fs.writeJson(envPath, env, { spaces: 2 });
  console.log('✅ Cleaned up mockoon.json');
})();