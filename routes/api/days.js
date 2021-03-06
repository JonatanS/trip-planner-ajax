var express = require('express');
var router = express.Router();
var models = require('../../models');
var Day = models.Day;
var Hotel = models.Hotel;
var Restaurant = models.Restaurant;
var Activity = models.Activity;
var Promise = require('bluebird');

//GET ALL: /api/days
router.get('/', function (req, res, next){
	Day.find({}).exec().then(function( days ){
		console.log("Days: " , JSON.stringify(days));
	res.send(days);
	}).then(null, next);
});

//CREATE: /api/days/add/params
router.post('/add', function (req, res, next){
	var myNum = parseInt(req.body.number, 10);
	console.log("number?" + myNum + typeof myNum);
	return Day.findOrCreate(myNum
	)
	.then(function(newDay){
		res.send(newDay);
	}).then(null, next);
});

//READ: /api/days/:id
router.get('/:dayNum', function (req, res, next){
	// console.log("reading day" + req.params.dayNum);
	return Day.findOne({number: req.params.dayNum})
	.populate('hotel')
	.populate('restaurants')
	.populate('activities')
	.then(function(day){
		console.log("returning day: " + JSON.stringify(day));
		res.send(day);
	}).then(null, next);
});

//UPDATE

//DELETE
router.get('/delete/:dayNum', function (req, res, next){
	return Day.findOne({number: req.params.dayNum})
	.then(function(day){
		day.remove();
	}).then(res.send("deleted"));
});

router.post('/:dayNumber/removeActivity', function (req, res, next){
	if(req.body.type === "activities") {
		var activity = Activity.findOne({name: req.body.placeName});
		var day = Day.findOne({number: req.params.dayNumber});
		Promise.all([activity, day])
		.then(function(info){
			var activity = info[0];
			var day = info[1];

			var deleteThis = day.activities.indexOf(activity._id);
			// console.log("we want to delete this", deleteThis);
			day.activities.splice(deleteThis, 1);
			day.save().then(null, next);
		})
	}

	if(req.body.type === "restaurants") {
		var restaurant = Restaurant.findOne({name: req.body.placeName});
		var day = Day.findOne({number: req.params.dayNumber});
		Promise.all([restaurant, day])
		.then(function(info){
			var day = info[1];
			var restaurant = info[0];
			var deleteThis = day.restaurants.indexOf(restaurant._id);
			day.restaurants.splice(deleteThis, 1);
			day.save().then(null, next);
		})
	}

	if(req.body.type === "hotels") {
		var hotel = Hotel.findOne({name: req.body.placeName});
		var day = Day.findOne({number: req.params.dayNumber});
		Promise.all([hotel, day])
		.then(function(info){
			var day = info[1];
			var hotel = info[0];
			// console.log(typeof day.hotel, typeof hotel._id);
			// console.log(day.hotel == hotel._id.toString());
			if (day.hotel == hotel._id.toString()) {
				day.hotel = null;
			}
			day.save().then(null, next);
		})
	}
});

router.post('/:dayNumber/addActivity', function (req, res, next){
	//find day by number
	// console.log("HELLO" + JSON.stringify(req.body));
	if(req.body.type === "activities") {
		var activity = Activity.findOne({name: req.body.placeName});
		var day = Day.findOne({number: req.params.dayNumber});
		Promise.all([activity, day])
		.then(function(info){
			var day = info[1];
			var activity = info[0];
			day.activities.push(activity);
			day.save().then(null, next);

		})
	}

	if(req.body.type === "restaurants") {
		var restaurant =  Restaurant.findOne({name: req.body.placeName});
		var day = Day.findOne({number: req.params.dayNumber});
		Promise.all([restaurant, day])
		.then(function(info){
			var day = info[1];
			var restaurant = info[0];
			day.restaurants.push(restaurant);
			day.save().then(null, next);
		})
	}

	if(req.body.type === "hotels") {
		var hotel =  Hotel.findOne({name: req.body.placeName});
		var day = Day.findOne({number: req.params.dayNumber});
		Promise.all([hotel, day])
		.then(function(info){
			var day = info[1];
			var hotel = info[0];
			day.hotel = hotel;
			day.save().then(null, next);
		})
	}
});



module.exports = router;