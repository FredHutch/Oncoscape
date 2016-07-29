(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osSurvival', survival);

    /** @ngInject */
    function survival() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/survival/survival.html',
            controller: SurvivalController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function SurvivalController(osApi, osCohortService, $state, $timeout, $scope, $stateParams) {

            var colors = ['#004358','#800080','#BEDB39','#FD7400','#1F8A70'];
            if (angular.isUndefined($stateParams.datasource)){
                $state.go("datasource");
                return;
            }

            var onSurvivalData = function(data){

                if (data.data.cmd=="getSurvivalData"){
                    var groups = data.data.data.cohorts;
                    
                    for (var i=0; i<groups.length; i++){
                        groups[i].color = colors[i];
                        addCurve(groups[i], [data.data.data.min,  data.data.data.max]);
                    }
                }
            }
            osCohortService.onMessage.add(onSurvivalData);

            // View Model
            var vm = this;
            vm.datasource = osApi.getDataSource();

            var svg = d3.select(".survival-chart")
                .append("svg")
                .attr("width",1000)
                .attr("height",500)
                // .append("rect")
                // .attr("width",1000)
                // .attr("height", 500)
                // .attr("fill", "pink");

            var addCurve = function(group, timeScaleRange){
            
                // Determine Percentages
                group.data.forEach(function(v){
                    if (v[1]==1) {
                        this.percent -= (this.percent/this.remainingPopulation);
                    }
                    v.push( this.percent );
                    this.remainingPopulation -= 1;
                },{deathIndex:0, remainingPopulation: (group.data.length+group.alive), percent:100})

                // Adjust Censored Locations
                var percent = 0;
                for (var i=group.data.length-1; i>=0; i--){
                    if (group.data[i][1]==1) percent = group.data[i][2];
                    if (group.data[i][1]==2) group.data[i][2] = percent;
                }

                // Add Additional Points For Death Angles
                var points = group.data.reduce(function(p,c){
                    if (c[1]==1) p.line.push(c);
                    else p.tick.push(c);
                    return p;
                }, {line:[], tick:[]} );
                
                var output = [];
                points.line.forEach(function(c,i,a){
                    output.push(c);
                    if (i<a.length-1){
                        output.push([ c[0], 0, a[i+1][2] ]);
                    }
                })
                points.line = output;

                // Determine Scales
            
                var timeScale = d3.scale.linear().domain(timeScaleRange).range([0,1000]);
                var deathScale = d3.scale.linear().domain([100,0]).range([0,500]);

                // Define Line
                var valueline = d3.svg.line()
                    .x(function(d) { return timeScale(d[0]); })
                    .y(function(d) { return deathScale(d[2]); });

                svg.append("path")
                    .attr("class", "line")
                    .attr("stroke-width", 1)
                    .attr("stroke", group.color)
                    .attr("fill","none")
                    .attr("d", valueline(points.line))
                    .on("mouseover", function(){
                        d3.select(this).attr("stroke-width", 2)
                    })
                    .on("mouseout", function(){
                        d3.select(this).attr("stroke-width", 1)
                    });

                for (var i=0; i<points.tick.length; i++){
                    svg.append("line")
                        .attr("class", "line")
                        .attr("stroke-width", 1)
                        .attr("stroke", group.color)
                        .attr("x1", timeScale(points.tick[i][0]))
                        .attr("x2", timeScale(points.tick[i][0]))
                        .attr("y1", deathScale(points.tick[i][2])-3)
                        .attr("y2", deathScale(points.tick[i][2]));
                }
            }

/*
ALIVE | DEAD
if (status_vital=="dead"){
    days_to_death
}
if (status_vital==na){
    censored = datys_to_last_contact
}
*/

     


            osCohortService.getSurvivalData();
            // vm.datasource = $stateParams.datasource;

            // // Set Dataset 
            // osApi.setBusy(true);
            // osApi.setDataset(vm.datasource).then(function() {
            //     // If No Patients Are Selected, Fetch All Patients
            //     if (osHistory.getPatientSelection()==null){
            //         osApi.getPatientHistoryTable(vm.datasource).then(function(response) {
            //             draw(response.payload.tbl.map( function (d) { return d[0]; }));
            //         });
            //     }else{
            //         draw(osHistory.getPatientSelection().ids);
            //     }
            // });

            // // Register History Component
            // osHistory.onPatientSelectionChange.add(function(selection){
            //     draw(selection.ids)
            // });

            // // Draw
            // var draw = function(ids){
            //     osApi.setBusy(true);
            //     osApi.getCalculatedSurvivalCurves(ids, "").then(function(r){
            //         angular.element("#survival-img").attr('src',r.payload);
            //         osApi.setBusy(false);
            //     });
            // }

             // Destroy
            $scope.$on('$destroy', function() {
                osCohortService.onMessage.remove(onSurvivalData);

        
            });
                
        }
    }
})();
