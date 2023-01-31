const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();
const text = require('./const');
const bot = new Telegraf(process.env.BOT_TOKEN);
const axios = require('axios');
const CODE_UAH = 980;
const CODE_USD = 840;
const CODE_EUR = 978;
let currencyArr = [];
let answerCurPattern = 'Виберіть валюту на яку ви хочете обміняти:';
let answerSumPattern = 'Вкажіть суму, яку ви хочете обміняти';
let firstCurrency = '';
let secondCurrency = '';

function createObjectCurr(name,buy,sell) {
    let object = {
        name: name,
        rateBuy: buy,
        rateSell: sell
    }

    return object;
}

bot.start((ctx) => ctx.reply(`Для відображення усіх команд бота введіть команду /help`));
bot.help((ctx) => ctx.reply(text.commands));

bot.command('menu',async (ctx) => {
    if(currencyArr.length === 0){
        url = "https://api.monobank.ua/bank/currency"
        axios.get(url)
        .then((res)=>{
            for (const iterator of res.data) {
                if(iterator.currencyCodeA === CODE_USD && iterator.currencyCodeB === CODE_UAH) {
                    let currencyObj = createObjectCurr('USD/UAH:',iterator.rateBuy,iterator.rateSell);
                    currencyArr.push(currencyObj);
                }else if(iterator.currencyCodeA === CODE_EUR && iterator.currencyCodeB === CODE_UAH){
                    let currencyObj = createObjectCurr('EUR/UAH:',iterator.rateBuy,iterator.rateSell);
                    currencyArr.push(currencyObj); 
                }else if(iterator.currencyCodeA === CODE_EUR && iterator.currencyCodeB === CODE_USD){
                    let currencyObj = createObjectCurr('EUR/USD:',iterator.rateBuy,iterator.rateSell);
                    currencyArr.push(currencyObj); 
                }
            }
        })
    }
    
    await ctx.reply('Меню:',Markup.inlineKeyboard(
        [
            [Markup.button.callback('Вивести курс валют','btn-table')], 
            [Markup.button.callback('Конвертер валют','btn_calc')] 
        ]
    ))
})

bot.action('btn-table', (ctx) => {
    ctx.answerCbQuery();    
    let answearMessage = '';

    for (const iterator of currencyArr) {
        answearMessage = answearMessage + iterator.name + " " + String(iterator.rateBuy).substring(0,5) 
        + "/" + String(iterator.rateSell).substring(0,5) + "\n";
    }

    ctx.reply(answearMessage);  
})

bot.action('btn_calc', async (ctx) => {
    ctx.answerCbQuery();
    await ctx.reply('Виберіть валюту, яку ви хочете обміняти:',Markup.inlineKeyboard(
        [
            [Markup.button.callback('USD','btn-usd_first')], 
            [Markup.button.callback('EUR','btn_eur_first')],
            [Markup.button.callback('UAH','btn_uah_first')] 
        ]
    ))
   
})


bot.action('btn-usd_first', async (ctx) => {
    ctx.answerCbQuery();
    firstCurrency = 'USD';
    await ctx.reply(answerCurPattern,Markup.inlineKeyboard(
        [ 
            [Markup.button.callback('EUR','btn_eur_second')],
            [Markup.button.callback('UAH','btn_uah_second')] 
        ]
    ))
})


bot.action('btn_eur_first', async (ctx) => {
    ctx.answerCbQuery();
    firstCurrency = 'EUR';
    await ctx.reply(answerCurPattern,Markup.inlineKeyboard(
        [ 
            [Markup.button.callback('USD','btn_usd_second')],
            [Markup.button.callback('UAH','btn_uah_second')] 
        ]
    ))
})


bot.action('btn_uah_first', async (ctx) => {
    ctx.answerCbQuery();
    firstCurrency = 'UAH';
    await ctx.reply(answerCurPattern,Markup.inlineKeyboard(
        [ 
            [Markup.button.callback('USD','btn_usd_second')],
            [Markup.button.callback('EUR','btn_eur_second')] 
        ]
    ))
})

bot.action('btn_usd_second', async (ctx) => {
    ctx.answerCbQuery();
    secondCurrency = 'USD';
    await ctx.reply(answerSumPattern);
})

bot.action('btn_eur_second', async (ctx) => {
    ctx.answerCbQuery();
    secondCurrency = 'EUR';
    await ctx.reply(answerSumPattern);
})

bot.action('btn_uah_second', async (ctx) => {
    ctx.answerCbQuery();
    secondCurrency = 'UAH';
    await ctx.reply(answerSumPattern);
})

bot.on('message',(ctx) => {
    if(firstCurrency !== '' && secondCurrency !== ''){
        let answerSum = parseInt(ctx.message.text);
        let resultSum = 0;
        for (const iterator of currencyArr) {
            let findFirstCurrency = String(iterator.name).search(firstCurrency);
            let findSecondCurrency = String(iterator.name).search(secondCurrency);
            if(findFirstCurrency !== -1 && findSecondCurrency !== -1) {
                if(findFirstCurrency < findSecondCurrency){
                    resultSum = Math.round(answerSum * iterator.rateBuy);
                }else{
                    resultSum = Math.round(answerSum / iterator.rateSell);
                }
            }
        }
        ctx.reply(`${ctx.message.text}  ${firstCurrency} = ${resultSum} ${secondCurrency} `);
        firstCurrency = '';
        secondCurrency = '';
    }else{
        ctx.reply('Спочатку оберіть валюту з якої та на /яку ви хочете здійснити обмін');
    }
})

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));