const axios = require('axios');
const cheerio = require('cheerio');
var logger = require('../utils/winston');

const productInfo = function(req, res, next){
    const url = req.query.url;
    let productInfo = {};
    let response = {};

    const start = Date.now();
    axios.get(url).then((html) => {
        const takenTime = Date.now() - start;
        logger.info(`Time taken to get Bestbuy information: ${takenTime} and URL: ${url}`);
        let $ = cheerio.load(html.data);
        productInfo['owner'] = "bestbuy";
        productInfo['price'] = $(".pricing-price.priceView-price").find(".priceView-hero-price.priceView-customer-price > span").first().text();
        if(productInfo['price']){
            productInfo['price'] = productInfo['price'].match(/([0-9,\.]+)/gm)[0].trim();
            productInfo['price'] = productInfo['price'].replace(",","");
        } else {
            productInfo['price'] = -1;
        }
        logger.info(productInfo['price']);
        productInfo['title'] = $(".sku-title > h1").text().replace(/\\n/gm, "").trim();
        productInfo['ratings'] = $(".popover-wrapper").find(".c-reviews").find(".c-review-average").text().trim();
        productInfo['url'] = url;
        response['error'] = 0;
        response['productInfo'] = productInfo;
        res.json(response);
    }).catch (function (e) {
        logger.error(e.message);
        response['error'] = 1;
        response['message'] = e.message;
    });
};

const getInfo = function(req, res){
    const product = req.params.p;
    const url = "https://www.bestbuy.com/site/searchpage.jsp?st="+product;
    let productsInfo = {};
    let totalItems = 3;
    let j = 0;
    let response = {};

    axios.get(url).then((html) => {
        let $ = cheerio.load(html.data);
        let itemList = $(".sku-item-list > li");
        for(let i = 0; i < itemList.length; i++){
            if(totalItems <= 0) break;
            const isProduct = $(itemList[i]).hasClass("sku-item");
            if(isProduct){
                totalItems--;
                productsInfo[j] = {};
                productsInfo[j]['price'] = $(itemList[i]).find(".price-block").find(".priceView-hero-price.priceView-customer-price > span").first().text();
                productsInfo[j]['price'] = productsInfo[j]['price'].match(/([0-9]+\.*[0-9]*)/gm)[0].trim();
                productsInfo[j]['productUrl'] = "http://bestbuy.com"+$(itemList[i]).find(".information").find(".sku-title > .sku-header > a").attr("href");
                productsInfo[j]['productName'] = $(itemList[i]).find(".information").find(".sku-title > .sku-header > a").text();
                productsInfo[j]['ratings'] = $(itemList[i]).find(".information").find(".ratings-reviews").find(".reviews-stats-list").find(".c-ratings-reviews-v2 > i").attr(`alt`).trim();
                productsInfo[j]['index'] = j;
                j++;
            }
        }
        response['error'] = 0;
        response['productsInfo'] = productsInfo;
        res.json(response);
    }).catch(function(e){
        logger.error(e.message);
        response['error'] = 1;
        response['message'] = e.message;
    });
}

exports.productInfo = productInfo;
exports.getInfo = getInfo;