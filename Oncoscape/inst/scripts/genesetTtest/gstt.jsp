<%--
 - Copyright (c) 2015 Memorial Sloan-Kettering Cancer Center.
--%>

<%@ page import="org.json.simple.JSONObject"%>


<div id="gstt">
    <div  class="pull-right">
		<img src="oncoscape_logo.jpeg" alt="Oncoscape@Fred Hutch" style="width:221px;height:56px;margin-bottom:10px;margin-left:10px;">
	</div>
	<h4 style="margin-top:20px;"> Oncoscape Geneset T-test</h4>
	<div style="margin-top:20px;">
		<p>1. Select two gene sets from the list below to analyze for geneset t-test enrichment.</p>
        <p>2. Select participation threshold<sup>*</sup> and p-value maximum.</p>
        <p><font color="grey" style="font-size:0.75em"><sup>*</sup>This threshold will identify gene sets in which only a percentage of the genes
		are signficantly different in the two patient groups, in effect providing
		search over dynamically discovered "sub-genesets".</font></p>
	</div>
	<hr>
	<div  id="gsttmain"></div>
	<div  class="pull-left"><a href="http://www.fredhutch.org/" target="_blank"><img src="fhcrc_logo.jpeg" alt="Fred Hutch Cancer Research Center" 
		   style="width:191px;height:37px;margin-top:30px;margin-bottom:10px;"></a>
	</div>
</div>

<script>
	
	$(document).ready(function() {
        $("#gsttmain").load("gstt.html");
    });
    
    /*function codeAddress(){
    	$("#gsttmain").load("gstt.html");
    }
    window.onload = codeAddress;*/
</script>
