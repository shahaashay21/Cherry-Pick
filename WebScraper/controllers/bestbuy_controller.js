const axios = require('axios');
const cheerio = require('cheerio');
var logger = require('../utils/winston');
var helper = require('../utils/helper');

const productInfo = async function(req, res, next){
    const url = req.query.url;
    let productInfo = {};
    let response = {};

    const start = Date.now();
    try {
        let html = await axios.get(url, {
            headers: {
                "user-agent": ""
            }
        });
        const takenTime = Date.now() - start;
        logger.info(`Time taken to get Bestbuy information: ${takenTime} and URL: ${url}`);
        let $ = cheerio.load(html.data);
        
        productInfo['store'] = "bestbuy";
        productInfo['price'] = $(".pricing-price.priceView-price").find(".priceView-hero-price.priceView-customer-price > span").first().text();
        
        if(productInfo['price']){
            productInfo['price'] = productInfo['price'].match(/([0-9,\.]+)/);
            if(productInfo['price'].length > 0){
                productInfo['price'] = productInfo['price'][0].trim();
                productInfo['price'] = productInfo['price'].replace(/\,/g,'');
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
    res.json(await getProductDetails(product));
}

function getProductDetails(p){
    return new Promise(async (resolve) => {
        const bestbuyMaxSearchChar = 90;
        let product = p;
        product = product.substring(0, bestbuyMaxSearchChar);
        const url = "https://www.bestbuy.com/site/searchpage.jsp?st="+product;
        let productsInfo = new Array();
        let totalItems = 1;
        let j = 0;
        let response = {};

        try{
            let html = await axios.get(url, {
                headers: {
                    "user-agent": ""
                }
            });
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
                    productsInfo[j]['store'] = "bestbuy";
                    productsInfo[j]['price'] = $(itemList[i]).find(".price-block").find(".priceView-hero-price.priceView-customer-price > span").first().text();

                    if(productsInfo[j]['price']){
                        productsInfo[j]['price'] = productsInfo[j]['price'].match(/([0-9,\.]+)/);
                        if(productsInfo[j]['price'].length > 0){
                            productsInfo[j]['price'] = productsInfo[j]['price'][0].trim();
                            productsInfo[j]['price'] = productsInfo[j]['price'].replace(/\,/g,'');
                        } else {
                            productsInfo[j]['price'] = -1;
                        }
                    } else {
                        productsInfo[j]['price'] = -1;
                    }

                    let ratingInfo = $(itemList[i]).find(".information").find(".ratings-reviews").find(".reviews-stats-list").find("p.sr-only").text();
                    let ratingInfoMatch = ratingInfo.match(/rating,.*?((?:[0-9]*[.])?[0-9]+).*with\s(\d+)\sreview/);
                    if(ratingInfoMatch && ratingInfoMatch.length > 0){
                        productsInfo[j]['ratings'] = ratingInfoMatch[1];
                        productsInfo[j]['reviews'] = ratingInfoMatch[2];
                    }

                    productsInfo[j]['link'] = "http://bestbuy.com"+$(itemList[i]).find(".information").find(".sku-title").find("a").attr("href");
                    productsInfo[j]['name'] = $(itemList[i]).find(".information").find(".sku-title").find("a").text();
                    productsInfo[j]['match'] = helper.stringSimilarity(product, productsInfo[j]['name']);
                    productsInfo[j]['img'] = $(itemList[i]).find(".image-column").find("img.product-image").attr("src");
                    productsInfo[j]['index'] = j;
                    j++;
                }
            }
            response['error'] = 0;
            response['productsInfo'] = productsInfo;
            return resolve(response);
        } catch (error) {
            logger.error(error.message);
            response['error'] = 1;
            response['message'] = error.message;
            return resolve(response);
        };
    });
}

exports.productInfo = productInfo;
exports.getProducts = getProducts;
exports.getProductDetails = getProductDetails;