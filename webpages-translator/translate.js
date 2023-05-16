const Reverso = require('reverso-api');
/* comme Nodejs utilise CommonJS par défaut et que node-fetch est un module ES,
j'importe dynamiquement celui-ci et sans avoir besoin de fichier JSON.*/
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
const fs = require('fs');
const path = require('path');

const reverso = new Reverso();
const sourceLang = 'english';
const targetLang = 'french';

const pages = [
  { url: 'https://example.com/page1.html', name: 'page1' },
  { url: 'https://example.com/page2.html', name: 'page2' },
  { url: 'https://example.com/page3.html', name: 'page3' }
];

const generationsDir = 'generations';

// s'assurer de récup le contenu de chaque URL
Promise.all(pages.map(page => fetch(page.url)))
  // donc extraire le contenu de chaque réponse avec la méthode text()
  .then(responses => Promise.all(responses.map(response => response.text())))
  .then(htmls => {
    htmls.forEach((html, index) => {

      // supp toutes les balises
      html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      const text = html.replace(/<(?:.|\n)*?>/gm, '')

      reverso.getTranslation(text, sourceLang, targetLang, (err, response) => {
        if(err){
          console.error(err)
          return;
        }
        const translation = response.translations[0]
        const name = pages[index].name

        const filename = `${name}.html`
        const fileContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>${name}</title>
              <link rel="stylesheet" href="../main.css">
            </head>
            <body>
              <h1>${name}</h1>
              <div class="translation">
                <h2>Translation</h2>
                <p>${translation}</p>
              </div>
            </body>
          </html>
        `
        const generationsPath = path.join(__dirname, generationsDir);
        if (!fs.existsSync(generationsPath)){
          fs.mkdirSync(generationsPath)
          console.log(`\n Dossier ${generationsDir} créé.\n`)
        }
        const filePath = path.join(generationsPath, filename);
        fs.writeFile(filePath, fileContent, err => {
          if(err){
            console.error(err)
          }else{
            console.log(`Fichier ${filename} créé.`)
          }
        });
      });
    });
  })
  .catch(error => {console.error(error)})