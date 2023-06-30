import { Sigaa } from "src/sigaa-main";


test('if sigaa search loads campus list', async () => {
    const sigaa = new Sigaa({
      url: 'https://sigaa.unb.br'
    });
    const list = await sigaa.search.subject().getCampusList();
    for (const campus of list) {
      expect(campus.name).toMatch(
        /CAMPUS|INSTITUTO|COORDENADORIA|DIRETORIA|TODOS/g
      );
      expect(campus.name).toMatch(/^([A-Z]|[0-9]|[ÁÉÓÍÚÃÇÂÊÎÔÛ. \-–()])+$/);
      expect(campus.value).toMatch(/^[0-9]+$/g);
    }
    sigaa.close();
  });