(function() {
	'use strict';

	angular
		.module('oncoscape')
		.service('osState', osState);

	/** @ngInject */
	function osState(signals) {
		this.getUser = getUser;
		this.filterChange = new signals.Signal();
		this.getFilters = getFilters;
		this.addFilter = addFilter;
		this.remFilter = remFilter;

		function getUser(){
			return {
				"name":"",
				"password":"",
				"domain":{"name":"Guest"},
				"authenticated":false,
				"token": null
			}
		}

		var filterTree = {name:"datasource"};
		var filterTreeNode = filterTree;
		function getFilters(){
			return filterTree;
		}
		function addFilter(ffn){
			var x = filterTree;
			if (!filterTreeNode.children) filterTreeNode.children = [];
			filterTreeNode.children.push(ffn);
			filterTreeNode = ffn;
			this.filterChange.dispatch(ffn);
		}
		function remFilter(ffn){

		}

		/*
		{
			    name: "datasource",
			    "parent": "null",
			    "children": [{
			        "name": "Level 2: A",
			        "children": [{
			            "name": "Son of A"
			        }, {
			            "name": "Daughter of A",
			            "children": [{
			                "name": "Son of A"
			            }, {
			                "name": "Daughter of A",
			                "children": [{
			                    "name": "Son of A"
			                }, {
			                    "name": "Daughter of A",
			                    "children": [{
			                        "name": "Son of A"
			                    }]
			                }, {
			                    "name": "Daughter of A"
			                }]
			            }]
			        }]
			    }, {
			        "name": "Level 2: B"
			    }]
			};
		*/
		/*
		function addFilter(){

		}
		,
                "children": [{
                    "name": "Level 2: A",
                    "children": [{
                        "name": "Son of A"
                    }, {
                        "name": "Daughter of A",
                        "children": [{
                            "name": "Son of A"
                        }, {
                            "name": "Daughter of A"
                        }]
                    }]
                }, {
                    "name": "Level 2: B"
                }]
		*/



	}
})();