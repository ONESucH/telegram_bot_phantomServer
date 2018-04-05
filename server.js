"use strict";

const Http = require('http');
const bot = require('./components/bot');
const server = Http.createServer((req, res) => { // запрос ответ

    if (res.statusCode !== 200) return false;

    bot.onLoading();
    
}).listen(4200, () => {
    console.log('Сервер запущен');
});