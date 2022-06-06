const WS = require('ws');
const uuidv4 = require('uuidv4');
const axios = require('axios');
const crypto = require('crypto');
const SortedSet = require("collections/sorted-set");
const _ = require('lodash');
const fs = require('fs');

class INX
{
  static apiUrl = 'https://gw-client-api-rest.uat.inx.co/api';
  static connectionUrl = 'wss://gw-client-api-ws.uat.inx.co';
  static buySet = new SortedSet();
  static sellSet = new SortedSet();
  static ready = false;
  static apiKeyId = '62988e11cd36b5260d3574b8';// insert your API key id in apiKeyId

  static prepareRequest()
  {
    const privateKey = fs.readFileSync(INX.apiKeyId + '.private.txt').toString();
    const context = {
      nonce: Date.now(),
      timestamp: Date.now(),
      apiKeyId: INX.apiKeyId,
    };
    const data = Buffer.from(JSON.stringify(context));
    const signedContext = crypto.sign('sha256', data, privateKey).toString('base64');
    const requestHeaders = {
      ...context,
      signedContext,
    };
    return requestHeaders;
  }

  static requestHeaders = INX.prepareRequest();

  static revokeWsToken()
  {
    return axios.post(INX.apiUrl + '/revokeToken', {}, {
      headers: INX.requestHeaders
    })
      .then(function (response)
      {
        //console.log(response);
      })
      .catch(function (error)
      {
        console.log('ERROR: revokeWsToken ' + error);
      });
  }

  static createWsToken()
  {
    return axios.post(INX.apiUrl + '/createToken', {}, {
      headers: INX.requestHeaders
    })
      .then(function (response)
      {
        let token = response.data.websocketToken;
        //console.log(response);
        return token;
      })
      .catch(function (error)
      {
        console.log('ERROR: createWsToken ' + error);
        return 0;
      });
  }

  static async connectToOrderBook(marketName)
  {
    try
    {
      await INX.revokeWsToken();
      const token = await INX.createWsToken();
      if (token)
      {
        const socketOptions = {
          headers: {
            authorization: token,
            apiKey: INX.apiKeyId,
          },
        };

        const ws = new WS(INX.connectionUrl, socketOptions);

        ws.on('open', () =>
        {
          ws.send(
            JSON.stringify({
              event: 'orderBook/subscribeOrderBook',
              data: {
                marketName: marketName,
                depth: 20,
                clientRequestId: uuidv4.uuid()
              },
            }),
          );
        });
        ws.on('ERROR: readOrderBook, ws.on ', (err) =>
        {
          console.log(err);
        });
        ws.on('message', (msg) =>
        {
          msg = JSON.parse(msg);
          if (msg.event == "ORDER_BOOK")
          {
            INX.ready = true;
            _.each(msg.buy, function (trade)
            {
              if (trade.amount == 0) //delete price
                INX.buySet.delete(trade.price);
              else
                INX.buySet.push(trade.price);
            });
            _.each(msg.sell, function (trade)
            {
              if (trade.amount == 0) //delete price
                INX.sellSet.delete(trade.price);
              else
                INX.sellSet.push(trade.price);
            });
          }
        });
      }
    } catch (err)
    {
      console.log("ERROR: from readOrderBook " + err);
    }
  }

  static get BuyPrice()
  {
    if (INX.buySet && INX.buySet.max())
      return INX.buySet.max();

    return Number.NEGATIVE_INFINITY;
  }

  static get SellPrice()
  {
    if (INX.sellSet && INX.sellSet.min())
      return INX.sellSet.min();

    return Number.POSITIVE_INFINITY;
  }
}

module.exports = INX;