function initDash(){
    updateUntrained('');

    map = L.map('hdx-ipc-where',{});

    L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    map.scrollWheelZoom.disable();

    generate3WComponent(data,adm1_geom,map,'#adm1+code');

}

function onEachFeatureADM1(feature,layer){
    layer.on('click',function(e){
            var cf = crossfilter(data);           
            map.removeLayer(dcGeoLayer);
            map.removeLayer(overlay2);
            var whereDimension = cf.dimension(function(d,i){return d['#adm1+code']; });
            var newData = whereDimension.filter(e.target.feature.properties.CODE).top(Infinity);
            var newGeom = filterGeom(adm2_geom,e.target.feature.properties.CODE,6);
            admlevel=2;
            generate3WComponent(newData,newGeom,map,'#adm2+code');            
    });
    layer.on('mouseover',function(){
        $('.hdx-3w-info').html('Click to view '+lookup[feature.properties.CODE]);
    });
    layer.on('mouseout',function(){
        $('.hdx-3w-info').html('Hover for name');
    });

}
/*
function onEachFeatureADM2(feature,layer){
    layer.on('click',function(e){
            var cf = crossfilter(data);  
            map.removeLayer(dcGeoLayer);
            var whereDimension = cf.dimension(function(d,i){return d['#adm2+code']; });
            var newData = whereDimension.filter(e.target.feature.properties.CODE).top(Infinity);
            var newGeom = filterGeom(adm3_geom,e.target.feature.properties.CODE,9);
            admlevel=3;
            generate3WComponent(newData,newGeom,map,'#adm3+code');                 
    });
    layer.on('mouseover',function(){
        $('.hdx-3w-info').html('Click to view '+lookup[feature.properties.CODE]);
    });
    layer.on('mouseout',function(){
        $('.hdx-3w-info').html('Hover for name');
    });    
}
 */
function generate3WComponent(data,geom,map,key){

    dc.chartRegistry.clear();
    $('#hdx-ipc-who').html('<p>Who | Current filter: <span class="filter"></span></span></p>');
    $('#hdx-ipc-status').html('<p>Status | Current filter: <span class="filter"></span></span></p>');
    $('#hdx-ipc-type').html('<p>Type | Current filter: <span class="filter"></span></span></p>');
    $('#hdx-ipc-duration').html('<p>Duration | Current filter: <span class="filter"></span></span></p>');
    $('.hdx-3w-info').remove();

    //lookUpVDCCodeToName = genLookupVDCCodeToName(geom,config);

    var whoChart = dc.rowChart('#hdx-ipc-who');
    var statusChart = dc.rowChart('#hdx-ipc-status');
    var typeChart = dc.rowChart('#hdx-ipc-type');
    var durationChart = dc.rowChart('#hdx-ipc-duration');
    //var dateChart = dc.lineChart('#hdx-ipc-date');
    var whereChart = dc.leafletChoroplethChart('#hdx-ipc-where');
    var whereBarChart = dc.rowChart('#hdx-ipc-wherebar');

    var cf = crossfilter(data);

    var whoDimension = cf.dimension(function(d){ if(d['#org+code']==null){
            return 'No Data';
        } else {
            return d['#org+code']; 
        }});        
    var statusDimension = cf.dimension(function(d){ if(d['#status+sector']==null){
            return 'No Data';
        } else {
            return d['#status+sector']; 
        }});
    var typeDimension = cf.dimension(function(d){ if(d['#output+type']==null){
            return 'No Data';
        } else {
            return d['#output+type']; 
        }});
    var durationDimension = cf.dimension(function(d){ if(d['#output+duration']==null){
            return 'No Data';
        } else {
            return String(d['#output+duration']); 
        }});

    var whereDimension = cf.dimension(function(d){ if(d[key]==null){
            return 'No Data';
        } else {
            return d[key]; 
        }});

    var where2Dimension = cf.dimension(function(d){ if(d[key]==null){
            return 'No Data';
        } else {
            return d[key]; 
        }});    

    var whoGroup = whoDimension.group();
    var statusGroup = statusDimension.group();
    var typeGroup = typeDimension.group();
    var durationGroup = durationDimension.group();
    var whereGroup = whereDimension.group();
    var where2Group = where2Dimension.group();
    var all = cf.groupAll();

    whoChart.width($('#hdx-ipc-who').width()).height(200)
            .dimension(whoDimension)
            .group(whoGroup)
            .elasticX(true)
            .colors([color])
            .colorAccessor(function(d, i){return 0;})
            .label(function(d){
                return d.key +' ('+d.value+')';
            })            
            .xAxis().ticks(5);

    statusChart.width($('#hdx-ipc-status').width()).height(200)
            .dimension(statusDimension)
            .group(statusGroup)
            .elasticX(true)
            .colors([color])
            .colorAccessor(function(d, i){return 0;})
            .label(function(d){
                return d.key +' ('+d.value+')';
            })
            .xAxis().ticks(5);    
    
    typeChart.width($('#hdx-ipc-type').width()).height(200)
            .dimension(typeDimension)
            .group(typeGroup)
            .elasticX(true)
            .colors([color])
            .colorAccessor(function(d, i){return 0;})
            .label(function(d){
                return d.key +' ('+d.value+')';
            })
            .xAxis().ticks(5); 

    durationChart.width($('#hdx-ipc-duration').width()).height(200)
            .dimension(durationDimension)
            .group(durationGroup)
            .elasticX(true)
            .colors([color])
            .colorAccessor(function(d, i){return 0;})
            .label(function(d){
                return d.key +' ('+d.value+')';
            })
            .xAxis().ticks(5);          

    dc.dataCount('#count-info')
            .dimension(cf)
            .group(all);

    whereBarChart.width($('#hdx-ipc-wherebar').width()).height(300)
            .dimension(whereDimension)
            .group(whereGroup)
            .elasticX(true)
            .colors([color])
            .colorAccessor(function(d, i){return 0;})
            .label(function(d){
                if(d.key==''){
                    return 'No Data ('+d.value+')';
                } else {
                    return lookupSmall[d.key] +' ('+d.value+')';
                }
            })
            .on('filtered',function(chart,filter){
                if(newFilter == true){
                    newFilter = false;
                    whereChart.filter(filter);
                } else {
                    newFilter = true;
                }                
            })
            .xAxis().ticks(5);        

    whereChart.width($('#hdx-ipc-where').width()).height(300)
            .dimension(whereDimension)
            .group(whereGroup)
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
                var filters = chart.filters();
                if(newFilter == true){
                    newFilter = false;
                    whereBarChart.filter(filter);
                } else {
                    newFilter = true;
                }     
                if(filters.length>0){
                    if(admlevel<3){
                        var cf = crossfilter(data);
                        map.removeLayer(dcGeoLayer);                    
                    }               
                    if(admlevel==1){      
                        var overlay = L.geoJson(geom,{
                                style:{
                                    fillColor: "#000000",
                                    color: 'grey',
                                    weight: 2,
                                    opacity: 1,
                                    fillOpacity: 0,
                                    class:'adm'+admlevel
                                },
                                onEachFeature: onEachFeatureADM1
                        });
                        overlay.addTo(map);                      
                        var whereDimension = cf.dimension(function(d,i){return d['#adm1+code']; });
                        var newData = whereDimension.filter(filters[0]).top(Infinity);
                        var newGeom = filterGeom(adm2_geom,filters[0],6);
                        overlay1 = overlay;
                        admlevel=2;
                        generate3WComponent(newData,newGeom,map,'#adm2+code');
                    } else if(admlevel==2){
                        /*var overlay = L.geoJson(geom,{
                                style:{
                                    fillColor: "#000000",
                                    color: 'grey',
                                    weight: 2,
                                    opacity: 1,
                                    fillOpacity: 0,
                                    class:'adm'+admlevel
                                },
                                onEachFeature: onEachFeatureADM2
                        }); */                   
                        var whereDimension = cf.dimension(function(d,i){return d['#adm2+code']; });
                        var newData = whereDimension.filter(filters[0]).top(Infinity);
                        var newGeom = filterGeom(adm3_geom,filters[0],9);
                        /*overlay.addTo(map); 
                        overlay2 = overlay;*/
                        admlevel=3;
                        generate3WComponent(newData,newGeom,map,'#adm3+code');
                    }
                }
            });
            /*.on("renderlet",(function(e){
                var html = "";
                e.filters().forEach(function(l){
                    html += lookUpVDCCodeToName[l]+", ";
                });
                $('#mapfilter').html(html);
            }));*/             

    dc.renderAll();
    
    zoomToGeom(geom);

    dcGeoLayer = whereChart.geojsonLayer(); 
/*)
    
    var g = d3.selectAll('#rc-3W-who').select('svg').append('g');
    
    g.append('text')
        .attr('class', 'x-axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', $('#rc-3W-who').width()/2)
        .attr('y', 398)
        .text('Households Reached');

    var g = d3.selectAll('#rc-3W-what').select('svg').append('g');
    
    g.append('text')
        .attr('class', 'x-axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', $('#rc-3W-what').width()/2)
        .attr('y', 298)
        .text('Households Reached');
*/
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
        });

    $('.loading').hide();
    $('.dash').show();
    initDash();            
});                 
