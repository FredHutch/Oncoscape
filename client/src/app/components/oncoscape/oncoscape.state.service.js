(function() {
	'use strict';

	angular
		.module('oncoscape')
		.service('osState', osState);

	/** @ngInject */
	function osState(signals) {
		this.getUser = getUser;
		this.filters = (function(){
			var _filter = null;
			var _filters = [];

			var add = function(filter){
				if (_filter){
					_filter.children = _filter.children || [];
					_filter.children.push(filter);
				}else{
					_filters.push(filter);
				}
				_filter = filter;
				onChange.dispatch(_filters);
				onSelect.dispatch(filter);
			};

			var remove = function(filter){
				onChange.dispatch(_filters);
			};

			var removeAll = function(){
				_filters = [];
				onChange.dispatch(_filters);
			};

			var select = function(filter){
				_filter = (filter.parent) ? filter : null;
				onSelect.dispatch(filter);
			}

			var exe = function(data){
				_filters.forEach(function(f){
					data = data.filter(f.fn, f.vs);
				});
				return data;
			};
			var get = function(){
				return _filters;
			}

			// Events
			var onChange = new signals.Signal(); // Fired When Data Changes
			var onSelect = new signals.Signal(); // Fired When Selection changes

			return {
				get:get,
				add:add,
				remove:remove,
				removeAll: removeAll,
				select: select,
				onChange: onChange,
				onSelect: onSelect,
				exe:exe
			};
				
		})();

		function getUser(){
			return {
				"name":"",
				"password":"",
				"domain":{"name":"Guest"},
				"authenticated":false,
				"token": null
			}
		}
	}
})();