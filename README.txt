Oncoscape
---------
Version: oncoDev14 (Release)
Last Modified 8/20/15

Oncoscape  is developed at the Fred Hutchinson Cancer Research Center under the 
auspices of the Solid Tumor Translational Research initiative.

Oncoscape is as an SPA -- a single page web application -- using JavaScript in the 
browser and R (primarily) on the backend server. It is an R package, though the 
immediate web-facing http server, currently written in R, will likely change over time 
to a more traditional architecture.

The goal of Oncoscape is to provide browser-based, user-friendly data exploration tools 
for rich clinical and molecular cancer data, supported by statistically powerful analysis.
R is very well-suited to handling data, and performing analysis. JavaScript in the 
browser provides a rich and nimble user experience.  Data & methods are sent and received
through websockets using the chinook protocol (https://github.com/oncoscape/chinook) for
message passing.

Oncoscape's design encourages custom deployments focused on any clinical/molecular 
data set. Oncoscape, here at GitHub, ships with patient and molecular data from the 
TCGA's study of Glioblastoma multiforme. 

	Main Components:
		oncoDev14        - main oncoscape code with all tabs/submodules
		dataPackages     - clinical and molecular data files and API
		analysisPackages - computational methods that execute on passed data
	Optional:
		Rlibs			 - local installation folder for running compiled packages
		
		
Install
-------

Oncoscape can be installed within a local Rlibs folder or within the native R application.
Read INSTALL for instructions.


Configure
---------

Oncoscape requires several R dependencies, which can easily be obtained using Bioconductor's
biocLite source repository.  Data and analysis packages can be installed independently, 
but should reside in the same installation directory as Oncoscape.  Note that the 
PatientHistory and SttrDataPackage are required base classes of the data packages.  

Documentation
-------------

Documentation for each module and dataset can be found within the respective R package.  
An overview of how to contribute new modules is ###TBD###

Update
------

OncoDev14 (v1.4.60) was built and tested under R version >=3.2.1
The latest version of Oncoscape can be obtained through the gitHub website ####

Authors
-------

The code base for Oncoscape was written by Paul Shannon, Lisa McFerrin, Hamid Bolouri, and
Jenny Zhang under the direction of the STTR at Fred Hutch.

Contact
-------

To report any bugs, submit patches, or request new features, please email
contact@oncoscape.org

STTRcancer
Fred Hutchinson Cancer Research Center
1100 Fairview Ave N
Seattle, WA 98109

-------------------------------------------------------------------------------
Copyright (c) 2014  Solid Tumor Translational Research    http://www.sttrcancer.org

The MIT License (MIT)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.