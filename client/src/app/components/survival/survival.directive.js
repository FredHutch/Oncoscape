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
        function SurvivalController(osApi, $state, $timeout, $scope, $stateParams) {

            if (angular.isUndefined($stateParams.datasource)){
                $state.go("datasource");
                return;
            }

            // time n.event
            var groups = [
                {
                    name:  'People',
                    color: 'red',
                    data:[
                    [1,1],
                    [3,2],
                    [4,1],
                    [10,1],
                    [13,2],
                    [16,2],
                    [24,1],
                    [26,1],
                    [27,1],
                    [28,1],
                    [30,2],
                    [32,1],
                    [41,1],
                    [51,1],
                    [65,1],
                    [67,1],
                    [70,1],
                    [72,1],
                    [73,1],
                    [77,1],
                    [91,1],
                    [93,1],
                    [96,1],
                    [100,1],
                    [104,1],
                    [157,1],
                    [167,1]
                    ]
                }
            ];

            // View Model
            var vm = this;

            var svg = d3.select(".survival-chart")
                .append("svg")
                .attr("width",1000)
                .attr("height",500);




            var addCurve = function(group){
            
                // Determine Percentages
                group.data.forEach(function(v){
                    if (v[1]==1) {
                        this.percent -= (this.percent/this.remainingPopulation);
                        console.log(this.percent);
                    }
                    v.push( this.percent );
                    this.remainingPopulation -= 1;
                    
                },{deathIndex:0, totalPop: group.data.length, remainingPopulation: group.data.length, percent:100})

                
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


                // Determine Scales
                var ext = d3.extent(group.data, function(x){ return x[0] });
                var timeScale = d3.scale.linear().domain(ext).range([0,1000]);
                var deathScale = d3.scale.linear().domain([100,0]).range([0,500]);


                // Define Line
                var valueline = d3.svg.line()
                    .x(function(d) { return timeScale(d[0]); })
                    .y(function(d) { return deathScale(d[2]); });

                svg.append("path")
                    .attr("class", "line")
                    .attr("stroke-width", 1)
                    .attr("stroke", "black")
                    .attr("fill","none")
                    .attr("d", valueline(output));
                    

            }




            addCurve(groups[0])
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
        }
    }
})();
