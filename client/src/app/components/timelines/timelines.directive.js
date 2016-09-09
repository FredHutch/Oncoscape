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

            // Loading . . . 
            osApi.setBusy(true);
            
            // Data
            var patientsAll = [];
            var patientsFiltered = [];
            var patientsDomain = [];
            var scaleX, scaleY;
            var heightRow = 20;
            var baseZoomX = 1;
            var baseZoomY = 1;
            var xZoom, yZoom, xTran, yTran;
            var zoom = d3.zoom();
            var axis;
            var brushY = d3.brushY();
            var brushX = d3.brushX();
            var brushSelect = d3.brushY();

            // Retrieve Selected Patient Ids From OS Service
            var pc = osCohortService.getPatientCohort();
            if (pc==null){ osCohortService.setPatientCohort([],"All Patients"); }
            var selectedIds = (pc==null) ? [] : pc.ids;

            var onPatientsSelect = function(patients){
                selectedIds = patients.ids;
                vm.update();
            }
            osCohortService.onPatientsSelect.add(onPatientsSelect);


            function setSelected(){
                selectedIds = chart.bars.selectAll(".timeline-selected")[0].map( function (p) { return p.__data__.id; }  )
                osCohortService.setPatientCohort(selectedIds, "Timelines");
            }

            // View Model
            var vm = (function(vm){
                vm.timescales = [
                    {name:'Log', valFn: function(val){ return (val<0 ? -1 : 1) * Math.log(Math.abs((val*1000)/86400000)+1)/Math.log(2)} },
                    {name:'Linear', valFn:function(val){return moment.duration(val*1000).asDays()} }
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
                vm.displayModes = [
                    {name:'Selected Patients'},
                    {name:'All Patients'}
                ];
                vm.displayMode = vm.displayModes[0];
                vm.datasource = osApi.getDataSource();
                return vm;
            })(this);

            vm.resetZoom = function(){
                selectedIds = [];
                osCohortService.setPatientCohort([],"All Patients");
                chart.d3ScrollY.call(brushY.move, null);
                chart.d3ScrollX.call(brushY.move, null);
                vm.update();

            };

            // Chart Container Components
            var chart = (function(angular, d3){
                var elTip    = null;
                var elChart  = d3.select(".timelines-content");

                var d3Chart   = elChart.append("svg");
                    d3Chart.attr("class","timeline-chart");

                var d3ScrollY  = elChart.append("svg");
                    d3ScrollY.attr("class","timeline-scroll-y");

                var d3ScrollX  = elChart.append("svg");
                    d3ScrollX.attr("class","timeline-scroll-x");
                
                var rPatients = d3Chart.append("g");
                    rPatients.attr("class","timeline-patients-hitarea");
                var gPatients = d3Chart.append("g");

                var rAxis     = d3Chart.append("rect");
                    rAxis.attr("class","timeline-axis-bg");
                var gAxis     = d3Chart.append("g");
                
                var elTip = null;

                return {
                    elChart: angular.element(".timelines-content"),
                    elTip: elTip,
                    d3Chart: d3Chart,
                    d3ScrollY: d3ScrollY,
                    d3ScrollX: d3ScrollX,
                    gPatients: gPatients,
                    rPatients: rPatients,
                    gAxis: gAxis,
                    rAxis: rAxis
                };

            })(angular, d3);

            var updateData = function(){

                // Retrieve State
                var align  = vm.align.name;
                var sort   = vm.sort.name;
                var filter = vm.filter.name;
                var scale  = vm.timescale;
                var events = vm.events.filter(function(e){return e.selected}).map(function(e){return e.name.toLowerCase();});
                
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
                            if (vm.displayMode.name=="Selected Patients" && selectedIds.length>0){
                                patient.visible = (selectedIds.indexOf(patient.id)!=-1);
                            }else{
                                patient.visible = true;
                            }
                            if (patient.visible){
                                this.offset = 0 - patient.hash[this.align].tsStart;                            
                                // Filter Events
                                patient.events.forEach(function(event){
                                    event.visible = (this.events.indexOf(event.name.toLowerCase())!=-1);
                                    // Calculate Start + End Based On Alignment
                                    if (event.visible){
                                        event.tsStartAligned = vm.timescale.valFn(event.tsStart + this.offset);
                                        event.tsEndAligned = vm.timescale.valFn(event.tsEnd + this.offset);
                                        this.domain[0] = Math.min(this.domain[0], event.tsStartAligned);
                                        this.domain[1] = Math.max(this.domain[1], event.tsEndAligned);
                                    }
                                }, this);
                            }
                        }
                    }
                }, {align:align,sort:sort,filter:filter,events:events,domain:patientsDomain,offset:0});

                // Remove Patients That Do Not Have Alignment Property
                patientsFiltered = patientsFiltered.filter(function(p){ return p.visible; });

                // Set Selected
                patientsFiltered.forEach(function(v){
                    v.selected = (selectedIds.indexOf(v.id)!=-1);
                });

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
            };

            var updateEvents = function(height, width){
                height -= 70;
                width -= 20;

                // Scale
                scaleX = d3.scaleLinear().domain( patientsDomain ).range([0, width]).nice();

                chart.gPatients.selectAll("*").remove();
                

                var rows = chart.gPatients.selectAll("g.patient").data(patientsFiltered);
                rows.exit()
                    .transition()
                    .delay(200)
                    .duration(500)
                    .style('opacity', 0.0)
                    .remove();
                var rowEnter = rows.enter().append('g');
                rowEnter.attr('class','patient')
                rowEnter.attr('transform', function(d, i) { return "translate(0," +  (i * heightRow)+ ")"; });

                var cols = rowEnter.selectAll("rect").data(function(d){return d.events.filter(function(v){ return v.visible; });});
                cols.exit().remove();
                var colEnter = cols.enter().append("rect")
                    .attr('class','event')
                    .attr('width', function(d) { return Math.max( (scaleX(d.tsEndAligned) - scaleX(d.tsStartAligned)), 3); })
                    .attr('height', function(d){ return (d.name == "Radiation" || d.name=="Drug") ? heightRow/2 : heightRow; })
                    .attr('y', function(d) { return ((d.name == "Radiation") ? heightRow/2 : 0); })
                    .attr('x', function(d) { return scaleX(d.tsStartAligned); })
                    .style('fill', function(d){ return d.color; })
                    .on("mouseover",function(){
                        var datum = d3.select(this).datum();

                        if (datum.html==null){
                            var data = datum.data;
                            datum.html =
                                Object.keys(data).reduce(function(p,c){
                                    p.html += "<li>"+c+":"+p.data[c]+"</li>";
                                    return p;
                                }, {html:"<b>"+datum.name+"</b>",data:data}).html;
                        }
                        if (chart.elTip==null) chart.elTip = angular.element("#timelines-tip");
                        chart.elTip.html(datum.html);
                        
                    }).on("mouseout",function(){
                        chart.elTip.html("<b>Rollover Event For Details</b>");
                    });
                cols
                    .attr('width', function(d) { return Math.max( (scaleX(d.tsEndAligned) - scaleX(d.tsStartAligned)), 2); })
                    .attr('height', function(d){ return (d.name == "Radiation" || d.name=="Drug") ? heightRow/2 : heightRow; })
                    .attr('y', function(d) { return ((d.name == "Radiation") ? heightRow/2 : 0); })
                    .attr('x', function(d) { 
                        return scaleX(d.tsStartAligned); })
                    .style('fill', function(d){ return d.color; })

                // Brush
                chart.rPatients.call(brushSelect);
                brushSelect.on("end", function(){
                    if (d3.event.selection==null){
                        return;
                    }
                    var lowerIndex = Math.floor(d3.event.selection[0]/yZoom/20);
                    var upperIndex = Math.ceil(d3.event.selection[1]/yZoom/20);
                    var ids = [];
                    for (var i=lowerIndex; i<=upperIndex; i++){
                        ids.push(patientsFiltered[i].id);
                    }
                    osCohortService.setPatientCohort(ids,"All Patients");
                    chart.rPatients.call(d3.event.target.move,null);                    
                });
            };

            var updateZoom = function(height, width){
                height -= 70;
                baseZoomY = height / (patientsFiltered.length*heightRow);
                baseZoomX = 1;
                xZoom = baseZoomX;
                yZoom = baseZoomY;
                xTran = 0;
                yTran = 0;
                chart.gPatients.attr("transform", "translate(" + xTran + "," + yTran + ") scale("+xZoom+","+yZoom+")");
            };

            var configSize = function(height, width, layout){
                height -= 70;
                width -= 20;
                chart.elChart.css("margin-left", layout.left+20).css("margin-right", layout.right+20).css("width",width).css("height",height+70);
                chart.d3ScrollY.attr("height", height);
                chart.d3ScrollX.attr("width", width);
                chart.d3Chart.attr("height", height+70).attr("width", width);
                chart.rPatients.attr("height", height+70).attr("width", width);
                chart.gAxis.attr('transform', function() { return "translate(0," +  (height) + ")"; });
                chart.rAxis.attr('transform', function() { return "translate(0," +  (height) + ")"; }).attr("width",width).attr("fill","#FFF");
            };

            var daysToUnit = function(d){
                if (Math.abs(d)==0) return d;
                if (Math.abs(d)<30) return d+" Days";
                if (Math.abs(d)<360) return Math.round( (d/30.4) * 10 ) / 10 + " Months";
                return Math.round( (d/365) * 10 ) / 10 + " Years";
            };
            var updateAxis = function(height, width){
                axis = d3.axisBottom(scaleX).ticks(7);
                if (vm.timescale.name=='Linear'){
                    axis.tickFormat(function (d) { return daysToUnit(d); });
                }else{
                    axis.tickFormat(function (d) {  return daysToUnit(Math.round((d<0 ? -1 : 1) * (Math.pow(2, (Math.abs(d)))-1) *100)/100); });
                }
                chart.gAxis.call(axis);
            };



            var configScrollbars = function(height, width){
                chart.d3ScrollY.call(
                    brushY
                    .on("end", function(){
                        if (d3.event.selection!=null){
                            var lower = d3.event.selection[0];
                            var upper = d3.event.selection[1];
                            var domain = height-70;
                            var lowerPercent = lower / domain;
                            var upperPercent = upper / domain;
                            var deltaPercent = upperPercent - lowerPercent;
                            yZoom = (baseZoomY / deltaPercent);
                            yTran = (20 * patientsFiltered.length * yZoom) * -lowerPercent;
                        }else{
                            
                            if (yZoom==baseZoomY && yTran==0) return;
                            yZoom = baseZoomY;
                            yTran = 0;
                            chart.d3ScrollY.call(brushY.move, null);
                            
                        }
                        chart.gPatients
                            .transition()
                            .duration(750)
                            .attr("transform", "translate(" + xTran + "," + yTran + ") scale("+xZoom+","+yZoom+")");

                    })
                );
                chart.d3ScrollX.call(
                    brushX
                    .on("end", function(){
                        if (d3.event.selection!=null){
                            var lower = d3.event.selection[0];
                            var upper = d3.event.selection[1];
                            var domain = width-20;
                            var lowerPercent = lower / domain;
                            var upperPercent = upper / domain;
                            var deltaPercent = upperPercent - lowerPercent;
                            xZoom = (baseZoomX / deltaPercent);
                            xTran = (width * xZoom) * -lowerPercent;
                        }else{
                            if (xZoom==baseZoomX && xTran==0) return;
                            xZoom = baseZoomX;
                            xTran = 0;
                            chart.d3ScrollX.call(brushX.move, null);
                            
                        }
                        chart.gPatients
                            .transition()
                            .duration(750)
                            .attr("transform", "translate(" + xTran + "," + yTran + ") scale("+xZoom+","+yZoom+")");

        
                        var st = d3.zoomIdentity.translate(xTran).scale(xZoom).rescaleX(scaleX);
                        var axis = d3.axisBottom(st).ticks(7);
                        if (vm.timescale.name=='Linear'){
                            axis.tickFormat(function (d) { return daysToUnit(d); });
                        }else{
                            axis.tickFormat(function (d) {  return daysToUnit(Math.round((d<0 ? -1 : 1) * (Math.pow(2, (Math.abs(d)))-1) *100)/100); });
                        }
                        chart.gAxis.call(axis);
                        
                        

                    })
                );
            };

            vm.update = function(){
                var layout = osApi.getLayout();
                var height = $window.innerHeight - 180;
                var width  = $window.innerWidth - layout.left - layout.right-40;
                updateData();
                configSize(height, width, layout);
                configScrollbars(height, width);
                updateEvents(height, width);
                updateZoom(height, width);
                updateAxis(height, width);
            }


            osApi.onResize.add(vm.update);
            function resize(){ _.debounce(vm.update, 300); }
            angular.element($window).bind('resize',  resize);
          
            /* Init Data */
            osApi.setBusy(true);
            osApi.query(osApi.getDataSource().clinical.events,{}).then(function(response){
                var colorFn = function(status){
                    return (status=="Birth") ?  "#E91E63" : 
                        (status=="Diagnosis") ? "#673AB7" :
                        (status=="Pathology") ? "#2196F3" :
                        (status=="Progression") ? "#00BCD4" :
                        (status=="Absent") ? "#CDDC39" :
                        (status=="Status") ? "#FFC107" :
                        (status=="Radiation") ? "#FF5722" :
                        (status=="Procedure") ? "#795548" :
                        (status=="Encounter") ? "#607D8B" :
                        (status=="Drug") ? "#03A9F4" :
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
                    return {name:v, selected:(["Birth","Drug","Pathology","Absent","Procedure"].indexOf(v)==-1), color:this(v)};
                }, colorFn);
                vm.align = vm.events.filter(function(v){ if (v.name=="Diagnosis") return true; })[0];
                vm.sort  = vm.events.filter(function(v){ if (v.name=="Status") return true; })[0];
                vm.update();
                osApi.setBusy(false);
            });

            // Destroy
            $scope.$on('$destroy', function() {
                osCohortService.onPatientsSelect.remove(onPatientsSelect);
                osApi.onResize.remove(vm.update);
                angular.element($window).unbind('resize',  resize);
                brushY.on("end",null);
                brushX.on("end",null);
                
            });
        }
    }
})();
