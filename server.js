var express = require('express');
var app = express();
var bodyParser = require('body-parser');
 
var urlencodedParser = bodyParser.urlencoded({ extended: false })
 
app.use(express.static('public'));
 
app.get('/', function (req, res) {
    res.sendFile( __dirname + "/" + "test.html" );
});


app.get('/test.html', function (req, res){
    res.sendFile( __dirname + "/" + "test.html");
});

app.get('/search', urlencodedParser, function(req, res){

    var keyword = req.query.keyword.trim();
    var distance = req.query.distance * 1609.344;
    var lat = parseFloat(req.query.lat);
    var lon = parseFloat(req.query.lon);
    var type = req.query.type;
    var from = req.query.from;
    console.log(req.query);
    var location;
    var flag = true;

    var async1 = require('async');
    async1.series([
        function(callback){
            if(from != "current"){
                location = req.query.location.trim();
                location = location.replace(" ", "+");
                var geoURL = "https://maps.googleapis.com/maps/api/geocode/json?address=" + location + "&key=AIzaSyBG0sxDgVMTE-HrxNiC94h5zBFlFBj_1Aw";
                rp = require("request-promise");
                var options = {
                    uri: geoURL,
                    json: true
                };
                rp(options)
                    .then(function(response){
                        if(response.status == "OK"){
                            lat = response.results[0].geometry.location.lat;
                            lon = response.results[0].geometry.location.lng;
                        }
                        else{
                            flag = false;
                        }
                        console.log("geocoding finished");
                        callback(null,1);
                    })
                    .catch(function(err){
                        console.log(err);
                    })
            }
            else{
                callback(null,1);
            }
        },
        function(callback){
            console.log("enter main");
            console.log(lat + " " + lon);
            if(flag){
                
                if(type == "default"){
                    console.log("default");
                    var searchURL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + lat + "," + lon + "&radius=" + distance + "&keyword=" + keyword + "&key=AIzaSyBG0sxDgVMTE-HrxNiC94h5zBFlFBj_1Aw";
                }
                else{
                    console.log("not default");
                    var searchURL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + lat + "," + lon + "&radius=" + distance + "&keyword=" + keyword +"&type=" + type +"&key=AIzaSyBG0sxDgVMTE-HrxNiC94h5zBFlFBj_1Aw";
                }
                console.log(searchURL);

                var rp = require("request-promise")
                var options = {
                    uri: searchURL,
                    json: true // Automatically parses the JSON string in the response
                };

                var returnJson;
                var returnData;
                var time = 2000;
                rp(options)
                    .then(function(response){
                        returnJson = response;
                        returnJson["lat"] = lat;
                        returnJson["lon"] = lon;
                        var fs = require('fs');
                        //fs.writeFile('response1.json', JSON.stringify(response));

                        if(response.next_page_token){
                            var searchURL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken="+ response.next_page_token+ "&key=AIzaSyBG0sxDgVMTE-HrxNiC94h5zBFlFBj_1Aw";
                            var options = {
                                uri: searchURL,
                                json: true
                            };
                            setTimeout(function(){
                                rp(options)
                                .then(function(response2){
                                    var fs = require('fs');
                                    returnJson["results2"] = response2.results;
                                    //fs.writeFile('response2.json', JSON.stringify(response2));
                                    if(response2.next_page_token){
                                        var searchURL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken="+ response2.next_page_token+ "&key=AIzaSyBG0sxDgVMTE-HrxNiC94h5zBFlFBj_1Aw";
                                        var options = {
                                            uri: searchURL,
                                            json:true
                                        };
                                        setTimeout(function(){
                                            rp(options)
                                            .then(function(response3){
                                                var fs = require('fs');
                                                returnJson["results3"] = response3.results;
                                                //fs.writeFile('response3.json', JSON.stringify(response3));
                                                //fs.writeFile('returnJson.json',JSON.stringify(returnJson));
                                                res.end(JSON.stringify(returnJson));
                                            })
                                            .catch(function(err2){
                                                console.log(err2);
                                            })
                                        }, time);
                                    }
                                    else{
                                        //fs.writeFile('returnJson.json',JSON.stringify(returnJson));
                                        res.end(JSON.stringify(returnJson));
                                    }
                                })
                                .catch(function(err1){
                                    console.log(err1);
                                })
                            }, time);
                        }
                        else{
                            //fs.writeFile('returnJson.json',JSON.stringify(returnJson));
                            res.end(JSON.stringify(returnJson));
                        }
                    })
                    .catch(function(err){
                        console.log(err);
                    });
            }
            else{
                res.end(JSON.stringify("NO"));
            }
            callback(null,2);
        }
    ],function(err, results) {
        console.log(results);
    });

});

app.get('/detail', urlencodedParser, function(req, res){
    var place_id = req.query.place_id;

    var rp = require('request-promise');
    var uri = "https://maps.googleapis.com/maps/api/place/details/json?placeid=" + place_id + "&key=AIzaSyBG0sxDgVMTE-HrxNiC94h5zBFlFBj_1Aw";

    options ={
        uri: uri,
        json:true
    }
    console.log(place_id);
    rp(options)
        .then(function(response){
            var fs = require('fs');
            fs.writeFile('detail.json',JSON.stringify(response));

            async = require('async');
            if(response.result.photos){
                var returnPhotos = response.result.photos;
                for(var i = 0; i<returnPhotos.length; ++i){
                    var request = require('request');
                    async.series([
                        function(){
                            photoURL = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=" + returnPhotos[i].photo_reference + "&key=AIzaSyBG0sxDgVMTE-HrxNiC94h5zBFlFBj_1Aw";
                            request(photoURL)
                                .on('error',function(err){
                                    console.log(err);
                                })
                                .pipe(fs.createWriteStream('public/normal/' + i + '.jpeg'))
                                .on('error', function(err){
                                    console.log(err);
                                });
                           /*photoURL = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photoreference=" + returnPhotos[i].photo_reference + "&key=AIzaSyBG0sxDgVMTE-HrxNiC94h5zBFlFBj_1Aw";
                            request(photoURL)
                                .on('error',function(err){
                                    console.log(err);
                                })
                                .pipe(fs.createWriteStream('public/images/' + i + '.jpeg'))
                                .on('error', function(err){
                                    console.log(err);
                                });*/
                        },
                    setTimeout(function(){

                    },300)
                    ]);               
                }
            }

            var address = response.result.address_components;
            var address1;
            if(response.result.formatted_address.length>64){
                address1 = response.result.formatted_address.substr(0,64);
            }
            else{
                address1 = response.result.formatted_address;
            }
            var city;
            var state;
            if(response.result.name.length >64){
                name = response.result.name.substr(0,64);
            }
            else{
                name = response.result.name;
            }
            for(var i =0; i < address.length; ++i){
                if(address[i].types[0] == 'administrative_area_level_2'){
                    city = address[i].long_name;
                }
                if(address[i].types[0] == 'administrative_area_level_1'){
                    state = address[i].short_name;
                    break;
                }
            }

            var yelpKey = 'hqsp-n-NvTIe-YLGxN7lBmAQ-t9dw4NRPW9ETATt5Dg_CNTotQyRapPsPlp1i1i9Qitu34_xmtRfZkwmD7K0ygWyo-3ssCTaa-qiCG6IiSHxEA7iih5odIYlL7POWnYx';
 
            const yelp = require('yelp-fusion');
             
            const client = yelp.client(yelpKey);
             
            // matchType can be 'lookup' or 'best'
            var businessId;
            async.series([function() {
                client.businessMatch('best', {
                    name: name,
                    address1: address1,
                    city: city,
                    state: state,
                    country: 'US'
                }).then(responseY => {
                    //fs.writeFile('yelpBest.json', JSON.stringify(responseY));
                    if(responseY.jsonBody.businesses[0]){
                        businessId = responseY.jsonBody.businesses[0].id;
                        console.log("entered yelp review");
                        client.reviews(businessId).then(responseR => {
                            //fs.writeFile('yelpReview.json', JSON.stringify(responseR));
                            console.log("return response");
                            if(responseR.jsonBody.reviews){
                                response['yelp'] = responseR.jsonBody.reviews;
                                fs.writeFile('finalResponse.json', JSON.stringify(response));
                                res.end(JSON.stringify(response));
                            }
                            else{
                                res.end(JSON.stringify(response));
                            }
                        }).catch(e => {
                            console.log(e);
                        });
                    }
                    else{
                        res.end(JSON.stringify(response));
                    }
                }).catch(e => {
                    console.log(e);
                });
            }
            ]);


            //console.log("return response");
            //res.end(JSON.stringify(response));
        })
        .catch(function(err){
            console.log(err);
        });

});
 
 
var server = app.listen(8081, function () {
 
    var host = server.address().address;
    var port = server.address().port;
    
    console.log("应用实例，访问地址为 http://%s:%s", host, port)
 
});
