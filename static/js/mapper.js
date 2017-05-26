var map, markers, markerForm, saveMarker, deleteMarker, markerTable, markerFormSmall, saveMarkerSmall;
function initMap() {

    markers = [];
    markerForm = $('#marker-form');
    markerFormSmall = $('#marker-form-small');
    saveMarker = $('#save-marker');
    saveMarkerSmall = $('#save-marker-small');
    deleteMarker = $('#delete-marker');
    markerTable = $('#marker-table');

    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 37.773972, lng: -122.431297 },
        zoom: 13
    });

    var setMapMarkers = function () {

        $.ajax({
            method: "GET",
            url: '/api/marker',
            dataType: "json",
            contentType: "application/json"

        }).done(function (data) {

            $.each(data.objects, function (index, item) {

                var marker = new Marker(item);

                markers.push(marker);

            });


        }).fail(function () {
            alert('something went wrong');
        });

    };

    var Marker = function (thing) {

        var result = {}

        result = new google.maps.Marker({
            position: { lat: thing.lat, lng: thing.lng },
            map: map
        });

        result.id = thing.id;

        var infowindow = new google.maps.InfoWindow({

            content: thing.title

        });

        result.addListener('mouseover', function () {

            infowindow.open(map, result);

        });

        infowindow.open(map, result);

        return result;

    }

    setMapMarkers();

    markerDataTable = markerTable.DataTable({
        ajax: function (data, callback, settings) {
            $.ajax({
                method: "GET",
                url: "/api/marker",
                dataType: "json",
                contentType: "application/json; charset=UTF-8",
                success: function (results) {
                    // do something with the results.
                    callback({ draw: data.draw, recordsTotal: results.objects.length, data: results.objects });
                }
            });
        },
        columns: [
            { data: "id", defaultContent: "", title: "id" },
            { data: "title", defaultContent: "N/A", title: "title" },
            { data: "description", defaultContent: "N/A", title: "description" },
            { data: "lat", defaultContent: "", title: "latitude" },
            { data: "lng", defaultContent: "", title: "longitude" },

        ],
        select: true,
        dom: 'ftip',
        initComplete: function(settings, json){
            var api = this.api();
            
            api.on('select', function(e, dt, type, indexes){

                 $('#delete-marker').removeClass('disabled').attr('disabled', false);

                var selectedRowCount =  dt.rows({ selected: true }).length;
                if(selectedRowCount > 0){
                   
                }

            });

            api.on('deselect', function(e, dt, type, indexes){
                  $('#delete-marker').addClass('disabled').attr('disabled', true);
            });
        }
    });

    
    map.addListener('click', function (args) {

        var clickedPosition = args.latLng;

        var marker = new google.maps.Marker({

            position: clickedPosition,
            map: map,
            title: clickedPosition.toString()

        });

        marker.id = guid();

        markers.push(marker);

        updateSidePanel(clickedPosition.lat().toString(), clickedPosition.lng().toString());

        saveMarker.removeClass('disabled').removeAttr('disabled');
        saveMarkerSmall.removeClass('disabled').removeAttr('disabled');
        

        marker.addListener('click', function () {

            deleteMarker(map, marker);
            saveMarker.addClass('disabled');
            saveMarkerSmall.addClass('disabled');
            updateSidePanel("", "");

        });

    });

    var addMarkerToDb = function(markerThingy, formSelector){
        $.ajax({
            method: "POST",
            url: "/api/marker",
            data: JSON.stringify(markerThingy),
            dataType: "json",
            contentType: "application/json"
        }).done(function (data) {

            resetForm(formSelector);

            var markerToDelete = markers.pop();
            markerToDelete.setMap(null);

            var newMarker = new Marker(data);
            markers.push(newMarker);

            markerDataTable.ajax.reload(null, false);

        }).fail(function () { alert('something went wrong.') });
    }


    saveMarker.on('click', function () {

        var formSelector = markerForm;

        var newMarker = getMarkerFromForm(formSelector);

        addMarkerToDb(newMarker, formSelector);

    });


     saveMarkerSmall.on('click', function () {

        var formSelector = markerFormSmall;

        var newMarker = getMarkerFromForm(formSelector);

        addMarkerToDb(newMarker, formSelector);

    });

    deleteMarker.on('click', function () {

        var selectedRow = markerDataTable.row({ selected: true });

        var marker = selectedRow.data();

        $.ajax({
            method: "DELETE",
            url: "/api/marker/" + marker.id,
            dataType: "json",
            contentType: "application/json"

        }).done(function () {

            deleteMarker(map, marker);  

            $('#delete-marker').addClass('disabled').attr('disabled', true);

            markerDataTable.ajax.reload(null, false);

        }).fail(function () {
            alert('something went wrong');
        })

    });


    var updateSidePanel = function (lat, long) {

        $('.marker-lat').text(lat);
        $('.marker-long').text(long);

    }

    var getMarkerFromForm = function (form) {

        var result = {};

        result.lat = form.find('.marker-lat').text();
        result.lng = form.find('.marker-long').text();
        result.title = form.find('#marker-title').val();
        result.description = form.find('#marker-description').val();

        return result;

    }

    var resetForm = function(formSelector){

            formSelector.find('.marker-lat').text('')
            formSelector.find('.marker-long').text('');
            formSelector.find('#marker-title').val('');
            formSelector.find('#marker-description').val('');
            formSelector.find('#save-marker').addClass('disabled').attr('disabled', true);
            formSelector.find('#save-marker-small').addClass('disabled').attr('disabled', true);

    }

    var clearMarker = function (map, marker) {
        for (var i = 0; i < markers.length; i++) {
            if (markers[i].id === marker.id) {
                markers[i].setMap(null);
                return i;
            }
        }
    };

    var deleteMarker = function (map, marker) {

        var pos = clearMarker(map, marker);

        markers.splice(pos, 1);

    }

    var guid = function () {

        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();

    }



}