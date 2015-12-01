$(function () {

    var map = initialize_gmaps();

    var placesForThisDay = [];
    // var days = [
    //     []
    // ];
    var numDays = 1;
    var currentDay = 1;

    //add 1 day to mongo if it doesnt exist:
    createDayInDb(1);

    $.get('/api/days', function (data) {
        var currentNumOfDays = data.length;
        numDays = currentNumOfDays;
        // console.log("numdays", numDays);
        setDayButtons();
        setDay(1);
        // createDayInDb(currentNumOfDays + 1);
    })
    .fail( function (err) {
        console.error('err', err)
    });

    var placeMapIcons = {
        activities: '/images/star-3.png',
        restaurants: '/images/restaurant.png',
        hotels: '/images/lodging_0star.png'
    };

    var $dayButtons = $('.day-buttons');
    var $addDayButton = $('.add-day');
    var $placeLists = $('.list-group');
    var $dayTitle = $('#day-title');
    var $addPlaceButton = $('.add-place-button');

    var createItineraryItem = function (placeName) {

        var $item = $('<li></li>');
        var $div = $('<div class="itinerary-item"></div>');

        $item.append($div);
        $div.append('<span class="title">' + placeName + '</span>');
        $div.append('<button class="btn btn-xs btn-danger remove btn-circle">x</button>');

        return $item;
    };

    var setDayButtons = function () {
        $dayButtons.find('button').not('.add-day').remove();
        for (var i = 1; i <= numDays; i++) {
            $addDayButton.before(createDayButton(i));
        }
    };

    var getPlaceObject = function (typeOfPlace, nameOfPlace) {

        var placeCollection = window['all_' + typeOfPlace];

        return placeCollection.filter(function (place) {
            return place.name === nameOfPlace;
        })[0];

    };

    var getIndexOfPlace = function (nameOfPlace, collection) {
        var i = 0;
        for (; i < collection.length; i++) {
            if (collection[i].place.name === nameOfPlace) {
                return i;
            }
        }
        return -1;
    };

    var createDayButton = function (dayNum) {
        return $('<button class="btn btn-circle day-btn"></button>').text(dayNum);
    };

    var reset = function () {

        // var dayPlaces = days[currentDay - 1];
        
        if (!placesForThisDay) return;

        $placeLists.empty();

        placesForThisDay.forEach(function (place) {
            place.marker.setMap(null);
        });

    };

    var removeDay = function (dayNum) {

        if (dayNum === 1) return;

        reset();

        $.get('/api/days/delete/' + dayNum, function (data) {
            console.log(data)
        })
        .fail( function (err) {
            console.error('err', err);
        })

        // days.splice(dayNum - 1, 1);
        numDays--;
        setDayButtons();
        setDay(1);

    };

    var mapFit = function () {

        var bounds = new google.maps.LatLngBounds();
        // var currentPlaces = days[currentDay - 1];

        placesForThisDay.forEach(function (place) {
            bounds.extend(place.marker.position);
        });

        map.fitBounds(bounds);

    };

    var setDay = function (dayNum) {

        // if (dayNum > days.length || dayNum < 0) {
        //     return;
        // }

        // var placesForThisDay = days[dayNum - 1];

        placesForThisDay = [];
        $.get('/api/days/' + dayNum, function (data) {
            var $dayButtons = $('.day-btn').not('.add-day');
            reset();
            
            var placeMarkers = [];
            currentDay = dayNum;
            if (data.hotel) {
                placesForThisDay.push(data.hotel);
                placesForThisDay[placesForThisDay.length-1].section = 'hotels';
                var myMarker = drawLocation(map, data.hotel.place[0].location, {
                    icon: placeMapIcons['hotels']
                });
                // console.log('this is the marker', myMarker);
                placesForThisDay[placesForThisDay.length-1].marker = myMarker;
                // console.log(placesForThisDay);
            }
            // debugger;
            data.restaurants.forEach(function (restaurant) {
                placesForThisDay.push(restaurant);
                placesForThisDay[placesForThisDay.length-1].section = 'restaurants';
                var myMarker = drawLocation(map, restaurant.place[0].location, {
                    icon: placeMapIcons['restaurants']
                });
                // console.log('this is the marker', myMarker);
                placesForThisDay[placesForThisDay.length-1].marker = myMarker;
            });
            
            data.activities.forEach(function (activity) {
                placesForThisDay.push(activity);
                placesForThisDay[placesForThisDay.length-1].section = 'activities';
                var myMarker = drawLocation(map, activity.place[0].location, {
                    icon: placeMapIcons['activities']
                });
                // console.log('this is the marker', myMarker);
                placesForThisDay[placesForThisDay.length-1].marker = myMarker;
            })

            placesForThisDay.forEach(function (place) {
                // console.log(place);
                $('#' + place.section + '-list').find('ul').append(createItineraryItem(place.name));
                place.marker.setMap(map);
            });

            $dayButtons.removeClass('current-day');
            $dayButtons.eq(dayNum - 1).addClass('current-day');

            $dayTitle.children('span').text('Day ' + dayNum.toString());

            mapFit();
        })
        .fail( function (err) {console.error('err', err)} );

    };

    $addPlaceButton.on('click', function () {

        console.log("About to add activity");
        var $this = $(this);
        var sectionName = $this.parent().attr('id').split('-')[0];
        var $listToAppendTo = $('#' + sectionName + '-list').find('ul');
        var placeName = $this.siblings('select').val();
        var placeObj = getPlaceObject(sectionName, placeName);

        var createdMapMarker = drawLocation(map, placeObj.place[0].location, {
            icon: placeMapIcons[sectionName]
        });
        // days[currentDay - 1].push({place: placeObj, marker: createdMapMarker, section: sectionName});
        $listToAppendTo.append(createItineraryItem(placeName));
        mapFit();
        //ajax post to Day mongoDB
        //find Day ID
        $.ajax({
            method: "POST",
            url: '/api/days/' + currentDay + '/addActivity',
            data: {type: sectionName, placeName: placeName},
            success: function(){
                console.log("added activities?!");
            },
            error: function (err) {
                console.log("could not add activities" + err);
            }
        }); 

    });

    $placeLists.on('click', '.remove', function (e) {

        var $this = $(this);
        var $listItem = $this.parent().parent();
        var nameOfPlace = $this.siblings('span').text();
        
        // days in undefined
        // var indexOfThisPlaceInDay = getIndexOfPlace(nameOfPlace, days[currentDay - 1]);
        // var placeInDay = days[currentDay - 1][indexOfThisPlaceInDay];
        var placeType = $this.parent().parent().parent().parent().attr('id').split('-')[0];
        console.dir(placeType)
        // placeInDay.marker.setMap(null);
        // days[currentDay - 1].splice(indexOfThisPlaceInDay, 1);
        $listItem.remove();

        $.ajax({
            method: "POST",
            url: '/api/days/' + currentDay + '/removeActivity',
            data: {type: placeType, placeName: nameOfPlace},
            success: function(){
                console.log("deleted activities?!");
            },
            error: function (err) {
                console.log("could not delete activities" + err);
            }
        }); 

    });

    $dayButtons.on('click', '.day-btn', function () {
        console.dir($(this));
        console.log($(this).index() +1);
        if(!$(this).hasClass('add-day')){
            setDay($(this).index() + 1);
        }
    });

    $addDayButton.on('click', function () {
        console.log("Adding Day");

        $.ajax({
            method: "POST",
            url: '/api/days/add',
            data: {number: numDays + 1},
            success: function(data){
                numDays++;
                console.log("new numDays", numDays);
                var $newDayButton = createDayButton(numDays);

                $addDayButton.before($newDayButton);
                setDayButtons();
                setDay(numDays);
            },
            error: function (err) {
                console.log(err);
            }
        }); 
    });

    $dayTitle.children('button').on('click', function () {

        removeDay(currentDay);

    });

    function createDayInDb(dayNum, cb) {
               //add new day to mongo:
               
        $.ajax({
            method: "POST",
            url: '/api/days/add',
            data: {number: dayNum},
            success: cb,
            error: function (err) {
                console.log(err);
            }
        }); 
    }
});

