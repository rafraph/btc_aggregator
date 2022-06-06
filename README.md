# btc_aggregator
Demonstrate an aggregator of BTC price. Compares the price of INX vs Bitfinex and print the better price (sell/buy)

## How to use?
Clone the repository and 'cd btc_aggregator'.
Run 'npm install'.
Copy to btc_aggregator directory the two files you got from INX when creating an account for API:
1. The file of your INX private key
2. The file of your apiKeyId

Run the project with 'node app'

## What it does?
This program register to the Order Book of INX and Bitfinex.

It save the orders in an order set and update it when new order arrived.

Every 1.5 second it compares the prices and print to the console the best Buy/Sell price between the two platforms.
