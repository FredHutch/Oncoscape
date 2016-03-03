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
        function TimelinesController(osApi, $state, $stateParams) {

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource || "DEMOdz";

            // VM Event Handlers
            vm.toggleFilter = function() {
                angular.element(".container-filters").toggleClass("container-filters-collapsed");
                angular.element(".container-filter-toggle").toggleClass("container-filter-toggle-collapsed");
            }

            // Elements
            //var elChart = angular.element("#plsr-chart");

            osApi.setBusy(true)("Loading Dataset");
            osApi.setDataset(vm.datasource).then(function() {
                osApi.getTimelines().then(function(){
                    // var payload = response.payload;
                    // var eventTypes = payload.eventTypes;
                    // var events = payload.events;
                    // var patients = payload.pts;

                    

// var data = [
//   {label: "person a", times: [
//     {"starting_time": 1355752800000, "ending_time": 1355759900000},
//     {"starting_time": 1355767900000, "ending_time": 1355774400000}]},
//   {label: "person b", times: [
//     {"starting_time": 1355759910000, "ending_time": 1355761900000}]},
//   {label: "person c", times: [
//     {"starting_time": 1355761910000, "ending_time": 1355763910000}]},
//   ];
// { var chart = d3.timeline();
//  var svg = d3.select("#timelines-chart").append("svg").attr("width",500)
//  .datum(data).call(chart);}

                    osApi.setBusy(false);
                });
            });

        }
    }
})();
