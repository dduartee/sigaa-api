const { Sigaa, SigaaCookiesController } = require('sigaa-api');

const url = "https://sigaa.ifsc.edu.br";

// coloque sua sessão ex: 1233322211ABCCCDDEEFFF.appdocker1-inst2
const session = '';

const { hostname } = new URL(url);
const cookiesController = new SigaaCookiesController();
cookiesController.storeCookies(hostname, [`JSESSIONID=${session}`]);

const sigaa = new Sigaa({ url, institution: "IFSC", cookiesController });

const main = async () => {
    const http = sigaa.httpFactory.createHttp();
    const homepage = await http.get("/sigaa/vinculos.jsf");
    const account = await sigaa.accountFactory.getAccount(homepage);
    
    console.log('> Usuário: '+ (await account.getUsername()));
    console.log('> Nome: ' + (await account.getName()));
    console.log('> Emails: ' + (await account.getEmails()).join(', '));
    console.log('> Url foto: ' + (await account.getProfilePictureURL()));
};

main().catch((err) => {
    if (err) console.log(err);
});
