<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Oncoscape</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
    <script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min.js"></script>
    <script src="//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js"></script>
    <script src="//use.fontawesome.com/08ee93173f.js"></script>
    <link href='styles/oncoscape.css' rel='stylesheet' type='text/css'>
    <link href="//fonts.googleapis.com/css?family=Lato:400,300,200,100" rel="stylesheet" type="text/css">
    <link href="//cdnjs.cloudflare.com/ajax/libs/animate.css/3.0.0/animate.min.css" rel="stylesheet" type="text/css">
    <!--CDN link for  TweenMax-->
    <script src="//cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/TweenMax.min.js"></script>
    <!--CDN link for  d3j-->
    <script src="//d3js.org/d3.v4.min.js"></script>
    <script src="scripts/oncoscape.js"></script>
  
    
    <!-- FOUC correction -->
    <style type="text/css">
        .js #fouc {
            display: none;
        }
    </style>
    <script type="text/javascript">
        document.documentElement.className = 'js';
    </script>
</head>

<body data-spy="scroll" data-target="#header">


    <!-- FOUC correction -->
    <div id="fouc">
        <nav id="nav-bar" class="navbar navbar-inverse navbar-fixed-top" role="navigation">
            <div class="container-fluid">

                <div class="navbar-header">
                    <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
        <span class="sr-only">Toggle navigation</span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
      </button>
                    <img alt="Brand" src="photos/header/logo-white.png" class="header-logo-img">
                    <a class="navbar-brand" href="/" target="_blank">
                        <span class="header-logo-text">Oncoscape</span> </a>
                </div>

                <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                    <ul class="nav navbar-nav navbar-right" style="padding-top: 10px;">
                        <li class="dropdown">
                            <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"><span class="glyphicon glyphicon-stats"></span> Tools</a>
                            <ul class="dropdown-menu">
                                <li>
                                    <a href="timelines.html"><img class="header-dropdown-img" src="photos/toolImages/timelines.png">Timelines</a>
                                </li>
                                <li>
                                    <a href="spreadsheet.html"><img class="header-dropdown-img" src="photos/toolImages/spreadsheet.png">Spreadsheet</a>
                                </li>
                                <li>
                                    <a href="pca.html"><img class="header-dropdown-img" src="photos/toolImages/pca.png">PCA</a>
                                </li>
                                <li>
                                    <a href="markerspatients.html"><img class="header-dropdown-img" src="photos/toolImages/mp.png">Markers + Patients</a>
                                </li>
                                <li>
                                    <a href="survival.html"><img class="header-dropdown-img" src="photos/toolImages/survivalcurve.png">Survival</a>
                                </li>
                            </ul>
                        </li>
                        <li><a href="http://resources.sttrcancer.org/api/"><span class="fa fa-database"></span> Data + API</a></li>
                        <li><a href="http://resources.sttrcancer.org/oncoscape-contact"><span class="fa fa-comments"></span> Feedback</a></li>
                        <li><a href="http://oncoscape.sttrcancer.org" target="_blank" style="letter-spacing: 2px;">Try Oncoscape</a></li>
                    </ul>
                </div>
            </div>
        </nav>
        <main>