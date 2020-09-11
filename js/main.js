//check whether or not namespace exist
var MyApp = MyApp || {};

//create my app namespace
var MyApp = (function(){

  //create array to contain new marker info-window 
  var infos = [];

  //Private function - create and set markers on the map accordingly to bike stations data
  var _setMarkers =  function(map, bikeStations) {

    //create array and variables to store map markers info
    var markers = [],
    bikesAvailable = '',
    docksAvailable = '';
    
    // Add markers to the map
    // Marker sizes are expressed as a Size of X,Y
    // where the origin of the image (0,0) is located
    // in the top left of the image.

    // Origins, anchor positions and coordinates of the marker
    // increase in the X direction to the right and in
    // the Y direction down.
    var image = {
      url: 'img/bike_marker_img.png',
      // This marker is 20 pixels wide by 32 pixels tall.
      size: new google.maps.Size(25, 25),
      // The origin for this image is 0,0.
      origin: new google.maps.Point(0,0),
      // The anchor for this image is the base of the flagpole at 0,32.
      anchor: new google.maps.Point(0, 32)
    };

    // Shapes define the clickable region of the icon.
    // The type defines an HTML &lt;area&gt; element 'poly' which
    // traces out a polygon as a series of X,Y points. The final
    // coordinate closes the poly by connecting to the first
    // coordinate.
    var shape = {
        coords: [1, 1, 1, 20, 18, 20, 18 , 1],
        type: 'poly'
    };

    //creates markers on the map accordingly to the coordinates provided in the array
    for (var i = 0; i < bikeStations.length; i++) {
      var bikeStation = bikeStations[i];
      var myLatLng = new google.maps.LatLng(parseFloat(bikeStation[2]), parseFloat(bikeStation[3]));
      var marker = new google.maps.Marker({
          position: myLatLng,
          map: map,
          icon: image,
          shape: shape,
          stationName: bikeStation[0],
          stationAddress: bikeStation[1],
          stationCapacity: bikeStation[2],
          stationId: bikeStation[5]
      });

      //push each marker in to the 'markers' array
      markers.push(marker);   

      //get each bike station status info for the map markers
      var urlBikeStationStatus = "https://gbfs.urbansharing.com/oslobysykkel.no/station_status.json" + bikeStation[5];
      $.ajax({
        url: urlBikeStationStatus,
        dataType:'json',
        method:'GET',
        timeout: 3000,
        cache: false,

        success:function(data){
          bikesAvailable = data.data.stations.num_bikes_available;
          docksAvailable = data.data.stations.num_docks_available;
        },
        error: function(xhr) {  
            $(".errorLoadingData").html('There was an error loading the data:' + '<p>' +  'Request Status: ' + xhr.status + ' - ' + ' Status Text: ' + xhr.statusText + ' & ' + xhr.responseText + '</p>' ).css("display","block");    
        }
      });

        //each marker info to be set
        var contentString = '<h3 class="info-header">' + marker.stationName + '</h3>' +
        '<ul class="info-list">' +
        '<li class="info-list__item first">'+ "<span>Address:</span> " + marker.stationAddress + '</li>' +
        '<li class="info-list__item">'+ "<span>Station capacity:</span> " + marker.stationCapacity + '</li>' +
        '<li class="info-list__item">'+ "<span>Bikes available:</span> " + bikesAvailable + '</li>' +
        '<li class="info-list__item">'+ "<span>Docks available:</span> " + docksAvailable + '</li></ul>';

        var infowindow = new google.maps.InfoWindow({
            content: contentString,
            maxWidth: 200
        });

        //add event listener to each marker and handle the click
        _addListenersToMarkers(map, marker, contentString, infowindow, bikeStation);  
      }
  };


  //private method - add event listener to each marker and handle its click
  var _addListenersToMarkers = function (map, marker, contentString, infowindow){
    //handles click on multiple markers
    google.maps.event.addListener(marker,'click', (function(marker,contentString,infowindow){ 
      return function() {
        // close the previous info-window
        _closeInfos();
        infowindow.setContent(contentString);
        infowindow.open(map,marker);

        //keep the handle, in order to close it on next click event
        infos[0]=infowindow;
      }
    })(marker,contentString,infowindow));
  };


  //private method - closes the infoWindow previously opened
  var _closeInfos = function (){
     if(infos.length > 0){
        // detach the info-window from the marker
        infos[0].set("marker", null);
        //and close it
        infos[0].close();
        //blank the array
        infos.length = 0;
     }
  };


  //Private method - function to retrieve map from google - Oslo coordinates are being used with zoom level 14 - alternatively, use google geo location to check your position automatically
  var _initialise = function () {
    var mapOptions = {
      center: { lat: 59.911491, lng: 10.757933}, 
      zoom: 14,
      zoomControl: true,
      zoomControlOptions: {
          position: google.maps.ControlPosition.LEFT_TOP
      },
      scaleControl: true,
      streetViewControl: true,
      streetViewControlOptions: {
          position: google.maps.ControlPosition.LEFT_TOP
      }
    };

    var map = new google.maps.Map(document.getElementById('map-canvas'),mapOptions);

    //handle the data returned from the API call and add it to the DOM
    var urlBikeStationsMarkers = "https://gbfs.urbansharing.com/oslobysykkel.no/station_information.json";
    $.ajax({
      url: urlBikeStationsMarkers,
      dataType:'json',
      type:'get',
      timeout: 3000,
      cache: false,
      success:function(data){
        //create an array containing all stops positions and name so as to show them on the map
        var bikeStops = [];

        $.each(data.data.stations, function(index, value) {
          bikeStops[index] = [value.name, value.capacity , value.lat , value.lon, index, value.address, value.station_id];
        });

        //set markers on the map
        _setMarkers(map, bikeStops);
      },
      error: function(xhr) {
          $(".error").html('<h4>There was an error loading the data:</h4>' + '<p>' +  'Request Status: ' + xhr.status + ' - ' + ' Status Text: ' + xhr.statusText + ' & ' + xhr.responseText + '</p>' ).css("display","block");    
      }
    })
  };

  //public method - initialise bike stations on map
  var initMap = function () {
    //Add a DOM listener that will execute the initialize() function when the page is loaded
    google.maps.event.addDomListener(window, 'load', _initialise);

  };

  return {
      initMap: initMap
  };
})();

MyApp.initMap();

