(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osTimelines', timelines);

    /** @ngInject */
    function timelines() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/timelines/timelines.html',
            controller: TimelinesController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function TimelinesController(osApi, osCohortService, $state, $scope, $stateParams, $window, $document, moment, d3, _) {

            // Data
            var patientsAll = [];
            var patientsFiltered = [];
            var patientsDomain = [0,0];

            // Retrieve Selected Patient Ids From OS Service
            var pc = osCohortService.getPatientCohort();
            if (pc==null){ osCohortService.setPatientCohort([],"All Patients") }
            var selectedIds = (pc==null) ? [] : pc.ids;

            //var osCohortServiceUpdate = true;
            osCohortService.onPatientsSelect.add(function(patients){
                selectedIds = patients.ids;
                chart.bars.selectAll("g.timeline")
                    .each( function(d, i){
                        d3.select(this.firstChild).classed("timeline-selected", (selectedIds.indexOf(d.id)!=-1) );

                    });
            });

            function setSelected(){
                selectedIds = chart.bars.selectAll(".timeline-selected")[0].map( function (p) { return p.__data__.id; }  )
                osCohortService.setPatientCohort(selectedIds, "Timelines");
            }

            var zoom;
            var minZoom;
            var zoomed = function(e){
                if (d3.event.shiftKey) return;

                var scale = minZoom * d3.event.scale;
                if (scale<minZoom) scale = minZoom;
                var translate= d3.event.translate[1];

                var ch = $window.innerHeight - 200;
                var rh = (patientsFiltered.length*20) * scale;
                var dh = ch - rh;   // Delta height - Used For Offset

                if (translate>0) translate=0;
                if (translate<dh) translate=dh;

                zoom.translate([d3.event.translate[0],translate]);
                var rowH = (20 * scale);
                var rowsVisible = (ch / rowH);
                var rowOffset = Math.abs(translate / rowH);
                  brush.y(d3.scale.linear().range([0,ch]).domain([rowOffset, rowOffset+rowsVisible]))
                chart.bars.attr("transform","translate(1,"+translate+")scale(1," + scale + ")");
            };

            var brush;
            var brushing = false;
            var onBrushStart = function(){
                if (!d3.event.sourceEvent.shiftKey) {
                    d3.event.target.clear();
                    d3.select(this).call(d3.event.target);
                }else{
                    brushing = true;
                }
            }
            var onBrush = function(){
                if (!brushing) return;
                var extent = brush.extent();
                var lower = Math.floor(extent[0][1]);
                var upper = Math.floor(extent[1][1]);
                chart.bars.selectAll("g.timeline")
                    .each( function(d, i){
                        d3.select(this.firstChild).classed("timeline-selected", (i>=lower && i<=upper) );
                    });
            }
            var onBrushEnd = function(){
                if (!brushing) return;
                brushing = false;
                d3.event.target.clear();
                d3.select(this).call(d3.event.target);    
                setSelected();
            }

 



            // View Model
            var vm = (function(vm){
                
                vm.timescales = [
                    {name:'Log', timeFn: function(val){ return (val<0 ? -1 : 1) * Math.log(Math.abs((val*1000)/86400000)+1)/Math.log(2) }},
                    {name:'Linear', timeFn: function(val){ return moment.duration(val*1000).asDays() }}
                ];
                vm.timescale = vm.timescales[0];
                vm.filters = [
                    {name:'Alive + Dead'},
                    {name:'Only Alive'},
                    {name:'Only Dead'}
                ];
                vm.filter = vm.filters[0];
                vm.modes = [{name:"Highlight"},{name:"Filter"}];
                vm.mode = vm.modes[0];
                vm.datasource = osApi.getDataSource();
                return vm;

            })(this);

            // Chart
            var chart = (function(angular, d3){
                var elChart = angular.element(".timelines-content");
                var d3Chart = d3.select(".timelines-content").append("svg")
                    .attr("id", "chart")
                    .style({width:'100%',height:'100%'});
                var d3Axis = d3Chart.append("g")
                    .attr({"class":"axis"})
                    .style({'shape-rendering': 'crispEdges',"stroke-width": "1.0", "stroke": "#000","fill": "none"});
                var d3BarsSvg = d3Chart.append("svg")  // Used To Clip Overflow
                    .attr({"class":"bars-svg"});
                var d3BarsBackground = d3BarsSvg.append("rect") // Serves As Hit Area For Zoom
                    .attr({"width": elChart.width(), "height": $window.innerHeight - 75 - 10 - 130-50 })
                    .style({fill:"#FFFFFF"}); //,"cursor": "move" });
                var d3Bars = d3BarsSvg.append("g")
                    .attr({"class":"bars"});  // Container For Bars
                return {
                    el: elChart,
                    d3: d3Chart,
                    axis: d3Axis,
                    mask: d3BarsSvg,
                    bg: d3BarsBackground,
                    bars: d3Bars
                };
            })(angular, d3);

            // Call Update When A Data Change / Filter Occurs
            vm.update = function(){

                // Retrieve State
                var align  = vm.align.name;
                var sort   = vm.sort.name;
                var filter = vm.filter.name;
                var scale  = vm.timescale;
                var events = vm.events.filter(function(e){return e.selected}).map(function(e){return e.name;});
                var eventFilterFn = _.memoize(function(n) {
                    return (events.indexOf(n)!=-1);
                });
                
                // Filter Event Data
                patientsFiltered = patientsAll;

                // Filter
                patientsDomain = [Infinity, -Infinity];
                patientsFiltered.forEach(function(patient){
                    // Filter Patients W/O Align, Sort or Filter
                    if (!patient.hash.hasOwnProperty(this.align) || !patient.hash.hasOwnProperty(this.sort) || !patient.hash.hasOwnProperty("Status")){
                        patient.visible = false;
                    }else{
                        // Filter Alive + Dead
                        var status = patient.hash["Status"].data.status;
                        if ((this.filter=="Only Alive" && status=="Dead") || (this.filter=="Only Dead"  && status!="Dead")){
                            patient.visible = false;
                        }else{
                            // Remaining Patients Calclate Alignment
                            patient.visible = true;
                            this.offset = 0 - patient.hash[this.align].tsStart;                            
                            // Filter Events
                            patient.events.forEach(function(event){
                                event.visible = this.fn(event.name);
                                // Calculate Start + End Based On Alignment
                                if (event.visible){
                                    event.tsStartAligned = scale.timeFn(event.tsStart + this.offset);
                                    event.tsEndAligned = scale.timeFn(event.tsEnd + this.offset);
                                    if (event.visible){
                                        this.domain[0] = Math.min(this.domain[0], event.tsStartAligned);
                                        this.domain[1] = Math.max(this.domain[1], event.tsEndAligned);
                                    }
                                }
                            }, this);
                        }
                    }
                }, {fn:eventFilterFn,align:align,scale:scale,sort:sort,filter:filter,domain:patientsDomain,offset:0});


                // Remove Patients That Do Not Have Alignment Property
                patientsFiltered = patientsFiltered.filter(function(p){ return p.visible; });
                // Sort Patients
                patientsFiltered = patientsFiltered.sort(function(a,b){
                    a = a.hash[sort].tsStartAligned;
                    b = b.hash[sort].tsStartAligned;
                    if (a>b) return 1;
                    if (b>a) return -1;
                    return 0;
                });

                // Call Render
                render();
            }

            // Call Render To Redraw Data
            var firstRender = true;
            var render = function(){

                // Render Table
                var layout = osApi.getLayout();

                var chartHeight = $window.innerHeight - 150;
                var rowHeight = 20; //(chartHeight-50) / patientsFiltered.length;
                var rowWidth = $window.innerWidth - layout.left - layout.right;
                chart.el.css("margin-left", layout.left).css("margin-right", layout.right).css("height", chartHeight);

                patientsDomain[0] = patientsDomain[0]-1;
                patientsDomain[1] = patientsDomain[1]+1;

                // Scale
                var d3ScaleX = d3.scale.linear().domain( patientsDomain ).range([10, rowWidth-10]).nice();
                var d3ScaleY = d3.scale.linear().domain([0, patientsFiltered.length]).range(0,rowHeight-50).nice();

                // Scale
                minZoom = (chartHeight-50) / (patientsFiltered.length * 20);
                chart.bars.attr("transform","scale(1," + minZoom + ")");
                chart.mask.attr( {'height' : (chartHeight-50)+"px"} );

                // Brush
                brush = d3.svg.brush()
                    .x(d3ScaleX)
                    .y(d3.scale.linear().range([0,chartHeight]).domain([0, patientsFiltered.length]))
                    .on("brush", onBrush)
                    .on("brushstart", onBrushStart)
                    .on("brushend", onBrushEnd);
                chart.bg.call(brush);

                var clearSelection = function(){
                    if (!d3.event.shiftKey){
                        osCohortService.setPatientCohort([], "Timelines");
                    }
                };
                chart.bg.on("mousedown", clearSelection);
                chart.bars.on("mousedown", clearSelection);

             
                // Zoom
                zoom = d3.behavior.zoom()
                    .x( d3ScaleX )
                    .y( d3ScaleY )
                    .translate([0,0])
                    .scale(1, minZoom )
                    .on("zoom", zoomed);
                chart.bg.call(zoom);


                var rows = chart.bars.selectAll("g.timeline").data(patientsFiltered);
                rows.exit().remove();
                rows.enter().append("g").attr({ 'class' : 'timeline' })
                    .on("mousedown", function(){
                        if (!d3.event.shiftKey) chart.bars.selectAll(".timeline-selected").classed("timeline-selected", false);
                    })
                    .attr({
                        'width': rowWidth,
                        'height': rowHeight-5,
                        'transform': function(d, i) { return "translate(0," +  (i * rowHeight)+ ")"; }
                    })
                    .append("rect")
                    .attr({
                        'class': 'timeline-row',
                        'width': 0,
                        'height': rowHeight
                    });
                var cols = rows.selectAll("rect.event").data( function(d) {
                    return d.events.filter(function(d){ 
                        return d.visible;
                    }); 
                });
                cols.exit().remove();
                cols.enter().append("rect").attr({'class':'event'})
                cols.transition()
                    .style({'fill':function(d){ return d.color; }})
                        .attr({
                            'height':function(d){ return (d.name == "Radiation" || d.name=="Drug") ? rowHeight/2 : rowHeight; },
                            'y': function(d)    { return ((d.name == "Radiation") ? rowHeight/2 : 0); },
                            'width':function(d) { return (d.tsStartAligned==d.tsEndAligned) ? 2 : (d3ScaleX(d.tsEndAligned) - d3ScaleX(d.tsStartAligned)); },
                            'x': function(d)    { return d3ScaleX(d.tsStartAligned); }
                    });

                var daysToUnit = function(d){
                    if (Math.abs(d)==0) return d;
                    if (Math.abs(d)<30) return d+" Days";
                    if (Math.abs(d)<360) return Math.round( (d/30.4) * 10 ) / 10 + " Months";
                    return Math.round( (d/365) * 10 ) / 10 + " Years";
                }

                var tlScale = d3.svg.axis()
                    .scale(d3ScaleX)
                    .orient("bottom")
                    .ticks(8);

                if (vm.timescale.name=='Log'){
                    tlScale = tlScale.tickFormat(function (d) { 
                        //return daysToUnit(Math.round((d<0 ? -1 : 1) * (Math.pow(2, (Math.abs(d)))-1) *100)/100);
                        console.log(d);
                        return d;
                    });
                }else{
                    tlScale = tlScale.tickFormat(function (d) {
                        //return daysToUnit(d);
                        console.log(d);
                        return d;
                    });
                }

                // Axis
                chart.axis.attr({
                    "class": "timeline-axis",
                    "width": 100,
                    transform: function() { return "translate(0," +  (chartHeight-50) + ")"; }
                });
                chart.axis.call( tlScale );

                if (firstRender){
                    firstRender = false;
                    chart.bars.selectAll("g.timeline")
                        .each( function(d, i){
                            d3.select(this.firstChild).classed("timeline-selected", (selectedIds.indexOf(d.id)!=-1) );
                        });
                }


            }
            osApi.onResize.add(render);


            

            osApi.setBusy(true);
            osApi.query(osApi.getDataSource().clinical.events,{}).then(function(response){

                var colorFn = function(status){
                    return (status=="Birth") ?  "#17becf" : 
                        (status=="Diagnosis") ? "#8c564b" :
                        (status=="Pathology") ? "#7f7f7f" :
                        (status=="Progression") ? "#1f77b4" :
                        (status=="Absent") ? "#000000" :
                        (status=="Status") ? "#bcbd22" :
                        (status=="Radiation") ? "#e7969c" :
                        (status=="Procedure") ? "#ff7f0e" :
                        (status=="Encounter") ? "#d62728" :
                        (status=="Drug") ? "#9467bd" :
                        "black";
                };   

                var data = response.data[0];
                var events = {};
                data = Object.keys(data).map(function(key){
                    // Loop Throug Events
                    
                    var evtArray = this.data[key]
                        .filter(function(v){ return v.start!=null; })
                        .map(function(v){
                            this.events[v.name] = null;
                            v.tsStart = moment(v.start, "MM/DD/YYYY").unix();
                            v.tsEnd   = (v.end==null) ? v.tsStart : moment(v.end, "MM/DD/YYYY").unix();
                            v.tsStartAligned = "";
                            v.tsEndAligned = "";
                            v.end = (v.end==null) ? v.start : v.end;
                            v.color = this.colorFn(v.name);
                            v.visible = true;
                            return v;
                        }, {events:this.events,colorFn:this.colorFn});
                    var evtHash = evtArray.reduce(function(p,c){
                        p[c.name] = c;
                        return p;
                        },{});
                    return {id:key, events:evtArray, hash:evtHash};
                }, {data:data, events:events, colorFn:colorFn});
                patientsAll = data;
                vm.events = Object.keys(events).map(function(v){
                    return {name:v, selected:(v!="Birth"), color:this(v)};
                }, colorFn);
                vm.align = vm.events.filter(function(v){ if (v.name=="Diagnosis") return true; })[0];
                vm.sort  = vm.events.filter(function(v){ if (v.name=="Status") return true; })[0];
                vm.update();
                osApi.setBusy(false);
            });
        
            
        }
    }
})();
