const WS = require('ws');
const _ = require('lodash');
const SortedSet = require("collections/sorted-set");

class Bitfinex
{
  static connectionUrl = 'wss://api.bitfinex.com/ws/2';
  static buySet = new SortedSet();
  static sellSet = new SortedSet();
  static ready = false;

  static connectToOrderBook(symbol)
  {
    let msgCount;
    //console.log(symbol, Bitfinex.connectionUrl);

    let cli = new WS(Bitfinex.connectionUrl, { /* rejectUnauthorized: false */ });

    cli.on('open', function open()
    {
      //console.log('WS open');
      msgCount = 0;
      cli.send(JSON.stringify({ event: 'conf', flags: 65536 + 131072 }));
      cli.send(JSON.stringify({ event: 'subscribe', channel: 'book', symbol: symbol, prec: 'P0', len: 100 }));
    });

    cli.on('message', function (msg)
    {
      msg = JSON.parse(msg);

      if (msg.event || msg[1] === 'hb' || msg[1] === 'cs')
        return;

      // on first run, we get snapshot of the book which is a list of trades objects. Each one has {price, cnt, amount}.
      // from msg[1][0] to msg[1][99] all bids (buy). The first, msg[1][0], is the highest 
      // from msg[1][100] to msg[1][199] all asks (sell). The first, msg[1][100], is the lowest 
      // actually the list.length/2 is the first sell and is lowest
      if (msgCount === 0)
      {
        _.each(msg[1], function (trade)
        {
          trade = { price: trade[0], cnt: trade[1], amount: trade[2] };
          const side = trade.amount >= 0 ? 'bids' : 'asks';

          if (side == 'bids')
            Bitfinex.buySet.push(trade.price);
          else
            Bitfinex.sellSet.push(trade.price);
          Bitfinex.ready = true;
        });
      }

      // after the first time, we get updates for any changes to the state of the book
      // each update has only one trade and it is in msg[1]
      else
      {
        msg = msg[1];
        let trade = { price: msg[0], cnt: msg[1], amount: msg[2] };

        // bids (buy)
        if (trade.amount > 0)
        {
          if (trade.cnt == 0)// update price
          {
            if (Bitfinex.buySet.has(trade.price))
              Bitfinex.buySet.delete(trade.price);
          }
          else
            Bitfinex.buySet.push(trade.price);
        }
        // asks (sell)
        else if (trade.amount < 0)
        {
          if (trade.cnt == 0)// update price
          {
            if (Bitfinex.sellSet.has(trade.price))
              Bitfinex.sellSet.delete(trade.price);
          }
          else
            Bitfinex.sellSet.push(trade.price);
        }
      }

      msgCount++;
    });
  }

  static get BuyPrice()
  {
    if (Bitfinex.buySet && Bitfinex.buySet.max())
      return Bitfinex.buySet.max();

    return Number.NEGATIVE_INFINITY;
  }

  static get SellPrice()
  {
    if (Bitfinex.sellSet && Bitfinex.sellSet.min())
      return Bitfinex.sellSet.min();

    return Number.POSITIVE_INFINITY;
  }
}

module.exports = Bitfinex;