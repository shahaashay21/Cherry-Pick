const axios = require('axios');
const cheerio = require('cheerio');
var logger = require('../utils/winston');
var stringSimilarity = require('string-similarity');

const productInfo = async function(req, res, next){
    const url = req.query.url;
    let productInfo = {};
    let response = {};

    const start = Date.now();
    try {
        let html = await axios.get(url);
        const takenTime = Date.now() - start;
        logger.info(`Time taken to get Bestbuy information: ${takenTime} and URL: ${url}`);
        let $ = cheerio.load(html.data);
        
        productInfo['owner'] = "bestbuy";
        productInfo['price'] = $(".pricing-price.priceView-price").find(".priceView-hero-price.priceView-customer-price > span").first().text();
        
        if(productInfo['price']){
            productInfo['price'] = productInfo['price'].match(/([0-9,\.]+)/);
            if(productInfo['price'].length > 0){
                productInfo['price'] = productInfo['price'][0].trim();
                productInfo['price'] = productInfo['price'].replace(",","");
            } else {
                productInfo['price'] = -1;    
            }
        } else {
            productInfo['price'] = -1;
        }

        productInfo['name'] = $(".sku-title > h1").text().replace(/\\n/gm, "").trim();
        productInfo['ratings'] = $(".popover-wrapper").find(".c-reviews").find(".c-review-average").text().trim();
        productInfo['img'] = $(".shop-media-gallery").find(".thumbnail-list").find(".image-thumbnail").find("img").attr("src");
        productInfo['link'] = url;
        response['error'] = 0;
        response['productInfo'] = productInfo;
        
        res.json(response);
    } catch (error) {
        logger.error(error.message);
        response['error'] = 1;
        response['message'] = error.message;
        res.json(response);
    };
};

const getProducts = async function(req, res){
    let product = req.params.p;
    const bestbuyMaxSearchChar = 90;
    product = product.substring(0, bestbuyMaxSearchChar);
    const url = "https://www.bestbuy.com/site/searchpage.jsp?st="+product;
    let productsInfo = new Array();
    let totalItems = 3;
    let j = 0;
    let response = {};

    try{
        let html = await axios.get(url);
        let $ = cheerio.load(html.data);
        let itemList = $(".sku-item-list > li");
        logger.info(`Itemlist length: ${itemList.length} and URL: ${url}`);
        for(let i = 0; i < itemList.length; i++){
            if(totalItems <= 0) break;
            const isProduct = $(itemList[i]).hasClass("sku-item");
            if(isProduct){
                totalItems--;
                productsInfo[j] = {};
                productsInfo[j]['match'] = 0; // Initialize
                productsInfo[j]['owner'] = "bestbuy";
                productsInfo[j]['price'] = $(itemList[i]).find(".price-block").find(".priceView-hero-price.priceView-customer-price > span").first().text();

                if(productsInfo[j]['price']){
                    productsInfo[j]['price'] = productsInfo[j]['price'].match(/([0-9,\.]+)/);
                    if(productsInfo[j]['price'].length > 0){
                        productsInfo[j]['price'] = productsInfo[j]['price'][0].trim();
                        productsInfo[j]['price'] = productsInfo[j]['price'].replace(",","");
                    } else {
                        productsInfo[j]['price'] = -1;
                    }
                } else {
                    productsInfo[j]['price'] = -1;
                }

                productsInfo[j]['link'] = "http://bestbuy.com"+$(itemList[i]).find(".information").find(".sku-title").find("a").attr("href");
                productsInfo[j]['name'] = $(itemList[i]).find(".information").find(".sku-title").find("a").text();
                productsInfo[j]['match'] = stringSimilarity.compareTwoStrings(product.toLowerCase(), productsInfo[j]['name'].toLowerCase());
                productsInfo[j]['ratings'] = $(itemList[i]).find(".information").find(".ratings-reviews").find(".reviews-stats-list").find(".c-ratings-reviews-v2 > i").attr(`alt`).trim();
                productsInfo[j]['img'] = $(itemList[i]).find(".image-column").find("img.product-image").attr("src");
                productsInfo[j]['index'] = j;
                j++;
            }
        }
        response['error'] = 0;
        response['productsInfo'] = productsInfo;
        res.json(response);
    } catch (error) {
        logger.error(error.message);
        response['error'] = 1;
        response['message'] = error.message;
        res.json(response);
    };
}

exports.productInfo = productInfo;
exports.getProducts = getProducts;