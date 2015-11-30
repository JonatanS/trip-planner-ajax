var mongoose = require('mongoose');
var hotelSchema = require ('./hotel').schema;
var restaurantSchema = require ('./restaurant').schema;
var activitySchema = require ('./activity').schema;

var daySchema = new mongoose.Schema({
	number: {type: Number},
	hotel : {type: mongoose.Schema.Types.ObjectId,
        		ref: 'Hotel'
    		},
	restaurants : [{type: mongoose.Schema.Types.ObjectId,
        		ref: 'Restaurant'
    		}],
	activities : [{type: mongoose.Schema.Types.ObjectId,
        		ref: 'Activity'
    		}]
});

daySchema.statics.findOrCreate = function (dayNumber) {
	console.log(dayNumber);
	var self = this;

	return this.findOne({number: parseInt(dayNumber)}).exec()
		.then(function (day) {
			if (day === null) {
				return self.create({number: parseInt(dayNumber)});
			} else return day;
		});
};

module.exports = mongoose.model('Day', daySchema);