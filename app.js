const api = require('binance');
const lodash = require('lodash');
const binanceWS = new api.BinanceWS();
const streams = binanceWS.streams;
//const ALTS = ["COCOS", "OAX", "GVT", "MTL", "COTI", "TCT", "WRX", "OGN", "LTO", "EVX", "KAVA", "XTZ", "RLC", "PERL", "EDO", "ARPA", "FUEL", "BAND", "GNT", "ICX", "QLC", "ONE", "POA", "LEND", "WPR", "IOST", "VET", "FET", "GRS", "MATIC", "ZIL", "VIA", "INS", "ADX", "SYS", "REN", "TOMO", "HBAR", "RCN", "NANO", "ADA", "BRD", "APPC", "CHZ", "SNM", "LRC", "GO", "HC", "QTUM", "REQ", "BNB", "XMR", "ZEC", "BEAM", "STX", "LINK", "BLZ", "BTG", "ALGO", "DUSK", "PPT", "NEBL", "ETH", "ONG", "BAT", "EOS", "NEO", "ERD", "DREP", "AMB", "TRX", "GAS", "ONT", "POE", "BTS", "CND", "MITH", "COS", "OST", "SC", "XVG", "VIBE", "BCPT", "WAN", "DLT", "DNT", "ANKR", "MFT", "HOT", "FTT", "MDA", "DCR", "ATOM", "XRP", "LTC", "STPT", "PIVX", "XZC", "LOOM", "WABI", "ETC", "DASH", "VITE", "MCO", "ARK", "XLM", "YOYO", "ZRX", "CMT", "QSP", "BQX", "AE", "LUN", "ARN", "RDN", "AION", "TNT", "OMG", "STRAT", "BCD", "NXS", "AGI", "KMD", "LSK", "SKY", "CTXC", "ENG", "CVC", "ENJ", "BNT", "WAVES", "POLY", "IOTA", "FTM", "XEM", "CDT", "DATA", "THETA", "GXS", "STORJ", "RVN", "KNC", "SNGLS", "NAS", "POWR", "ARDR", "REP", "GTO", "DOCK", "MANA", "IOTX", "STEEM", "WTC", "ZEN", "NAV", "SNT", "VIB", "TROY", "DOGE", "ELF", "TFUEL", "FUN", "CELR", "NKN", "MBL", "AST", "QKC", "STORM", "NULS", "TNB", "PHB"];
const ALTS = ["ETH", "BNB", "XRP"]; //

/**
 * NOTE :
 * rajouter les satoshis lors de la détection
 */
const limitSatoshis = 0.00000200;
const timeframe_10000 = 3000;
const timeframe_20000 = 20000;
const timeframe_30000 = 30000;
const seuil_1 = 1;
const seuil_2 = 1;
let objet1_1;
let objet1_2;
let objet2_1;
let objet2_2;
let objet3_1;
let objet3_2;

(async () => {

  let objData = initTradeObjData(ALTS);
  binanceWS.onCombinedStream(generateTradeStreams(ALTS),
    (streamEvent) => {
      objData = getTradesDataFromStream(streamEvent, objData);
    }
  );

  // 10SEC
  setInterval(() => {
    if (!objet1_1) {
      objet1_1 = parseObject(objData);
    } else if (objet1_1 && !objet1_2) {
      objet1_2 = parseObject(objData);
    }

    if (objet1_1 && objet1_2) {
      /* console.log('objet1_1 avant', objet1_1)
      console.log('objData', objData)
      console.log('objet1_1', objet1_1)
      console.log('objet1_2', objet1_2) */
      objet1_1 = parseObject(objet1_2);
      objet1_2 = parseObject(objData);

      compareTradesValues(objet1_1, objet1_2, seuil_1, timeframe_10000);
    }
  }, timeframe_10000);


  // 20SEC
  /* setInterval(() => {
    if (!objet2_1) {
      objet2_1 = JSON.parse(JSON.stringify(objData));;
    } else if (objet2_1 && !objet2_2) {
      objet2_2 = JSON.parse(JSON.stringify(objData));;
    }

    if (objet2_1 && objet2_2) {
      objet2_1 = JSON.parse(JSON.stringify(objet2_2));
      objet2_2 = JSON.parse(JSON.stringify(objData));
      compareValues(objet2_1, objet2_2, seuil_2, timeframe_20000);
    }
  }, timeframe_20000); */

})();


/**
 * ########## FONCTION ##########
 */
function getChangeDataFromStream(stream, objData) {
  const streamSymbol = stream.data.symbol.substring(0, stream.data.symbol.length - 3);
  if (Number(stream.data.currentClose).toFixed(8) >= limitSatoshis) {
    objData[streamSymbol] = stream.data.currentClose;
  }
  return objData;
}


function getTradesDataFromStream(stream, objData) {
  const streamSymbol = stream.data.symbol.substring(0, stream.data.symbol.length - 3);
  objData[streamSymbol].trades = stream.data.kline.trades;
  objData[streamSymbol].close = stream.data.kline.close;
  return objData;
}


function compareChangeValues(objet1, objet2, seuil, timeframe) {
  for (const coin1 in objet1) {
    const value1 = Number(objet1[coin1]);
    for (const coin2 in objet2) {
      const value2 = Number(objet2[coin2]);

      if (coin1 === coin2 && value2 > value1 && value1 !== 0) {
        const diff = round((((value2 - value1) / value2) * 100), 2).toFixed(2);
        if (diff >= seuil && diff !== 0) {
          console.log(getDate() + ' | ' + coin1.toString().padStart(5, ' ') + ' ' + diff + '%' + ' en ' + timeframe / 1000 + 's'
            + ' | Prix : ' + value2)
        }
      }
    }
  }
}


function compareTradesValues(objet1, objet2, seuil, timeframe) {
  console.log('objet1', objet1)
  console.log('objet2', objet2)
  for (const coin1 in objet1) {
    const value1 = Number(objet1[coin1].trades);
    for (const coin2 in objet2) {
      const value2 = Number(objet2[coin2].trades);
      const close = Number(objet2[coin2].close);

      if (coin1 === coin2 && value2 > value1 && value1 !== 0) {
        const diff = value2 - value1;
        const prCent = round(((diff / value2) * 100), 2).toFixed(2);
        if (diff >= seuil && diff !== 0) {
          console.log(getDate() + ' | ' + coin1.toString().padStart(5, ' ') + ' ' + diff + ' trades' + ' en ' + timeframe / 1000 + 's'
            + ' | Prix : ' + close);
        }
      }
    }
  }
}


function parseObject(objet) {
  let resultObj = {};
  for (const key in objet) {
    /* console.log('key', key)
    console.log('objet', objet)
    console.log('objet[key]', objet[key]) */
    resultObj[key] = [];
    resultObj[key].trades = objet[key].trades;
    resultObj[key].close = objet[key].close;
  }
  //console.log('resultObj', resultObj)
  return resultObj;
}

function getDate() {
  const date = new Date();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const seconde = date.getSeconds();
  return day.toString().padStart(2, '0') + "/" + month.toString().padStart(2, '0') + "/" + year.toString()
    + " " + hour.toString().padStart(2, '0') + ":" + minute.toString().padStart(2, '0') + ":" + seconde.toString().padStart(2, '0');
}


function initChangeObjData(ALTS) {
  const obj = {};
  ALTS.forEach(element => {
    obj[element] = [];
  });
  return obj;
}


function initTradeObjData(ALTS) {
  const obj = {};
  ALTS.forEach(element => {
    obj[element] = [];
    obj[element].trades = '';
    obj[element].close = '';
  });
  return obj;
}

function generateChangeStreams(array) {
  const result = [];
  for (const key in array) {
    result.push(streams.ticker(array[key] + 'BTC'));
  }
  return result;
}


function generateTradeStreams(array) {
  const result = [];
  for (const key in array) {
    result.push(streams.kline(array[key] + 'BTC', '12h'));
  }
  return result;
}


function sleep(delay) {
  var start = new Date().getTime();
  while (new Date().getTime() < start + delay);
}


function round(value, precision) {
  const multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
}
