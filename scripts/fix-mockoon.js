const fs = require('fs-extra');
const envPath = 'mocks/mockoon.json';

(async () => {
  const env = await fs.readJson(envPath);

  env.routes.forEach(route => {
    // 1) Drop the default inline response
    route.responses = route.responses.slice(1);

    // 2) For each remaining response, set filePath from its label
    route.responses.forEach(resp => {
      // assume label === '<DtoName>' so we know which mock file to pick
      const [dtoName, code] = resp.label.split('–') // e.g. 'StatusResponseDto-200'
      const filename = `${route.method.toUpperCase()}_${route.endpoint.replace(/\//g, '_')}_${dtoName}-${code}.json`;
      resp.bodyType = 'FILE';
      resp.filePath = `./mocks/endpoints/${filename}`;
    });
  });

  await fs.writeJson(envPath, env, { spaces: 2 });
  console.log('✅ Cleaned up mockoon.json');
})();