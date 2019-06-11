# 2019-05-24 14:48:09

## Simulator Realistic Data

- get mktdata snapshots for every refdata we have
- load those as a base and use a small variance of PENNIES

# 2019-04-09 08:58:44

## Market Data Standalone Service

- Update Quote usage in Sales Credit
- Update Quote usage in server
- Update gateway to give quotes to mktdata instead**

## Unable to get refdata issues 

At midnight, the collections are cleared but market data is still publishing. This results in metric pipelines attempting to run, which fail since there are no security data in the system until the next agent push. The agent does not push until it resets since it sees the files have not changed. Perhaps a reset can clear the last load time which would alleviate this

Ideally there's no reason to be subscribed after close of business

## Recompute errors

Happen from ~2am until agent restart

# 2019-02-14 10:24:27


## Rates01/Spread01/Hedge01

- hedgedRatesPercent (can be manually overriden in UI)
  - 100% for Spread Price Type Securities or GOVT 
  - 0% for all others

### Bonds / Corps

- rates01
  - Formula: dv01 / 100 * position / fxRate
- spread01
  - Assigned the value of rates01
- hedge01
  - rates01 * hedgedRatesPercent

### CDS
- spread01
  - spread01 (from webcalc) * directionFactor / fxRate
- rates01
  - rates01 (from webcalc) / fxRate

## Market Data ID's

## On The Run

- If it contains FX_PRICING_SOURCE
 - pass along to mktdata, and request as ${CDS_INDEX_ID} ${FX_PRICING_SOURCE} Curncy

 - This will map the quote correctly to the security we have for this identifier

- If it does not contain FX_PRICING_SOURCE
  - Request refdata with ${CDS_INDEX_ID} Corp
    - This record will contain an ID_BB_UNIQUE that can properly request mktdata
    - Return this refdata as the one associated with the position/trade

# How eodSpread is populated

- EOD Spread is set from either the existing positions closingSpread or a calculated "metric" closingSpread
- The calculated closingSpread comes from the associated quote. The quote must have either
    - a spread mark
    - a benchmark quote containing a yld
- The spread is then calculated by either taking the quote spread mark or:
   - (currentYld - benchmarkYld) * 10000

## How the quote is populated

- When a security is processed, if it has a benchmark (isBenchmarkable) its benchmark is set and calculated via webcalc to return 

# 2019-01-16 16:23:07

## PM2 App monitoring
```javascript
var axon  = require('pm2-axon');
var sub = axon.socket('sub-emitter');
sub.connect([socket path]); // [socket path] is '~/.pm2/pub.sock' by default.
sub.on('process:*', function(e, d){
    if(d.event == 'restart' || d.event == 'exit'){
        // code goes here. 
        //   process name: d.process.name
        //   logs: d.process.pm_out_log_path, d.process.pm_err_log_path
    }
  });
```
