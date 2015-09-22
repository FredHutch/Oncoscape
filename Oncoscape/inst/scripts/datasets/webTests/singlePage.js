// singlePage.js:  make sure the standalone (no tabs) version loads, provides
// a couple of datasets, allows selection of either, controls enabled/disabled state
// of the "Use Dataset" button, gets and displays the manifest when that button
// is enabled and clicked
//----------------------------------------------------------------------------------------------------
//var singlePageURL = "http://www.google.fr/";
var singlePageURL = "http://localhost:7578";
var testCount = 9;
//----------------------------------------------------------------------------------------------------
casper.test.begin('Singlepage Datasets works', testCount, function suite(test) {
    casper.start(singlePageURL, function() {
        casper.page.injectJs("/Users/pshannon/www/js/jquery-2.1.0.min.js");
        test.assertTitle("Datasets", "google homepage title is the one expected");
        test.assertExists('#selectDataSetMenuLabel', "menu label found");
        test.assertExists('#datasetMenu', "datset select pulldown menu found");
        test.assertExists('#selectDatasetButton', "use selected dataset button");
        test.assertExists('#datasetsSendSelectionsMenu', "send selections menu");
        });

    casper.then(function() {
       this.echo("=== selecting dataset from pulldown menu");
         // is the menu there?
       var target = "#datasetMenu";
       test.assertExists(target, "found " + target);
         // no dataset has yet been chosen in the pulldown menu, so the "Use Dataset" button should be disabled
       test.assertExists("#selectDatasetButton:disabled")
         // does the menu have the DEMOdz dataset option?
       var target2 = "#datasetMenu option[value='DEMOdz']";
       test.assertExists(target2, "found " + target2);
       this.mouseEvent("mouseDown", "#datasetMenu option[value='DEMOdz']");
       this.mouseEvent('click', "#datasetMenu option[value='DEMOdz']");
       this.mouseEvent("mouseUP", "#datasetMenu option[value='DEMOdz']");
       this.click("#datasetMenu option[value='DEMOdz']");
       test.assertExists("#selectDatasetButton")
       this.click("#selectDatasetButton");
       });

   casper.then(function(){
      var target = "#manifestTable_wrapper";
      this.waitForSelector(target, function() {
         test.assertExists(target, "manifest loaded " + target);
         });
      });


    casper.run(function() {
       test.done();
       });
});
//----------------------------------------------------------------------------------------------------

//casper.test.begin("Datasets singlePage test", testCount, function suite(test)
//{
//  test.assert(true);
//  testStartup(test);
//
//  casper.then(function(){});
//
//  casper.run(function(){
//     test.done();
//     });
//
//});
////----------------------------------------------------------------------------------------------------
//function testStartup(test, singlePageURL)
//{
//   console.log("--- singlePage.js, testStartup");
//
//   casper.start(singlePageURL, function(){
//      console.log("  casper.start executing");
//      test.assertTitle("Datasetsxx", "correct singlePage title");
//      console.log("   found proper title");
//      test.assertExists("#selectDataSetMenuLabel", "correct dataset selector label");
//      console.log("   found proper label");
//      });
//
//} // testStartup
////----------------------------------------------------------------------------------------------------
//casper.test.begin('Google search retrieves 10 or more results', 5, function suite(test) {
//    casper.start("http://www.google.fr/", function() {
//        test.assertTitle("Google", "google homepage title is the one expected");
//        test.assertExists('form[action="/search"]', "main form is found");
//        this.fill('form[action="/search"]', {
//            q: "casperjs"
//        }, true);
//    });
//
//    casper.then(function() {
//        test.assertTitle("casperjs - Recherche Google", "google title is ok");
//        test.assertUrlMatch(/q=casperjs/, "search term has been submitted");
//        test.assertEval(function() {
//            return __utils__.findAll("h3.r").length >= 10;
//        }, "google search for \"casperjs\" retrieves 10 or more results");
//    });
//
//    casper.run(function() {
//        test.done();
//    });
//});
