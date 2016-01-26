// -*- mode: C++; c-indent-level: 4; c-basic-offset: 4;  tab-width: 8; -*-
//
// Wt usage example for RInside, inspired by the standard 'density sliders' example
//
// Copyright (C) 2011  Dirk Eddelbuettel and Romain Francois
//
// This file is licensed under GPL 2 or later, as are the rest of RInside and Rcpp
//
// Derived from hello.C in the Wt sources
// Copyright (C) 2008 Emweb bvba, Heverlee, Belgium.

#include <cstdio>

#include <Wt/WApplication>
#include <Wt/WBreak>
#include <Wt/WContainerWidget>
#include <Wt/WLineEdit>
#include <Wt/WPushButton>
#include <Wt/WText>
#include <Wt/WImage>
#include <Wt/WSpinBox>
#include <Wt/WGroupBox>
#include <Wt/WButtonGroup>
#include <Wt/WRadioButton>
#include <Wt/WHBoxLayout>
#include <Wt/WEnvironment>
#include <Wt/WFileResource>

#include <RInside.h>

using namespace Wt;

class DensityApp : public WApplication {
public:
    DensityApp(const WEnvironment& env, RInside & R);

private:
    WLineEdit *codeEdit_;	// to edit the RNG draw expression
    WButtonGroup *group_;	// holds the radiobuttons
    WSpinBox *spin_;		// selects the density bandwidth
    WImage *img_;		// displays the image
    WFileResource *imgfile_;	// controls the file resources
    WText *greeting_;		// text label for status message

    void reportButton();	// called when new button selected
    void reportEdit();		// called when RNG expression edited
    void reportSpinner();	// called when bandwidth changed
    void plot();		// to call R for new plot
    
    enum Kernel { Gaussian     = 0, Epanechnikov = 1, Rectangular  = 2,
		  Triangular   = 3, Cosine       = 4 };
  
    RInside & R_;		// reference to embedded R instance
    std::string tempfile_;	// name of file used by R for plots
    int bw_, kernel_;		// parameters used to estimate the density
    std::string cmd_;		// random draw command string
    Rcpp::NumericVector Yvec_;	// the random draw
};

// The env argument contains information about the new session, and the initial request. 
// It must be passed to the WApplication // constructor so it is typically also an argument
// for your custom application constructor.
DensityApp::DensityApp(const WEnvironment& env, RInside & R) : WApplication(env), R_(R) {

    setTitle("Witty WebApp With RInside");			// application title

    std::string tfcmd = "tfile <- tempfile(pattern=\"img\", tmpdir=\"/tmp\", fileext=\".png\")";	
    tempfile_ = Rcpp::as<std::string>(R_.parseEval(tfcmd));  	// assign to 'tfile' in R, and report back
    bw_ = 100; 
    kernel_ = 0;						// parameters used to estimate the density
    cmd_ = "c(rnorm(100,0,1), rnorm(50,5,1))";			// random draw command string
   
    Wt::WGroupBox *wc = new Wt::WGroupBox("Density Estimation", root());

    Wt::WHBoxLayout *layout = new Wt::WHBoxLayout();
    Wt::WContainerWidget *midbox = new Wt::WContainerWidget(root());
    layout->addWidget(midbox);
    Wt::WContainerWidget *container = new Wt::WContainerWidget(root());
    layout->addWidget(container);

    wc->setLayout(layout, AlignTop | AlignJustify);

    midbox->addWidget(new WText("Density estimation scale factor (div. by 100)"));
    midbox->addWidget(new WBreak());                       	// insert a line break
    spin_ = new WSpinBox(midbox);
    spin_->setRange(5, 200);
    spin_->setValue(bw_);
    spin_->valueChanged().connect(this, &DensityApp::reportSpinner);

    midbox->addWidget(new WBreak());                       	// insert a line break
    midbox->addWidget(new WText("R Command for data generation"));  // show some text
    midbox->addWidget(new WBreak());                       	// insert a line break
    codeEdit_ = new WLineEdit(midbox);                     	// allow text input
    codeEdit_->setTextSize(30);
    codeEdit_->setText(cmd_); 
    codeEdit_->setFocus();                                 	// give focus
    codeEdit_->enterPressed().connect(this, &DensityApp::reportEdit);

    group_ = new Wt::WButtonGroup(container);		    	// use button group to arrange radio buttons

    Wt::WRadioButton *button;
    button = new Wt::WRadioButton("Gaussian", container);
    new Wt::WBreak(container);
    group_->addButton(button, Gaussian);

    button = new Wt::WRadioButton("Epanechnikov", container);
    new Wt::WBreak(container);
    group_->addButton(button, Epanechnikov);

    button = new Wt::WRadioButton("Rectangular", container);
    new Wt::WBreak(container);
    group_->addButton(button, Rectangular);

    button = new Wt::WRadioButton("Triangular", container);
    new Wt::WBreak(container);
    group_->addButton(button, Triangular);

    button = new Wt::WRadioButton("Cosine", container);
    new Wt::WBreak(container);
    group_->addButton(button, Cosine);

    group_->setCheckedButton(group_->button(kernel_));
    group_->checkedChanged().connect(this, &DensityApp::reportButton);

    Wt::WGroupBox *botbox = new Wt::WGroupBox("Resulting chart", root());
    imgfile_ = new Wt::WFileResource("image/png", tempfile_);
    imgfile_->suggestFileName("density.png");  // name the clients sees of datafile
    img_ = new Wt::WImage(imgfile_, "PNG version", botbox);

    Wt::WGroupBox *stbox = new Wt::WGroupBox("Status", root());
    greeting_ = new WText(stbox);                         	// empty text
    greeting_->setText("Setting up...");
  
    reportEdit();						// create a new RNG draw in Yvec_
    plot();							// and draw a new density plot
}

void DensityApp::reportButton() {
    kernel_ = group_->checkedId(); 				// get id of selected kernel 
    plot();
}

void DensityApp::reportEdit() {
    cmd_ = codeEdit_->text().toUTF8();	// get text written in box, as UTF-8, assigned to string
    std::string rng = "y <- " + cmd_ + ";";
    R_.parseEvalQ(rng);			// evaluates expression, assigns to 'y'
    Yvec_ = R_["y"];			// cache the y vector
    plot();
}

void DensityApp::reportSpinner() {
    bw_ = spin_->value();		// get the value of the spin selector
    plot();
}

void DensityApp::plot() {
    const char *kernelstr[] = { "gaussian", "epanechnikov", "rectangular", "triangular", "cosine" };
    greeting_->setText("Starting R call");
    R_["tfile"]  = tempfile_;
    R_["bw"]     = bw_;
    R_["kernel"] = kernelstr[kernel_]; 			// passes the string to R
    R_["y"]      = Yvec_;
    std::string cmd0 = "png(filename=tfile,width=600,height=400); plot(density(y, bw=bw/100, kernel=kernel), xlim=range(y)+c(-2,2), main=\"Kernel: ";
    std::string cmd1 = "\"); points(y, rep(0, length(y)), pch=16, col=rgb(0,0,0,1/4));  dev.off()";
    std::string cmd = cmd0 + kernelstr[kernel_] + cmd1; // stick the selected kernel in the middle
    R_.parseEvalQ(cmd);				     	// evaluate command -- generates new density plot
    imgfile_->setChanged();				// important: tells consumer that image has changed, forces refresh
    greeting_->setText("Finished request from " + this->environment().clientAddress() + " using " + this->environment().userAgent()) ;
}

WApplication *createApplication(const WEnvironment& env) {
    // You could read information from the environment to decide whether
    // the user has permission to start a new application
    //
    // We grab an instance of the embedded R. Note we can start only one,
    // so resource conflicts have to be managed (eg add mutexes etc)
    //
    return new DensityApp(env, RInside::instance());
}

int main(int argc, char **argv) {

    RInside R(argc, argv);              // create the one embedded R instance 

    // Your main method may set up some shared resources, but should then
    // start the server application (FastCGI or httpd) that starts listening
    // for requests, and handles all of the application life cycles.
    //
    // The last argument to WRun specifies the function that will instantiate
    // new application objects. That function is executed when a new user surfs
    // to the Wt application, and after the library has negotiated browser
    // support. The function should return a newly instantiated application
    // object.
    return WRun(argc, argv, createApplication);
}
