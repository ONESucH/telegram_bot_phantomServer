'use strict';
const http = require('http');
const https = require('https');
const getToken = require('./token');
let moreCommands = '',
    token = getToken.tokenBuilder();

module.exports = {
    onLoading: () => {
        let options = {
            host: 'api.telegram.org',
            path: '/bot' + token + '/getMe',
            headers: {'User-Agent': 'request'}
        };

        https.get(options, (res) => {

            if (res.statusCode !== 200) return false;

            let json = '';

            res.on('data', (chunk) => {
                json += chunk;
            });

            res.on('end', () => {
                try {
                    let data = JSON.parse(json);

                    /* Записываем данные об пользователе */
                    let saveUserData = {  // Будем записывать данные об пользователе
                        messageChatId: data.result.id, // Id Чата в котором находимся
                        is_bot: data.result.is_bot, // Бот ли это? true - да
                        first_name: data.result.first_name, // Имя бота или пользователя
                        username: data.result.username, // Имя чата
                    };

                    /* Проблема в передачи json в функцию */
                    module.exports.getInformationChat(saveUserData); // Запрашиваем доступ к приложению
                } catch (e) {
                    console.log('error parsing');
                }
            });
        })
    },

    /* Получаем ID чата для работы с сообщениями / командами */
    getInformationChat: function (userData) { // Получили информацию об приложении
        let options = {
            host: 'api.telegram.org',
            path: '/bot' + token + '/getUpdates?offset=112080303',
            headers: {'User-Agent': 'request'}
        };

        https.get(options, (res) => {
            let json = '';

            res.on('data', (chunk) => {
                json += chunk;
            });

            res.on('end', () => {
                let data = JSON.parse(json),
                    commands = data.result[data.result.length - 1].message.text; // сообщение запишем чтобы отлавливать команды

                /***
                 -----------------------------------------
                 *  Здесь мы задаём команды
                 -----------------------------------------
                 ***/
                // Накрутка счетчика
                if (commands === '/telegrammcounter') {
                    module.exports.pasteMessage(data.result, userData);
                } else
                // Выводим дату
                if (commands === '/clock' && commands !== moreCommands) {
                    module.exports.getToData(data.result, userData);
                }
                if (commands === '/citation' && commands !== moreCommands) {
                    module.exports.citations(data.result, userData);
                }
                if (commands === '/newpaper' && commands !== moreCommands) {
                    module.exports.newpaper(data.result, userData);
                }
                if (commands === '/hitech' && commands !== moreCommands) {
                    module.exports.hiTech(data.result, userData);
                }
                if (commands === '/location' && commands !== moreCommands) {
                    module.exports.location(data.result, userData);
                }
                moreCommands = commands;
            });
        });

        // Цикл обновления данных
        setTimeout(() => {
            module.exports.onLoading();
        }, 500);
    },

    /* Накрутка сообщений */
    pasteMessage: function (chatOpen, userData) { // Отправляем по функциям user data для того чтобы не потерять данные + не делать глобальные переменные
        /* Получили доступ к чату, пробуем отправлять сообщения */
        let option = {
            host: 'api.telegram.org',
            path: encodeURI('/bot' + token + '/sendMessage?chat_id=' + chatOpen[0].message.chat.id + '&text=Добавляем'),
            headers: {'Content-Type': 'application/json'}
        };
        https.get(option, (res) => {
            let json = '';

            res.on('data', (chunk) => {
                json += chunk;
            });

            res.on('end', () => {
                let data = JSON.parse(json);

                userData.appId = data.result.chat.id; // ID чата в котором отсылаем сообщения
            });
        })
    },

    /* Запросить время */
    getToData: function (chatOpen, userData) {
        let getData = new Date(),
            option = {
                host: 'api.telegram.org',
                path: encodeURI('/bot' + token + '/sendMessage?chat_id=' + chatOpen[0].message.chat.id + '&text=Время:\n' + getData.getHours() + ':' + getData.getMinutes() + ':' + getData.getSeconds()),
                headers: {'Content-Type': 'application/json'}
            };

        https.get(option)
    },

    /* Цитаты из рунета */
    citations: function (chatOpen, userData) {
        let json = '',
            optionsQuote = {
                host: 'api.forismatic.com',
                path: '/api/1.0/?method=getQuote&format=json&json=parseQuote',
                headers: {'Content-Type': 'application/json'}
            };

        https.get(optionsQuote, (req) => {
            req.on('data', (chunk) => {
                json += chunk;
            });
            req.on('end', () => {
                let globalData = JSON.parse(json);

                let option = {
                    host: 'api.telegram.org',
                    path: encodeURI('/bot' + token + '/sendMessage?chat_id=' + chatOpen[0].message.chat.id + '&text=Цитата:\n' + globalData.quoteText + '\nАвтор:\n' + globalData.quoteAuthor),
                    headers: {'Content-Type': 'application/json'}
                };

                https.get(option)
            });
        });

    },

    /* Новости - с автообновлением в 1 ч */
    newpaper: function (chatOpen, userData) {
        let option = {
            host: 'newsapi.org',
            path: '/v2/top-headlines?sources=google-news-ru&apiKey=15432ffaf9054b8e8105ed6f7d9dc70e',
            headers: {'Content-Type': 'application/json'}
        };

        https.get(option, (req) => {
            let json = '';
            req.on('data', (chunk) => {
                json += chunk;
            });
            req.on('end', () => {
                let responce = JSON.parse(json),
                    optionTelegramm = {
                        host: 'api.telegram.org',
                        path: encodeURI('/bot' + token + '/sendMessage?chat_id=' + chatOpen[0].message.chat.id + '&text=Последняя новость:\n' + responce.articles[0].title),
                        headers: {'Content-Type': 'application/json'}
                    };

                https.get(optionTelegramm)
            });
        });
        
        setTimeout(function () {
            module.exports.newpaper(chatOpen, userData);
        }, 3600000); // 1ч
    },

    /* Новости HiTech - с автообновлением в 1 ч */
    hiTech: function (chatOpen, userData) {
        let option = {
            host: 'newsapi.org',
            path: '/v2/top-headlines?sources=techradar&apiKey=15432ffaf9054b8e8105ed6f7d9dc70e',
            headers: {'Content-Type': 'application/json'}
        };

        https.get(option, (req) => {
            let json = '';
            req.on('data', (chunk) => {
                json += chunk;
            });
            req.on('end', () => {
                let responce = JSON.parse(json),
                    optionTelegramm = {
                        host: 'api.telegram.org',
                        path: encodeURI('/bot' + token + '/sendMessage?chat_id=' + chatOpen[0].message.chat.id + '&text=' +
                            '\nАвтор: ' + responce.articles[0].author + 
                            '\nЗаголовок: ' + responce.articles[0].title),
                        headers: {'Content-Type': 'application/json'}
                    },
                    optionTelegrammPhoto = {
                        host: 'api.telegram.org',
                        path: encodeURI('/bot' + token + '/sendPhoto?chat_id=' + chatOpen[0].message.chat.id + '&photo=' + responce.articles[0].urlToImage),
                        headers: {'Content-Type': 'application/json'}
                    };

                https.get(optionTelegrammPhoto);
                https.get(optionTelegramm);
            });
        });

        setTimeout(function () {
            module.exports.hiTech(chatOpen, userData);
        }, 3600000); // 1ч
    },

    /* Моё положение */
    location: function (chatOpen, userData) {
        let json = '',
            optionsLocation = {
                host: 'api.ipstack.com',
                path: '/check?access_key=99d528343eb31080f6bfba4e5255ee24',
                headers: {'Content-Type': 'application/json'}
            };

        http.get(optionsLocation, (req) => { // api требует http соединение
            req.on('data', (chunk) => {
                json += chunk;
            });
            req.on('end', () => {
                let globalData = JSON.parse(json);

                let option = {
                    host: 'api.telegram.org',
                    path: encodeURI('/bot' + token + '/sendMessage?chat_id=' + chatOpen[0].message.chat.id + '&text=' +
                        'Материк: ' + globalData.continent_name + 
                        '\nСтрана: ' + globalData.country_name +
                        '\nРегион: ' + globalData.region_name +
                        '\nГород: ' + globalData.city +
                        '\nШирота: ' + globalData.latitude +
                        '\nДолгота: ' + globalData.longitude
                    ),
                    headers: {'Content-Type': 'application/json'}
                };

                https.get(option)
            });
        });

    }
};