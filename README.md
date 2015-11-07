# PxPoint
PxPoint is a system for aggregating market data from multiple sources, 
retransmitting it, storing it, and performing analytics.

PxPoint uses Redis as its backend for storing data, 
and interacts with clients using WebSockets.

To run PxPoint you will need to use an adapter for the 
market you wish to receive data from. PxPoint is currently configured to
receive data from Coinbase. 
You can find it [here](https://github.com/bjackson/pxpoint-coinbase).
Just clone the pxpoint-coinbase repo and
run `npm link <path to pxpoint-coinbase>`
to install it.

Suggestions and pull requests are greatly welcomed.
