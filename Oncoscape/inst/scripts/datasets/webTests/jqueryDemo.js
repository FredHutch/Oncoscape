
//----------------------------------------------------------------------------------------------------
var singlePageURL = "http://localhost:7578";
var testCount = 8;
//----------------------------------------------------------------------------------------------------
casper.test.begin('Singlepage Datasets works', testCount, function suite(test) {

   casper.start(singlePageURL, function() {

      casper.page.injectJs("/Users/pshannon/www/js/jquery-2.1.0.min.js");
      test.assertTitle("Datasets", "loaded " + singlePageURL);

      var optionCount = this.evaluate(function() {
         var options = $('option');
         return options.length;
         });
      test.assert(optionCount === 4) ; this.echo("option elements found: " + optionCount);

      var datasetMenuOptionCount = this.evaluate(function() {
         var options = $('#datasetMenu option');
         return options.length;
         });
      test.assert(datasetMenuOptionCount === 3);

      test.assert(this.evaluate(function() {
         return ($("#datasetMenu option[value='DEMOdz']").length == 1);
         }));

      test.assert(this.evaluate(function() {
         return ($("#datasetMenu option[value='TCGAgbm']").length == 1);
         }));

      test.assert(this.evaluate(function() {
         var buttonFound = $("#selectDatasetButton").length === 1;
         var disabled = $("#selectDatasetButton").prop("disabled")
         return (buttonFound && disabled)
         }), "selectDatasetButton properly disabled");

      test.assert(this.evaluate(function(){
         var datasetMenu = $("#datasetMenu");
         var menuFound = (datasetMenu.length === 1);
         datasetMenu.val("DEMOdz").change();
         var correctDataset = (datasetMenu.val() == "DEMOdz");
         var useDatasetButtonReady = ($("#selectDatasetButton").prop("disabled") === false);
         //var tbl = $("#manifestTable");
         //this.echo("=== tbl: " + tbl);
         //var datatableFound = (tbl.length === 1);
         //var manifestLoaded = (tbl.dataTable().fnSettings().fnRecordsTotal() === 5)
         return(menuFound && correctDataset);
         }), "DEMODdz dataset specified");

         // next up:  get this waitForSelector to work, showing manifest table is loaded
      casper.then(function(){
         //var target = "#manifestTable";
         var target = "#datasetMenu";
         //var target = "#manifestTable_wrapper";
         casper.page.render("/Users/pshannon/Desktop/manifestTable.png");
         this.waitForSelector(target, function() {
            test.assertExists(target, "manifestTable found: " + target);
            });
         });


      }); // casper.start

   casper.run(function() {
       test.done();
       });

}); 