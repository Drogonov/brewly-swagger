const fs = require('fs-extra');
const path = require('path');

async function main() {
  // Define project root and paths
  const projectRoot = path.resolve(__dirname, '..');
  const specPath = path.join(projectRoot, 'swagger.json');
  const outputDir = path.join(projectRoot, 'mocks');

  // Load the raw OpenAPI spec
  const rawSpec = await fs.readJson(specPath);

  // 1) Create directories for each route/method
  for (const [route, methods] of Object.entries(rawSpec.paths || {})) {
    for (const [method] of Object.entries(methods)) {
      const methodName = method.toLowerCase();
      const segments = route.replace(/^\//, '').split('/');
      const dir = path.join(outputDir, ...segments, methodName);
      await fs.ensureDir(dir);
    }
  }
  console.log('✅ Directories created at', outputDir);

  // 2) Parse DTOs and build sample JSONs
  const schemas = rawSpec.components?.schemas || {};
  /** @type {{ [dtoName: string]: object }} */
  const dtoJsons = {};

  for (const [dtoName, schema] of Object.entries(schemas)) {
    const sample = {};
    const props = schema.properties || {};
    for (const [propName, propSchema] of Object.entries(props)) {
      // Use example if provided
      if (propSchema.example !== undefined) {
        sample[propName] = propSchema.example;
      } else {
        // Fallback defaults by type
        switch (propSchema.type) {
          case 'string':
            sample[propName] = '';
            break;
          case 'number':
          case 'integer':
            sample[propName] = 0;
            break;
          case 'boolean':
            sample[propName] = false;
            break;
          case 'array':
            sample[propName] = [];
            break;
          case 'object':
            sample[propName] = {};
            break;
          default:
            sample[propName] = null;
        }
      }
    }
    dtoJsons[dtoName] = sample;
  }

  // 3) Print the DTO JSON dictionary
  console.log('📦 DTO JSONs:', JSON.stringify(dtoJsons, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});