const fs = require('fs-extra');
const path = require('path');

(async () => {
  const spec = await fs.readJson('swagger.json');
  const paths = spec.paths || {};

  Object.entries(paths).forEach(([route, methods]) => {
    // sanitize route for filename
    const safeRoute = route.replace(/[{}]/g, '').split('/').filter(Boolean).join('_');

    Object.entries(methods).forEach(([method, op]) => {
      Object.entries(op.responses || {}).forEach(([code, resp]) => {
        const ref = resp.content?.['application/json']?.schema?.$ref;
        if (ref) {
          const name = ref.split('/').pop();
          const filePath = `./mocks/endpoints/${method.toUpperCase()}_${safeRoute}_${name}-${code}.json`;

          if (fs.existsSync(path.resolve(filePath))) {
            resp.content['application/json'].examples = {
              [name]: { $ref: filePath }
            };
          } else {
            console.warn(`Mock file not found: ${filePath}`);
          }
        }
      });
    });
  });

  await fs.writeJson('swagger-linked.json', spec, { spaces: 2 });
  console.log('✅ Created swagger-linked.json');
})();