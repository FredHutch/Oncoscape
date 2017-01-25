
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


    

    // d3: Define Data: The first array, here named `nodes`,
    // contains the object that are the focal point of the visualization.
    // The second array, called `links` below, identifies all the links
    // between the nodes. Each node has an assoicated image and radius. 
    var root = {
        "nodes": [{
            "id": "thumb",
            "image": "photos/oncoscapeDocHomepage/thumb.jpg",
            "r": 50
        }, {
            "id": "mp",
            "image": "photos/toolImages/mp.png",
            "r": 50
        }, {
            "id": "timelines",
            "image": "photos/toolImages/timelines.png",
            "r": 50
        }, {
            "id": "dataexplorer",
            "image": "photos/toolImages/dataexplorer.png",
            "r": 50
        }, {
            "id": "survivalcurve",
            "image": "photos/toolImages/survivalcurve.png",
            "r": 50
        }, {
            "id": "spreadsheet",
            "image": "photos/toolImages/spreadsheet.png",
            "r": 50
        }, {
            "id": "pca",
            "image": "photos/toolImages/pca.png",
            "r": 50
        }, {
            "id": "api",
            "image": "photos/toolImages/api.png",
            "r": 50
        }],
        // The `links` array contains objects with a `source` and a `target`
        // property. The values of those properties are the indices in
        // the `nodes` array of the two endpoints of the link.
        "links": [{
            "source": "timelines",
            "target": "spreadsheet"
        }, {
            "source": "thumb",
            "target": "timelines"
        }, {
            "source": "api",
            "target": "pca"
        }, {
            "source": "thumb",
            "target": "dataexplorer"
        }, {
            "source": "thumb",
            "target": "api"
        }, {
            "source": "survivalcurve",
            "target": "dataexplorer"
        }, {
            "source": "survivalcurve",
            "target": "mp"
        }]
    };

    // graph above variables
    var graph = root;

    //create an SVG container to hold the visualization. Only need to specify
    // the dimensions for this container.
    var svg = d3.select("svg"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    // define defs needed for pattern/images and loop through each node grabing id images and radius.
    var def = svg.append("defs");
    for (var i = 0; i < root.nodes.length; i++) {

        var size = root.nodes[i].r * 2;

        var pattern = def.append("pattern")
            .attr("id", root.nodes[i].id)
            .attr("patternUnits", "objectBoundingBox")
            .attr("width", "1")
            .attr("height", "1")

        pattern.append("image")
            .attr("xlink:href", root.nodes[i].image)
            .attr("x", "0").attr("y", "0")
            .attr("width", size)
            .attr("height", size)
    }

    // create a force Simulation object and define its properties.
    // Those include the dimensions of the visualization and the arrays
    // of nodes and links. Forces read the node’s current position ⟨x,y⟩ and 
    //then add to (or subtract from) the node’s velocity ⟨vx,vy⟩. 
    var simulation = d3.forceSimulation()
        //how far apart the nodes are
        .force("charge", d3.forceManyBody().strength(-1050)) 
        .force("link", d3.forceLink().id(function(d) {
            return d.id;
        }).distance(200))
        .force("x", d3.forceX(width / 2))
        .force("y", d3.forceY(height / 2))
        .on("tick", ticked);

    // delcare node and link variables
    var link = svg.selectAll(".link"),
        node = svg.selectAll(".node");

    simulation.nodes(graph.nodes);
    simulation.force("link").links(graph.links);



    // Add classes to link and node for CSS:
    // The order here is important because nodes need to appear "on top of"
    // the links. SVG doesn't really have a convenient equivalent
    // to HTML's `z-index`; instead it relies on the order of the
    // elements in the markup. By adding the nodes _after_ the
    // links we ensure that nodes appear on top of links.
    link = link
        .data(graph.links)
        .enter().append("line")
        .attr("class", "link");

    node = node
        .data(graph.nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", function(d) {
            return d.r;
        })
        .style("fill", function(d) {
            return "url(#" + d.id + ")";
        })
        // d3 drag ability to move nodes
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // We also need to update positions of the links.
    // For those elements, the force layout sets the
    // `source` and `target` properties, specifying
    // `x` and `y` values in each case.

    function ticked() {
        link.attr("x1", function(d) {
                return d.source.x;
            })
            .attr("y1", function(d) {
                return d.source.y;
            })
            .attr("x2", function(d) {
                return d.target.x;
            })
            .attr("y2", function(d) {
                return d.target.y;
            });

        //As the force layout runs it updates the `x` and `y` properties
        // that define where the node should be centered.
        node.attr("cx", function(d) {
                return d.x;
            })
            .attr("cy", function(d) {
                return d.y;
            });
    }

    // Drag start and end functions. Alpha to "reheat"
    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }


    // document ready close
});