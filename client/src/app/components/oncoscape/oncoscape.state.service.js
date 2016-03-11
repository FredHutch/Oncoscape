(function() {
	'use strict';

	angular
		.module('oncoscape')
		.service('osState', osState);

	/** @ngInject */
	function osState(signals, osApi) {

		/* User Object */
		this.getUser = function(){
			return {
				"name":"",
				"password":"",
				"domain":{"name":"Guest"},
				"authenticated":false,
				"token": null
			}
		};


		this.setDatasource = function(name){ this.patientFilters.set(name); }
		this.patientFilters = filter();
		this.geneFilters = filter();
		
		function filter(){
			var _root = null
			var _filter = null;

			var add = function(filter){
				_filter.children = _filter.children || [];
				_filter.children.push(filter);
				_filter.selected = false;
				_filter = filter;
				_filter.selected = true;
				onChange.dispatch(_filter);
				onSelect.dispatch(_filter);
			};
			var remove = function(filter){
				
			};
			var removeAll = function(){
				
			};
			var select = function(filter){
				_filter.selected = false;
				_filter = filter;
				_filter.selected = true;
				onSelect.dispatch(filter);
			}
			var set = function(datasource){
				_root = _filter = {
					selected: true,
					parent: null,
					icon: datasource,
					name: datasource,
					ids: [],
					children: [],
					depth: 0
				}
			}
			var get = function(){
				return _root;
			}
			var selected = function(){
				return _filter;
			}
			// Events
			var onChange = new signals.Signal(); // Fired When Data Changes
			var onSelect = new signals.Signal(); // Fired When Selection changes

			return {
				filter:get,
				add:add,
				remove:remove,
				removeAll: removeAll,
				select: select,
				onChange: onChange,
				onSelect: onSelect,
				selected: selected,
				get: get,
				set: set
			};
				
		};
		

		
	}
})();