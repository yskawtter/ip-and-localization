const fs = require("fs");
const http = require("http");
const url = require("url");
const querystring = require("querystring");
const slugify = require("slugify");

//server
const ipResult = fs.readFileSync(
  `${__dirname}/templates/ip-result.html`,
  "utf-8"
);
const ipAddress = fs.readFileSync(
  `${__dirname}/templates/ip-address.html`,
  "utf-8"
);

//replaceFN
function replaceFn(page, data) {
  let output;
  if (page === ipResult) {
    output = page.replace(/{%RESPPAIS%}/g, data.country);
    output = output.replace(/{%RESPREGION%}/g, data.regionName);
    output = output.replace(/{%RESPCITY%}/g, data.city);
    output = output.replace(/{%RESPCEP%}/g, data.zip);
    output = output.replace(/{%RESPIP%}/g, data.query);
  } else if (page === ipAddress) {
    output = page.replace(/{%RESPPAIS%}/g, "Brazil");
    output = output.replace(/{%RESPCITY%}/g, data.localidade);
    output = output.replace(/{%RESPREGION%}/g, data.uf);
    output = output.replace(/{%RESPCEP%}/g, data.cep);
    output = output.replace(
      /{%RESPRUA%}/g,
      data.logradouro === "" ? "NÃO CONSTA" : data.logradouro
    );
    output = output.replace(
      /{%RESPBAIRRO%}/g,
      data.bairro === "" ? "NÃO CONSTA" : data.bairro
    );
    output = output.replace(
      /{%RESPCOMPLEMENTO%}/g,
      data.complemento === "" ? "NÃO CONSTA" : data.complemento
    );
  }
  return output;
}

const server = http.createServer((req, res) => {
  //ROTA CONFIG
  const baseURL = `http://${req.headers.host}`;
  const requestURL = new URL(req.url, baseURL);
  const pathname = requestURL.pathname;
  //IP API
  const ipAPI = fetch(`http://ip-api.com/json/`).then((data) => data.json());
  //REQUISIÇÃO DO IP ZIP(CEP)
  function requisicao() {
    return ipAPI.then((data) => data.zip);
  }
  //API CEP
  let cepAPI = requisicao().then((d) => {
    let cepNoSimbol = d.replace(/[^a-zA-Z0-9]/g, "");
    return fetch(`https://viacep.com.br/ws/${cepNoSimbol}/json/`).then((el) =>
      el.json()
    );
  });
  if (pathname === "/") {
    res.writeHead(200, { "Content-type": "text/html" });
    ipAPI.then((d) => res.end(replaceFn(ipResult, d)));
  } else if (pathname === "/address") {
    res.writeHead(200, { "Content-type": "text/html" });
    cepAPI.then((d) => res.end(replaceFn(ipAddress, d)));
  }
});

const porta = 8000;
server.listen(porta, "127.0.0.1", () => {
  console.log(`listening to request  on port ${porta}`);
});
