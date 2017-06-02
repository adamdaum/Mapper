var map
    , markers
    , markerForm
    , saveMarker
    , deleteMarker
    , markerTable
    , markerDataTable
    , markerFormSmall
    , saveMarkerSmall
    , locationSearchTerm
    , saveMap
    , showMapForm
    , mapName
    , mapSelect
    , addMapForm;

function initMap() {

    markers = [];
    markerForm = $('#marker-form');
    markerFormSmall = $('#marker-form-small');
    saveMarker = $('#save-marker');
    saveMarkerSmall = $('#save-marker-small');
    deleteMarker = $('#delete-marker');
    markerTable = $('#marker-table');
    locationSearchTerm = document.getElementById('search-locations');
    saveMap = $('#save-map');
    showMapForm = $('#show-map-form');
    mapSelect = $('#map-select');
    mapName = $('#map-name');
    addMapForm = $('#add-map-form');
    markerDataTable = null;


    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 37.773972, lng: -122.431297 },
        zoom: 12
    });

    var autocomplete = new google.maps.places.Autocomplete(locationSearchTerm);
    autocomplete.bindTo('bounds', map);

    var infowindow = new google.maps.InfoWindow();
    var infowindowContent = document.getElementById('infowindow-content');
    infowindow.setContent(infowindowContent);

    mapSelect.select2({
        theme: "bootstrap",
        ajax: {
            url: "api/map",
            dataType: 'json',
            delay: 100,
            data: function (params) {
                var filters = [{ "name": "name", "op": "like", "val": "%" + params.term + "%" }];
                return {
                    q: JSON.stringify({ "filters": filters }), // search term
                    page: params.page
                };
            },
            processResults: function (data, params) {
                // parse the results into the format expected by Select2
                // since we are using custom formatting functions we do not need to
                // alter the remote JSON data, except to indicate that infinite
                // scrolling can be used
                params.page = params.page || 1;

                return {
                    results: data.objects,
                    pagination: {
                        more: (params.page * 30) < data.total_count
                    }
                };
            },
            cache: true
        },
        escapeMarkup: function (markup) { return markup; }, // let our custom formatter work
        minimumInputLength: 1,
        templateResult: formatResults, // omitted for brevity, see the source of this page
        templateSelection: formatResultSelection // omitted for brevity, see the source of this page

    }).on('select2:select', function (evt) {

        var map_id = $(this).val();
        var map_name = $(this).select2('data')[0].name;

        markerDataTable.ajax.url('/api/map/' + map_id);
        markerDataTable.ajax.reload();

        deleteAllMarkers(map);

        setMapMarkers(map_id);

        $('#map-name-header').text('').text(map_name);

    });

    function formatResults(results) {
        if (results.loading) return results.text;

        var markup = "<div class='select2-result-repository clearfix'>" + results.name + "</div>";

        return markup;
    }

    function formatResultSelection(result) {
        return result.name || result.text;
    }

    var marker = new google.maps.Marker({
        map: map,
        anchorPoint: new google.maps.Point(0, -29)
    });


    autocomplete.addListener('place_changed', function () {

        infowindow.close();
        marker.setVisible(false);
        var place = autocomplete.getPlace();
        if (!place.geometry) {
            // User entered the name of a Place that was not suggested and
            // pressed the Enter key, or the Place Details request failed.
            window.alert("No details available for input: '" + place.name + "'");
            return;
        }

        console.log(place);

        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);  // Why 17? Because it looks good.
        }

        marker.setPosition(place.geometry.location);
        marker.setVisible(true);

        var address = '';
        if (place.address_components) {
            address = [
                (place.address_components[0] && place.address_components[0].short_name || ''),
                (place.address_components[1] && place.address_components[1].short_name || ''),
                (place.address_components[2] && place.address_components[2].short_name || '')
            ].join(' ');
        }

        infowindowContent.children['place-icon'].src = place.icon;
        infowindowContent.children['place-name'].textContent = place.name;
        infowindowContent.children['place-address'].textContent = address;
        infowindow.open(map, marker);

        marker.id = guid();

        markers.push(marker);

        saveMarker.removeClass('disabled').removeAttr('disabled');
        saveMarkerSmall.removeClass('disabled').removeAttr('disabled');

        marker.addListener('click', function () {

            deleteMarker(map, marker);
            saveMarker.addClass('disabled');
            saveMarkerSmall.addClass('disabled');
            updateSidePanel("", "");

        });

        var latitude = place.geometry.location.lat().toString();
        var longitude = place.geometry.location.lng().toString()

        updateSidePanel(latitude, longitude);

    });


    var setMapMarkers = function (mapId) {

        $.ajax({
            method: "GET",
            url: '/api/map/' + mapId,
            dataType: "json",
            contentType: "application/json"

        }).done(function (data) {

            $.each(data.markers, function (index, item) {

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

    setMapMarkers(1);


    // var filters = [{ "id": "id", "op": "eq", "val": mapId }]; // this isn't working; fix it later.
    // var searchFilter = { "q": JSON.stringify({ "filters": filters }) }; // this isn't working; fix it later.

    markerDataTable = markerTable.DataTable({

        "ajax": {
            "url": "/api/map/1",
            "method": "GET",
            "dataType": "json",
            "dataSrc": "markers",
            "contentType": "application/json; charset=UTF-8"
        },

        columns: [
            { data: "title", defaultContent: "N/A", title: "title" },
            { data: "notes", defaultContent: "N/A", title: "notes" },
            { data: "lat", defaultContent: "", title: "latitude" },
            { data: "lng", defaultContent: "", title: "longitude" },

        ],
        select: true,
        dom: 'ftip',
        initComplete: function (settings, json) {
            var api = this.api();

            api.on('select', function (e, dt, type, indexes) {

                $('#delete-marker').removeClass('disabled').attr('disabled', false);

                var selectedRowCount = dt.rows({ selected: true }).length;
                if (selectedRowCount > 0) {

                }

            });

            api.on('deselect', function (e, dt, type, indexes) {
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

    var addMarkerToDb = function (markerThingy, formSelector) {
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


    showMapForm.on('click', function () {

        $('.hideable').slideToggle();

    });

    saveMap.on('click', function () {

        var newMap = getMapFromForm(addMapForm);

        addMap(newMap);

    });

    var getMapFromForm = function (formSelector) {

        var result = {};

        result.name = formSelector.find('#map-name').val();
        result.notes = formSelector.find('#map-notes').val();

        return result;

    }

    var addMap = function (mapObject) {
        $.ajax({
            method: "POST",
            url: "/api/map",
            data: JSON.stringify(mapObject),
            dataType: "json",
            contentType: "application/json"
        }).done(function (data) {

            mapSelect.append('<option value="' + data.id + '">' + data.name + '</option>');
            addMapForm.find('input, textarea').val('');

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

        result.map_id = $('#map-select option:selected').val();
        result.lat = form.find('.marker-lat').text();
        result.lng = form.find('.marker-long').text();
        result.title = form.find('#marker-title').val();
        result.notes = form.find('#marker-notes').val();

        return result;

    }

    var resetForm = function (formSelector) {

        formSelector.find('.marker-lat').text('')
        formSelector.find('.marker-long').text('');
        formSelector.find('#marker-title').val('');
        formSelector.find('#marker-notes').val('');
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

    var deleteAllMarkers = function (map) {

        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }

        markers = [];
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