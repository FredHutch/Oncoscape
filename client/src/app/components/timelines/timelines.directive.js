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
            var scaleX, scaleY;

            // Retrieve Selected Patient Ids From OS Service
            var pc = osCohortService.getPatientCohort();
            if (pc==null){ osCohortService.setPatientCohort([],"All Patients") }
            var selectedIds = (pc==null) ? [] : pc.ids;

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

            // View Model
            var vm = (function(vm){
                
                vm.timescales = [
                    {name:'Linear', val:d3.scaleLinear()},
                    {name:'Sqrt', val:d3.scaleSqrt()},
                    {name:'Pow.2', val:d3.scalePow().exponent(.2)}
                ];
                vm.timescale = vm.timescales[0];
                vm.filters = [
                    {name:'Alive + Dead'},
                    {name:'Only Alive'},
                    {name:'Only Dead'}
                ];
                vm.filter = vm.filters[2];
                vm.modes = [{name:"Highlight"},{name:"Filter"}];
                vm.mode = vm.modes[0];
                vm.datasource = osApi.getDataSource();
                return vm;

            })(this);

            // Chart Container Components
            var chart = (function(angular, d3){
                var elChart = angular.element(".timelines-content");
                var d3Chart = d3.select(".timelines-content").append("svg");
                var d3Axis = d3Chart.append("g");
                    d3Axis.attr({"class":"axis"});
                    d3Axis.style({'shape-rendering': 'crispEdges',"stroke-width": "1.0", "stroke": "#000","fill": "none"});
                var d3Bars = d3Chart.append("g");
                    d3Bars.attr({"class":"bars"});  // Container For Bars
                var d3Brush = d3Chart.append("g");
                return {
                    el: elChart,
                    d3: d3Chart,
                    axis: d3Axis,
                    bars: d3Bars,
                    brush: d3Brush
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
                                    event.tsStartAligned = event.tsStart + this.offset;
                                    event.tsEndAligned = event.tsEnd + this.offset;
                                    this.domain[0] = Math.min(this.domain[0], event.tsStartAligned);
                                    this.domain[1] = Math.max(this.domain[1], event.tsEndAligned);
                                }
                            }, this);
                        }
                    }
                }, {fn:eventFilterFn,align:align,sort:sort,filter:filter,domain:patientsDomain,offset:0});

                // Remove Patients That Do Not Have Alignment Property
                patientsFiltered = patientsFiltered.filter(function(p){ return p.visible; });

                // Sort Patients
                patientsFiltered = patientsFiltered.sort(function(a,b){
                    if (a.status==b.status){
                        a = a.hash[sort].tsStartAligned;
                        b = b.hash[sort].tsStartAligned;
                        if (a>b) return 1;
                        if (b>a) return -1;
                        return 0;
                    }else{
                        return (a.status=="dead") ? 1 : -1;
                    }
                });

                // Call Render
                render();
            }

            // Render 
            var render = function(){

                // Size
                var layout = osApi.getLayout();
                var height = $window.innerHeight - 150;
                var rowHeight = 20;
                var rowWidth = $window.innerWidth - layout.left - layout.right;
                chart.el.css("margin-left", layout.left).css("margin-right", layout.right).css("height", height);
                chart.d3.attr( "width", rowWidth).attr("height", height);
                chart.brush.attr("width", rowWidth).attr("height", height);

                var minZoom = (height-50) / (patientsFiltered.length * 20);
                chart.bars.attr("transform","scale(1," + minZoom + ")");

                // Scale
                scaleX = vm.timescale.val.domain( patientsDomain ).range([10, rowWidth-10]).nice();
                scaleY = d3.scaleLinear().domain([0, patientsFiltered.length]).range([0,height-50]).nice();

                // Draw
                chart.bars.selectAll("*").remove();
                var rows = chart.bars.selectAll("g.timeline").data(patientsFiltered);

                rows.exit().remove();
                var rowEnter = rows.enter().append('g')
                    .attr("class","row")
                    .attr('transform', function(d, i) { return "translate(0," +  (i * rowHeight)+ ")"; });

                rowEnter.append('rect')
                    .attr('fill','#FFF')
                    .attr('width', rowWidth)
                    .attr('height', 10);

                rowEnter.append('g')
                    .attr('class', 'cols');

                var cols = rowEnter.select(".cols").selectAll("g").data(function(d){ return d.events; });
                var colEnter = cols.enter().append('rect')
                    .attr('class', 'event')
                    .attr('height', function(d){ return (d.name == "Radiation" || d.name=="Drug") ? rowHeight/2 : rowHeight; })
                    .attr('width', function(d) { return Math.max( (scaleX(d.tsEndAligned) - scaleX(d.tsStartAligned)), 2); })
                    .attr('y', function(d) { return ((d.name == "Radiation") ? rowHeight/2 : 0); })
                    .attr('x', function(d) { return scaleX(d.tsStartAligned); })
                    .style('fill', function(d){ return d.color; });


                // Brush
                var brush = d3.brushY()
                    .on("end", function(e){
                        
                        if (!d3.event.selection){
                            osCohortService.setPatientCohort([], "Timelines");
                            return;
                        } 

                        var bv = d3.event.selection;
                        var yMin = Math.floor(scaleY.invert(bv[0]));
                        var yMax = Math.ceil(scaleY.invert(bv[1]));
                        var ids = [];
                        for (var i=yMin; i<yMax; i++){
                            ids.push(patientsFiltered[i].id);
                        }

                        osCohortService.setPatientCohort(ids, "Timelines");

                    });

                chart.brush.attr("class","brush").call(brush);

                var axis = d3.axis()
                        .scale(scaleX)
                        .orient("bottom")
                        .ticks(8);
                chart.axis.call(axis);
            }

            osApi.onResize.add(render);
            angular.element($window).bind('resize', _.debounce(render, 300) );

            /* Init Data */
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
                patientsAll = data.filter(function(v){
                    try{
                        v.status = v.hash["Status"].data.status.toLowerCase();
                        return true;
                    }catch(e){
                        return false;
                    }
                    return false;
                });
                
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
