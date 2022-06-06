var express = require('express');
var router = express.Router();
const INX = require('../modules/inx');
const Bitfinex = require('../modules/bitfinex');

let BuyPriceText = "";
let SellPriceText = "";

/* GET home page. */
router.get('/', function (req, res, next)
{
  res.render('index', { title: 'BTC Price Aggregator' });
});

INX.connectToOrderBook('BTC-USD');
Bitfinex.connectToOrderBook('BTCUSD');

setInterval(function ()
{
  if (INX.ready && Bitfinex.ready)
  {
    let BuyPrice = Bitfinex.BuyPrice < INX.BuyPrice ? Bitfinex.BuyPrice : INX.BuyPrice;
    let BuyPlatform = Bitfinex.BuyPrice < INX.BuyPrice ? 'Bitfinex' : 'INX';
    BuyPriceText = 'BUY BTC-USD, ' + BuyPrice + ' ' + BuyPlatform;
    console.log(BuyPriceText);

    let SellPrice = Bitfinex.SellPrice > INX.SellPrice ? Bitfinex.SellPrice : INX.SellPrice;
    let SellPlatform = Bitfinex.SellPrice > INX.SellPrice ? 'Bitfinex' : 'INX';
    SellPriceText = 'SELL BTC-USD, ' + SellPrice + ' ' + SellPlatform;
    console.log(SellPriceText);
  }
}, 1500);

module.exports = router;
