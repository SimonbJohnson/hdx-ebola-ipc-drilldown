/**
 * Set up the dashboard after downloading the data.
 */
function initDash(){
    updateUntrained('');

    map = L.map('hdx-ipc-where',{});

    L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    map.scrollWheelZoom.disable();

    // restore state from the current URL hash
    readHash(window.location.hash);

    // make the back button work
    window.onhashchange = function(event) {
        readHash(window.location.hash);
    };
}


/**
 * Read and restore state from the URL hash.
 * @param the hash as a string, including leading "#"
 */
function readHash(hash) {
    var state = {};
    var e,
        a = /\+/g,  // Regex for replacing addition symbol with a space
        r = /([^&;=]+)=?([^&;]*)/g,
        d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
        q = hash.substring(1);

    while (e = r.exec(q))
       state[d(e[1])] = d(e[2]);

    // Set the map display
    setGeometry(state);
}


/**
 * Write state to the hash.
 * @param the state as an associative array.
 */
function writeHash(state) {
    hash = '';
    for (var key in state) {
        if (state[key]) {
            hash += key + '=' + state[key];
        }
    }
    if (hash) {
        location.hash = hash;
    } else {
        location.hash = '';
    }
}

/**
 * Select and display a specific area
 * @param state the state to restore (keys: adm1, adm2)
 */
function setGeometry(state) {

    var cf = crossfilter(data);           

    if (state.adm2) {
        // FIXME
        map.removeLayer(dcGeoLayer);
        map.removeLayer(overlay2);
        var whereDimension = cf.dimension(function(d,i){return d['#adm2+code']; });
        var newData = whereDimension.filter(state.adm2).top(Infinity);
        var newGeom = filterGeom(adm3_geom,state.adm2,9);
        admlevel=3;
        generate3WComponent(newData,newGeom,map,'#adm3+code');
    } else if (state.adm1) {
        // only ADM1 code selected
        map.removeLayer(dcGeoLayer);
        map.removeLayer(overlay1);
        var whereDimension = cf.dimension(function(d,i){return d['#adm1+code']; });
        var newData = whereDimension.filter(state.adm1).top(Infinity);
        var newGeom = filterGeom(adm2_geom,state.adm1,6);
        admlevel=2;
        generate3WComponent(newData,newGeom,map,'#adm2+code');            
    } else {
        // no admin codes selected
        generate3WComponent(data,adm1_geom,map,'#adm1+code');
        zoomToGeom(adm1_geom);
    }

    // Update the URL hash with the current location
    writeHash({
        adm1: state.adm1,
        adm2: state.adm2
    });
}


/**
 * Set up callbacks for a Leaflet feature layer.
 * @param feature the GeoJSON feature object
 * @param layer the Leaflet layer
 */
function onEachFeatureADM1(feature,layer){
    layer.on('click',function(e){
        setGeometry({adm1: e.target.feature.properties.CODE});
    });
    layer.on('mouseover',function(){
        $('.hdx-3w-info').html('Click to view '+lookup[feature.properties.CODE]);
    });
    layer.on('mouseout',function(){
        $('.hdx-3w-info').html('Hover for name');
    });
}

/**
 * Set up a row bar chart.
 * @param id the chart element ID in HTML
 * @param tag the HXL tag to use in the data
 * @param cf the cross-filter object
 * @param nameMap (optional) a lookup map for display names
 * @return a D3 chart object
 */
function makeRowChart(id, tag, cf, nameMap) {
    var chart = dc.rowChart(id);
    var dimension = cf.dimension(function(d){ if(d[tag]==null){
        return 'No Data';
    } else {
        if (nameMap) {
            return nameMap[d[tag]];
        } else {
            return d[tag];
        }
    }});
    var group = dimension.group();

    chart.width($(id).width()).height(200)
        .dimension(dimension)
        .group(group)
        .elasticX(true)
        .colors([color])
        .colorAccessor(function(d, i){return 0;})
        .label(function(d){
            return d.key +' ('+d.value+')';
        })            
        .xAxis().ticks(5);

    return chart;
}


/**
 * Make a choropleth map chart.
 * @param id the chart element ID in HTML
 * @param tag the HXL tag to use in the data
 * @param cf the cross-filter object
 * @param geom the GeoJSON geometry
 * @param barchart the corresponding D3 non-map chart object
 * @return a D3 chart object
 */
function makeChoroplethChart(id, tag, cf, geom, barchart) {
    var chart = dc.leafletChoroplethChart(id);
    var dimension = cf.dimension(function(d){ if(d[tag]==null){
        return 'No Data';
    } else {
        return d[tag]; 
    }});
    var group = dimension.group();
    chart.width($(id).width()).height(300)
        .dimension(dimension)
        .group(group)
        .center([0,0])
        .zoom(0)    
        .geojson(geom)
        .colors(['#dddddd','steelblue'])
        .colorDomain([0, 1])
        .colorAccessor(function (d) {
            if(d>0){
                return 1;
            } else {
                return 0;
            }
        })           
        .featureKeyAccessor(function(feature){
            return feature.properties['CODE'];
        }).popup(function(feature){
            return lookup[feature.properties['CODE']];
        })
        .renderPopup(true)
        .featureOptions({
            'fillColor': 'black',
            'color': 'black',
            'opacity':1,
            'fillOpacity': 0,
            'weight': 3
        })
        .createLeaflet(function(){
            return map;
        })
        .on('filtered',function(chart,filter){
            // This is where we select on the map
            // filter = the ADM code
            var filters = chart.filters();
            if(newFilter == true){
                newFilter = false;
                barchart.filter(filter);
            } else {
                newFilter = true;
            }     
            if(filters.length>0){
                if(admlevel==1){
                    setGeometry({adm1: filter});
                } else if(admlevel==2){
                    setGeometry({adm2: filter});
                }
            }
        });

    return chart;
}

function clearFilters() {
    dc.filterAll();
    dc.redrawAll();
}




/**
 * Generate the display map and charts.
 * @param data the HXL data to display
 * @param geom the current geometry
 * @param map the Leaflet map
 * @param key the HXL tag to select the next level
 */
function generate3WComponent(data,geom,map,key){

    // Clear the charts
    dc.chartRegistry.clear();

    // Set up the label text for the charts
    $('#hdx-ipc-who').html('<p>Who | Current filter: <span class="filter"></span></span></p>');
    $('#hdx-ipc-status').html('<p>Status | Current filter: <span class="filter"></span></span></p>');
    $('#hdx-ipc-type').html('<p>Type | Current filter: <span class="filter"></span></span></p>');
    $('#hdx-ipc-duration').html('<p>Duration | Current filter: <span class="filter"></span></span></p>');
    $('.hdx-3w-info').remove();

    // Join the two groups of data
    var cf = crossfilter(data);

    // Set up the charts
    var whoChart = makeRowChart('#hdx-ipc-who', '#org+code', cf);
    var statusChart = makeRowChart('#hdx-ipc-status', '#status+sector', cf);
    var typeChart = makeRowChart('#hdx-ipc-type', '#output+type', cf);
    var durationChart = makeRowChart('#hdx-ipc-duration', '#output+duration', cf);
    var whereBarChart = makeRowChart('#hdx-ipc-wherebar', key, cf, lookupSmall);
    var whereChart = makeChoroplethChart('#hdx-ipc-where', key, cf, geom, whereBarChart);

    var all = cf.groupAll();

    dc.dataCount('#count-info')
            .dimension(cf)
            .group(all);

    // Render
    dc.renderAll();

    // Focus in on the geometry
    zoomToGeom(geom);

    dcGeoLayer = whereChart.geojsonLayer(); 
}

function filterGeom(geom,filter,length){
    var newFeatures = [];
    var newgeom = jQuery.extend({}, geom);
    newgeom.features.forEach(function(f){
        if(f.properties.CODE.substring(0,length)==filter){
            newFeatures.push(f);
        }    
    });
    newgeom.features = newFeatures;
    updateUntrained(filter);
    $('#area_title').html('<h3>'+lookup[filter]+'</h3>');
    return newgeom;
}

function zoomToGeom(geom){
    var bounds = d3.geo.bounds(geom);
    map.fitBounds([[bounds[0][1],bounds[0][0]],[bounds[1][1],bounds[1][0]]]);
}
    
function genLookupToName(){

    adm1_geom.features.forEach(function(f){
        lookup[f.properties.CODE] = f.properties.NAME;
        lookupSmall[f.properties.CODE] = f.properties.NAME;
    });
    adm2_geom.features.forEach(function(f){
        lookup[f.properties.CODE] = f.properties.ADM1_NAME + ', ' + f.properties.NAME;
        lookupSmall[f.properties.CODE] = f.properties.NAME;
    });
    adm3_geom.features.forEach(function(f){
        lookup[f.properties.CODE] = f.properties.ADM1_NAME + ', ' + f.properties.ADM2_NAME + ', ' + f.properties.NAME;
        lookupSmall[f.properties.CODE] = f.properties.NAME;
    });
    
}

function hxlProxyToJSON(input){
    var input = stripIfNull(input);
    var output = [];
    var keys=[]
    input.forEach(function(e,i){
        if(i==0){
            keys = e;
        } else {
            var row = {};
            e.forEach(function(e2,i2){
                row[keys[i2]] = e2;
            });
            output.push(row);
        }
    });
    return output;
}

function stripIfNull(input){
    if(input[0][0]==null){
        input.shift();
        return input;
    }
    return input;
}

function updateUntrained(filter){
    if(filter.length ==6){
        var dimension = cfuntrained.dimension(function(d){ return d['#adm1+code'] });
        dimension.filter(filter);
    } else if (filter.length == 9){
        var dimension = cfuntrained.dimension(function(d){ return d['#adm2+code'] });
        dimension.filter(filter);
    } else if (filter.length==11) {
        var dimension = cfuntrained.dimension(function(d){ return d['#adm3+code'] });
        dimension.filter(filter);
    }



    var value = cfuntrained.groupAll().reduceSum(function(d) {
        return d['#meta+max'];
    }).value();

    $('#hdx-ipc-untrained').html(value);
    if(filter!=''){
        dimension.dispose();
    }
}

//load 3W data
$('.dash').hide();



var map;
var dcGeoLayer = '';
var geoLayer = '';
var overlay1 = '';
var overlay2 = '';
var admlevel=1;
var data;
var data2;
var color = 'steelblue';
var cfuntrained

var adm1_geom = topojson.feature(gui_adm1,gui_adm1.objects.gui_adm1);
var adm2_geom = topojson.feature(gui_adm2,gui_adm2.objects.gui_adm2);
var adm3_geom = topojson.feature(gui_adm3,gui_adm3.objects.gui_adm3);
var lookup = {};
var lookupSmall = {};
var newFilter = true;

genLookupToName();




var data1url = 'https://proxy.hxlstandard.org/data.json?filter_count=7&url=https%3A//www.dropbox.com/s/otsi1lqdz66jy3w/ipc-merged.csv%3Fdl%3D1&strip-headers=on&format=html&filter01=&filter02=&filter03=&filter04=&filter05=&filter06=&filter07=&force=1';

var data1Call = $.ajax({ 
    type: 'GET', 
    url: data1url, 
    dataType: 'json',
    error:function(e,exception){
        console.log(exception);
    }
});

        //load geometry

var data2url = 'https://proxy.hxlstandard.org/data.json?filter_count=7&url=https%3A//www.dropbox.com/s/ko1bxl8z69ptxny/ipc-facility-coverage-adm3.csv%3Fdl%3D1&strip-headers=on&format=html&filter01=count&count-tags01=adm1%2Bcode%2Cadm2%2Bcode%2Cadm3%2Bcode&count-aggregate-tag01=inneed&filter02=&filter03=&filter04=&filter05=&filter06=&filter07=&force=1';

var data2Call = $.ajax({ 
    type: 'GET', 
    url: data2url, 
    dataType: 'json',
});

$.when(data1Call, data2Call).then(function(data1Args, data2Args){
    data = hxlProxyToJSON(data1Args[0]);
    data2 = hxlProxyToJSON(data2Args[0]);
    cfuntrained = crossfilter(data2);
    $('#reinit').click(function(){
        map.removeLayer(dcGeoLayer);
        map.removeLayer(overlay1);
        admlevel=1; 
        generate3WComponent(data,adm1_geom,map,'#adm1+code');
        writeHash({});
    });

    $('.loading').hide();
    $('.dash').show();
    initDash();            
});                 
