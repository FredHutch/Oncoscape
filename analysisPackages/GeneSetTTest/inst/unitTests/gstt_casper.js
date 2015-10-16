// gstt_casper.js
// Tests the running GSTT in cBio portal.  
//
// To launch R server & Tomcat
//    see /home/sttrweb/cbio/makefile
// 
// To run casper tests:
//     cd /home/sttrweb/tomcat/jz-instance/webapps/cbioportal
//     casperjs --no-colors test gstt_casper.js
//----------------------------------------------------------------------------------------------------
//var casper = require('casper').create({
//    verbose:true,
//    loglevel: "debug"
//});
var siteURL ;
var links = [];
//var TEST_USER_ID = "test@nowhere.org";
var TEST_USER_ID;
var TEST_USER_PASSWORD ;
var testCount = 2;
//----------------------------------------------------------------------------------------------------
casper.test.begin('MSK cBioPortal', testCount, function suite(test)
{

   var fs = require("fs");
   //siteURL1 = "http://lopez.fhcrc.org:11006/cbioportal";
   siteURL = "http://lopez:11006/cbioportal/index.do?cancer_study_list=brca_tcga_pub&cancer_study_id=brca_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_tcga_pub_gistic&data_priority=0&case_set_id=brca_tcga_pub_cnaseq&case_ids=&gene_set_choice=prostate-cancer%3A-ar-signaling-%2810-genes%29&gene_list=SOX9+RAN+TNK2+EP300+PXN+NCOA2+AR+NRIP1+NCOR1+NCOR2&clinical_param_selection=null&tab_index=tab_visualize&Action=Submit";
   //testStartupAndNavBar(test, siteURL);
   test2(test,siteURL);
      casper.run(function() {
      test.done();
      });

});
//----------------------------------------------------------------------------------------------------
function testStartupAndNavBar(test, siteURL)
{
   console.log("=== testStartupAndNavBar");

   casper.start(siteURL, function() {
   		if(status !== "success"){
			this.echo("loaded");
			this.reload(function() {
				this.echo("loaded again");
			});
		}
		
		   test.assertEquals(1 + 1, 2);
		   test.assertTitle("MSK cBioPortal", "correct homepage title");
		   this.click('#header td.navigation li:first-child');
		   test.comment('⌚️  Clicking the Home tab');
		   this.sendKeys('body', 'c', {modifiers: 'ctrl+alt'}); 
	   		
	   	   this.test.assertExists('#tissue_anchor i:first-child');
	   	   this.click('#tissue_anchor');
	   	   test.comment(' Clicking tissue_anchor');
	   	   
	   	   if(this.evaluate(function() {return document.getElementById('brca_tcga_pub_anchor').className == "jstree-anchor jstree-clicked";}))
	   	   {
	   	   		this.echo('checkbox is checked');
	   	   	}else{
	   	   		this.echo('checkbox is unchecked');
	   	   		}
	   		
		    
		   
		   
		   this.test.assertExists('#select_gene_set');
		    
		   if(this.evaluate(function() {
        			//document.querySelector('select_gene_set').selectedIndex = 2; //it is obvious
        			 $('#select_gene_set').val('prostate-cancer:-ar-signaling-(10-genes)').change();
        			return $('#select_gene_set').val() == 'prostate-cancer:-ar-signaling-(10-genes)';
    			}) == true)
    		{
    			this.echo("2nd of the dropdown is selected");
    		}else{
    			this.echo("2nd of the dropwdown is not selected");
    			}
    			
    		if(this.evaluate(function(){return document.querySelector('#step2').style.display == 'block';}))
    		{ this.echo("#step2 is displayed");
    		}else{ this.echo("#step2 is not displayed");}
    		casper.capture("/home/sttrweb/tomcat/jz-instance/webapps/cbioportal/hidden/step2.png");
      			
    		this.test.assertExists('#select_case_set');
		    
		   if(this.evaluate(function() {
        			//document.querySelector('select_gene_set').selectedIndex = 3; //it is obvious
        			 $('#select_case_set').val('brca_tcga_pub_sequenced').change();
        			return $('#select_case_set').val() == 'brca_tcga_pub_sequenced';
    			}) == true)
    		{
    			this.echo("3rd of the dropdown is selected");
    		}else{
    			this.echo("3rd of the dropwdown is not selected");
    			}
		   	
		   /*this.evaluate(function() {return document.getElementById('select_gene_set').lastChild.value == "general:-invasion-metastasis-(27-genes)";}))
		    {
	   	   		this.echo('correct drop down selection');
	   	   	}else{
	   	   		this.echo('incorrect drop down selection');
	   	   		}
		   this.thenEvaluate(function chooseGeneSet(){
				console.log($('#select_gene_set'));
				var $select = $('#select_gene_set');
				var _option = $select.find('option:last-child').val();
				//var _option = 'glioblastoma:-rtk/ras/pi3k/akt-signaling-(17-genes)';
				$select.val(_option);
				test.assertEquals($select.val(_option), 'general:-invasion-metastasis-(27-genes)');
				test.comment("the first geneset is selected");
				$select.change();
			};)*/
		  
		  this.test.assertExists('#main_query_form', 'main query form is found');
		  this.test.assertExists('#main_submit', 'main submit button is found');
		  //this.click('#main_submit');
		  //test.comment('main_submit button is clicked');
		  
		  this.fill('#main_form',{
		  	//'cancer_study_id' : 'brca_tcga_pub',
		  	//'brca_tcga_pub_mutations' : true,
		  	//'brca_tcga_pub_gistic' : true,
		  	//'data_priority': 0,
		  	//'case_set_id' : 'brca_tcga_pub_all',
		  	'gene_set_choice': 'prostate-cancer:-ar-signaling-(10-genes)',
		    },true);
		    
		  /*this.then(function() {
  			this.evaluate(function() {
   				 document.getElementById("main_submit").click();
  			});
		  });*/
		  if(this.evaluate(function() {
				//return document.querySelector('#pri_mutcna').value == "0";}))
				//return document.querySelector('#brca_tcga_pub_anchor').className == "jstree-anchor jstree-clicked";}))
				//return document.querySelector('#select_gene_set').value == "prostate-cancer:-ar-signaling-(10-genes)";}))
				return document.querySelector('#select_case_set').value == "brca_tcga_pub_sequenced";}))
		  { this.echo("all the values are selected");
		  }else{
		  	this.echo("some values are not selected");
		  }
			
			
			/*this.waitForSelector("#tabs",
    		function pass () {
       			 test.pass("Found #tabs");
    		},
    		function fail () {
        		test.fail("Did not load element #tabs");
    		}
		);*/
			
	  			   
    });

} // testStartupAndNavBar
//----------------------------------------------------------------------------------------------------
function test2(test,siteURL)
{	console.log("=== test2");

    casper.start(siteURL, function() {
  		this.test.assertExists("#tabs");
  		casper.capture("/home/sttrweb/tomcat/jz-instance/webapps/cbioportal/hidden/queryResultPage.png");
  		this.test.assertExists("#gstt");
        this.click("#ui-id-11");
        
        test.comment("clicked Oncoscape tab");       
        casper.capture("/home/sttrweb/tomcat/jz-instance/webapps/cbioportal/hidden/beforequeryResultOncoTab.png");
        test.comment("saved gstt active tab png");
        
 	   	/*if(this.evaluate(function() { return $("#gstt").attr("style") === "display: block;"; }))
	   	{
			this.echo('Oncoscape tab is active');
		}else{
			this.echo('Oncoscape tab is not active');
		}
		this.waitForSelector("#gstt",
			function pass(){
				test.pass("Found #gstt");
			},
			function fail(){
				test.fail("Didn't load element #gstt");
			});*/
			
			
//    	casper.capture("/home/sttrweb/tomcat/jz-instance/webapps/cbioportal/hidden/queryResultOncoTab.png");
        this.click("#geneSetTTestsLaunchButton");
        test.comment("running calculate");
/*        this.waitForSelector("#geneSetTTestsOutputsDiv h4",
			function pass(){
				test.pass("Found #geneSetTTestsOutputsDiv h4");
			},
			function fail(){
				test.fail("Didn't load element #geneSetTTestsOutputsDiv h4");
			}, 40000);
		casper.capture("/home/sttrweb/tomcat/jz-instance/webapps/cbioportal/hidden/queryResultRunGSTT.png");	
        test.comment("saved gstt result png");
*/		
		/*this.click("#MONTERO_THYROID_CANCER_POOR_SURVIVAL_UP");
		this.waitForSelector("#heatMapImageArea",
			function pass(){
				test.pass("Found #heatMapImageArea");
			},
			function fail(){
				test.fail("Didn't load element #heatMapImageArea");
			});*/
	});
	
}	
//----------------------------------------------------------------------------------------------------
