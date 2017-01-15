
$(document).ready(function() {

    // js for url, hide following if embeded
    if (window.location.href.indexOf("embed=true") != -1) {

        $("#section-intro, #nav-bar, div.subnav.container, div.header, #footer").hide();
        $('body').css({
            'padding-top': '0px',
            'background0-color': '#fff'
        });
    }

    document.getElementById("fouc").style.display = "block";

    // video swap
    $(".video").click(function(e) {

        // Get A reference to the item that was clicked on (Div with the class video")
        var elVideo = $(e.currentTarget);

        // Find the Contained In the Current Item With The Class Video Title + Save The Text To A Variable
        var titleText = elVideo.find(".videoTitle").text();
        var transcriptText = elVideo.find(".videoTranscript").html();
        var videoUrl = elVideo.find(".videoLink").attr("href");


        $(".videoCurrentTitle").text(titleText);
        $(".videoCurrentTranscript").html(transcriptText);
        $(".videoPlayer").attr("src", videoUrl);

    });

    $(".video").first().click();


    // Place Subnav
    (function() {

        // get height of window
        var windowHeight = $(window).height();


        // get height of nav + subnav
        var navHeight = $(".navbar").height();
        var subnavHeight = 75;

        // get height of the content (without padding or margin)
        var elMarquee = $("#section-intro");
        var contentHeight = elMarquee.height()


        // Height of Window - Height of Nav + SubNav - Height of content = How much padding is nessisary
        var padding = Math.round((windowHeight - navHeight - subnavHeight - contentHeight) * .5);


        // Set Marquee Padding
        elMarquee.css({
            "padding-top": padding,
            "padding-bottom": padding
        });

        $(".content-wrapper").css({
            "opacity": 1
        })

    })();

    // fix subnav
    (function() {

        var subnav = $("#header");
        var lockAtPosition = subnav.position().top - 75;
        var isLocked = false;


        // Get All Anchors As Array
        var navbuttons = $(".subnav-item");
        var anchors = $(".anchor").toArray()
            .map(function(anchor) {

                // Get JQuery Version Of Anchor
                anchor = $(anchor);
                var id = anchor.attr("id");
                var pos = anchor.offset().top;
                var selector = 'a[href^="#' + id + '"]';
                var btn = $(selector)[0];
                return {
                    btn: btn,
                    start: pos - 250
                };
            })
            .sort(function(a, b) {
                return (a.start < b.start) ? 1 : -1;
            });




        // Add Click Events To Anchors
        navbuttons.bind("click", function(e) {
            e.preventDefault();

            isLocked = true;
            subnav.addClass("subnav-fixed");

            var idDestination = $(e.currentTarget).attr("href");
            var elDestination = $(idDestination);
            var yPosDestination = elDestination.offset().top;

            $('html, body').stop().animate({
                'scrollTop': yPosDestination - 80
            }, 1200, 'swing');


        });


        var highlighAnchor = anchors[0];
        $(window).scroll(function() {
            var scrollY = window.scrollY;

            if (scrollY >= lockAtPosition) {
                for (var i = 0; i < anchors.length; i++) {
                    var anchor = anchors[i];
                    if (scrollY > anchor.start) {
                        navbuttons.removeClass("highlight");
                        $(anchor.btn).addClass("highlight");
                        break;
                    }

                }

                if (isLocked) return;
                isLocked = true;
                subnav.addClass("subnav-fixed");
            } else {
                if (!isLocked) return;
                isLocked = false;
                subnav.removeClass("subnav-fixed");
            }
        });
    })();

    // edges
    var slideshowFactory = function(options) {

        // Private Variables
        var _urls = options.urls;
        var _container = options.container;
        var _speed = options.speed;
        var _delay = options.delay;
        var _imgs;
        var _img = 0;
        // Add Class To Slide Show
        _container.addClass("slideshow");

        // Create Images
        _imgs = $(_urls.map(function(v) {
            var img = $("<img class='edges' src='" + v + "'>");
            this.append(img)
            return img;
        }, _container));


        var next = function() {
            TweenLite.to(_imgs.eq(_img), _speed, {
                autoAlpha: 0
            });
            _img = ++_img % _imgs.length;
            TweenLite.to(_imgs.eq(_img), _speed, {
                autoAlpha: 1
            });
            TweenLite.delayedCall(_delay, next);
        }

        var start = function() {
            TweenLite.set(_imgs.filter(":gt(0)"), {
                autoAlpha: 0
            });
            TweenLite.delayedCall(_delay, next);
        }

        return {
            start: start
        }
    };

    // START markerPatients
    var ss1 = slideshowFactory({
        container: $("#leftImage"),
        urls: ["style/mpNavigation/edgesAll.png", "style/mpNavigation/edgesCnLoss.png", "style/mpNavigation/edgesMinus2.png"],
        speed: .3,
        delay: 3
    });
    ss1.start();

    var ss2 = slideshowFactory({
        container: $("#rightImage"),
        urls: ["style/mpNavigation/mpEdgesAll.png", "style/mpNavigation/mpEdgesCnLoss.png", "style/mpNavigation/mpEdgesMinus2.png"],
        speed: .3,
        delay: 3
    });
    ss2.start();

    var ss3 = slideshowFactory({
        container: $("#patientcolors1"),
        urls: ["style/mpNavigation/UCSCGender.png", "style/mpNavigation/panCanGender.png", "style/mpNavigation/oncoVogelGender.png"],
        speed: .3,
        delay: 3
    });
    ss3.start();

    var ss4 = slideshowFactory({
        container: $("#patientcolors2"),
        urls: ["style/mpNavigation/UCSCDx.png", "style/mpNavigation/panCanDx.png", "style/mpNavigation/oncoVogelDx.png"],
        speed: .3,
        delay: 3
    });
    ss4.start();

    var ss5 = slideshowFactory({
        container: $("#patientcolors3"),
        urls: ["style/mpNavigation/UCSCTumorSite.png", "style/mpNavigation/panCanTumorSite.png", "style/mpNavigation/oncoVogelTumorSite.png"],
        speed: .3,
        delay: 3
    });
    ss5.start();
    // END markerPatients
    // START Timelines
    var ss6 = slideshowFactory({
        container: $("#leftImageTimeline"),
        urls: ["style/timelineNavigation/layer1Toggle.png", "style/timelineNavigation/layer2Toggle.png", "style/timelineNavigation/layer3Toggle.png"],
        speed: .3,
        delay: 3
    });
    ss6.start();

    var ss7 = slideshowFactory({
        container: $("#rightImageTimeline"),
        urls: ["style/timelineNavigation/layer3.png", "style/timelineNavigation/layer2.png", "style/timelineNavigation/layer1.png"],
        speed: .3,
        delay: 3
    });
    ss7.start();

    var ss8 = slideshowFactory({
        container: $("#patientevents1"),
        urls: ["style/timelineNavigation/patientDrug.png", "style/timelineNavigation/patient2Drug.png", "style/timelineNavigation/patient3Drug.png"],
        speed: .3,
        delay: 3
    });
    ss8.start();

    var ss9 = slideshowFactory({
        container: $("#patientevents2"),
        urls: ["style/timelineNavigation/patientProgression.png", "style/timelineNavigation/patient2Progression.png", "style/timelineNavigation/patient3Progression.png"],
        speed: .3,
        delay: 3
    });
    ss9.start();

    var ss10 = slideshowFactory({
        container: $("#patientevents3"),
        urls: ["style/timelineNavigation/patientStatus.png", "style/timelineNavigation/patient2Status.png", "style/timelineNavigation/patient3Status.png"],
        speed: .3,
        delay: 3
    });
    ss10.start();
    // END Timelines
    // START PCA
    var ss11 = slideshowFactory({
        container: $("#patientPCA1"),
        urls: ["style/pcaNavigation/allGeneDx.png", "style/pcaNavigation/markerGenesDx.png", "style/pcaNavigation/oncoVDx.png"],
        speed: .3,
        delay: 3
    });
    ss11.start();

    var ss12 = slideshowFactory({
        container: $("#patientPCA2"),
        urls: ["style/pcaNavigation/allGeneGender.png", "style/pcaNavigation/markerGenesGender.png", "style/pcaNavigation/oncoVGender.png"],
        speed: .3,
        delay: 3
    });
    ss12.start();

    var ss13 = slideshowFactory({
        container: $("#patientPCA3"),
        urls: ["style/pcaNavigation/allGeneTumorGrade.png", "style/pcaNavigation/markerGenesTumorGrade.png", "style/pcaNavigation/oncoVTumorGrade.png"],
        speed: .3,
        delay: 3
    });
    ss13.start();
    // END PCA
    // START Survival
    var ss14 = slideshowFactory({
        container: $("#leftImageSurvival"),
        urls: ["style/survivalNavigation/allToggle.png", "style/survivalNavigation/12Toggle.png", "style/survivalNavigation/345Toggle.png"],
        speed: .3,
        delay: 3
    });
    ss14.start();

    var ss15 = slideshowFactory({
        container: $("#rightImageSurvival"),
        urls: ["style/survivalNavigation/all.png", "style/survivalNavigation/cohort12.png", "style/survivalNavigation/cohort345.png"],
        speed: .3,
        delay: 3
    });
    ss15.start();
    // END Survival

    // Text for color layouts per tool type
    var slideshowFactory = function(options) {

        // Private Variables
        var _string = options.string;
        var _container = options.container;
        var _speed = options.speed;
        var _delay = options.delay;
        var _texts;
        var _text = 0;

        // Add Class To Slide Show
        _container.addClass("slideshow");
        _texts = $(_string.map(function(v) {
            var colorNames = $("<span class='patientColorText' style='opacity:0;'> " + v + "</span> ");
            this.append(colorNames)
            return colorNames;
        }, _container));

        _texts[0].css({
            opacity: 1
        })

        var next = function() {
            TweenLite.to(_texts.eq(_text), _speed, {
                autoAlpha: 0
            });
            _text = ++_text % _texts.length;
            TweenLite.to(_texts.eq(_text), _speed, {
                autoAlpha: 1
            });
            TweenLite.delayedCall(_delay, next);
        }

        var start = function() {
            TweenLite.set(_texts.filter(":gt(0)"), {
                autoAlpha: 0
            });
            TweenLite.delayedCall(_delay, next);
        }

        return {
            start: start
        }
    };


    var sstext = slideshowFactory({
        container: $("#layoutText"),
        string: ["Layout: mds-All Genes-cnv-mut01-ucsc", "Layout: mds-TCGA pancan mutated-cnv-mut01-ucsc", "Layout: mds-oncoVogel274-cnv-mut01-ucsc"],
        speed: .3,
        delay: 3
    });
    sstext.start();

    var sstext = slideshowFactory({
        container: $("#layoutTextTimeline"),
        string: ["Patient One", "Patient Two", "Patient Three"],
        speed: .3,
        delay: 3
    });
    sstext.start();

    var sstext = slideshowFactory({
        container: $("#layoutTextPCA"),
        string: ["Gene Set: All Gene", "Gene Set: Marker Gene 545", "Gene Set: oncoVogel274 "],
        speed: .3,
        delay: 3
    });
    sstext.start();




    // document ready close
});