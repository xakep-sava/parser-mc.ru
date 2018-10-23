const request = require("request");
const cheerio = require("cheerio");
const fs = require("fs");
const sleepMs = 100;
var csvWriter = require("csv-write-stream");
// var svg2img = require('svg2img');

var baseUrl = "https://mc.ru";
var importPathFile = "import.csv";

request(baseUrl + "/products/msk", (error, response, body) => {
  if (!error) {
    var $ = cheerio.load(body);
    var links = $(".productsMenuCol li a");
    var currentItem = 0;

    if (fs.existsSync(importPathFile)) {
      fs.unlinkSync(importPathFile);
    }

    if (!fs.existsSync('images')) {
      fs.mkdirSync('images');
    }

    var writer = csvWriter({
      separator: ",",
      newline: "\n",
      headers: [
        "ID",
        "Тип",
        "Артикул",
        "Марка",
        "Имя",
        "Опубликован",
        "рекомендуемый?",
        "Видимость в каталоге",
        "Короткое описание",
        "Описание",
        "Дата начала действия продажной цены",
        "Дата окончания действия продажной цены",
        "Статус налога",
        "Налоговый класс",
        "В наличии?",
        "Запасы",
        "Задержанный заказ возможен?",
        "Продано индивидуально?",
        "Вес (kg)",
        "Длина (cm)",
        "Ширина (cm)",
        "Высота (cm)",
        "Разрешить отзывы от клиентов?",
        "Примечание к покупке",
        "Цена распродажи",
        "Базовая цена",
        "Категории",
        "Метки",
        "Класс доставки",
        "Изображения",
        "Лимит загрузок",
        "Число дней до просроченной загрузки",
        "Родительский",
        "Сгруппированные товары",
        "Апсейл",
        "Кросселы",
        "Внешний URL",
        "Текст кнопки",
        "Позиция",
        "Мета: _product_url",
        "Мета: _button_text",
        "Мета: _wpas_done_all"
      ]
    });

    writer.pipe(fs.createWriteStream(importPathFile, {flags: "a"}));

    var currentPage = 0;
    var parseLinks = new Promise((resolve, reject) => {
      links.each((i, link) => {
        request(baseUrl + link.attribs.href, (error, response, body) => {
          if (!error) {
            var $ = cheerio.load(body);
            var items = $(".catalogTable tr");

            items.each((j, elem) => {
              var itemName = $(elem).find("td:nth-child(1)");
              var itemMark = $(elem).find("td:nth-child(3)").text().trim();
              var itemLength = $(elem).find("td:nth-child(4)").text().trim();
              var itemPrice = $(elem).find("td:nth-child(6)").text().trim().replace(" ", "");
              var itemLink = "https://mc.ru/" + itemName.find('a').attr('href');

              itemName = itemName.text().trim();

              if (!itemName.length) {
                return;
              }

              // request(itemLink, (error, response, body) => {
              //   var $ = cheerio.load(body);
              //   var image = $(".TovInfo img");
              //
              //   if (image.length) {
              //     let fileName = "images/" + currentPage;
              //     let imageUrl = "https://mc.ru" + image.attr("src");
              //
              //     download(imageUrl, fileName + ".svg", () => {
              //       svg2img(fileName + ".svg", (error, buffer) => {
              //         fs.writeFileSync(fileName + ".png", buffer);
              //       });
              //     });
              //
              //     // svg2img(
              //     //   "https://mc.ru" + image.attr('src'),
              //     //   (error, buffer) => {
              //     //     fs.writeFileSync('images/' + currentPage + '.png', buffer);
              //     //   });
              //   }
              //
              //   sleep(sleepMs);
              // });

              writer.write({
                "ID": ++currentItem,
                "Тип": "simple",
                "Артикул": currentItem,
                "Марка": itemMark,
                "Имя": itemName,
                "Опубликован": 1,
                "рекомендуемый?": 0,
                "Видимость в каталоге": "visible",
                "Короткое описание": "",
                "Описание": "",
                "Дата начала действия продажной цены": "",
                "Дата окончания действия продажной цены": "",
                "Статус налога": "taxable",
                "Налоговый класс": "",
                "В наличии?": 1,
                "Запасы": "",
                "Задержанный заказ возможен?": 0,
                "Продано индивидуально?": 0,
                "Вес (kg)": "",
                "Длина (cm)": itemLength,
                "Ширина (cm)": "",
                "Высота (cm)": "",
                "Разрешить отзывы от клиентов?": 0,
                "Примечание к покупке": "",
                "Цена распродажи": "",
                "Базовая цена": itemPrice,
                "Категории": "",
                "Метки": "",
                "Класс доставки": "",
                "Изображения": "",
                "Лимит загрузок": "",
                "Число дней до просроченной загрузки": "",
                "Родительский": "",
                "Сгруппированные товары": "",
                "Апсейл": "",
                "Кросселы": "",
                "Внешний URL": "",
                "Текст кнопки": "",
                "Позиция": 0,
                "Мета: _product_url": "",
                "Мета: _button_text": "",
                "Мета: _wpas_done_all": 1
              });

              if (j === items.length) {
                currentPage++;
              }
            });
          } else {
            console.log("Произошла ошибка: " + error);
          }

          // if (currentPage == 5) {
          //   resolve();
          // }

          if (currentPage === links.length - 1) {
            resolve();
          }

          sleep(sleepMs);
        });
      });
    });

    parseLinks.then(() => {
      console.log("Всего позиций: " + currentItem);
    }).catch((error) => {
      console.log("Ошибка парсинга: " + error);
    }).then(() => {
      writer.end();
    });
  } else {
    console.log("Произошла ошибка: " + error);
  }
});

async function sleep(ms) {
  await sleepPromise(ms);
}

function sleepPromise(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

// var download = (uri, filename, callback) => {
//   if (!callback) {
//     callback = () => {};
//   }
//
//   request.head(uri, (err, res, body) => {
//     request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
//   });
// };