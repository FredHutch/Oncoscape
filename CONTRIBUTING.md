# How to Contribute

We love Pull Requests! Your contributions help drive development.

## Getting Started

Thanks for your interest in supporting our mission - to develop software that addresses needs in cancer biology and precision medicine.
Both software development and cancer research require multi-disciplinary expertise and collaboration, and we welcome any and all help whether
it be submitting issues, writing docs, making code changes, or even linking/developing entire features. 
If you haven't already, start by signing up for a [GitHub account](https://github.com/signup/free).


## Getting Started

First review this simple flowchart to see the best place for you to start working and contributing to Oncoscape! 

![oncoscape_user_flowchart_final](https://cloud.githubusercontent.com/assets/15098135/12570250/d3c0ab8a-c38a-11e5-85f5-61ff83c27cfe.png)


You can clone this repository locally from GitHub using the "Clone in Desktop" 
button from the main project site, or run this command in the Git Shell:

`git clone git@github.com:FredHutch/oncoscape.git Oncoscape`

If you want to make contributions to the project, 
[forking the project](https://help.github.com/articles/fork-a-repo) is the 
easiest way to do this. You can then clone down your fork instead:

`git clone git@github.com:MY-USERNAME-HERE/Oncoscape.git Oncoscape`

After doing that, follow the [Installation instructions](INSTALL.md) to install, test, and run the software package.

Check out our [cheatsheet](cheatsheet.md) for tips and tricks for some common git commands.

### How is the codebase organized?

Oncoscape uses websockets to pass JSON messages between web browsers and computational servers using the [chinook protocol](https://github.com/oncoscape/chinook).

The `Oncoscape` library is a R package that connects 3 major components: 

 - **Data** - molecular profiles, sequencing results, clinical histories, regulatory networks, etc
 - **Analysis** - computational methods and tools
 - **Display** - where to present the data - e.g. a website using JS, JQuery, HTML, CSS, etc
 
Currently, we use R packages to store data and perform computational analysis.  

Each dataset is an instance of the `SttrDataPackage` class, with molecular data organized into simple data.frames and matrices and 
the clinical histories represented by the `PatientHistory` class. The unit tests for each dataset are a great way to get familiar 
with the accessor functions - eg [dataPackages/TCGAgbm/inst/scripts/test_TCGAgbm.R](dataPackages/TCGAgbm/inst/unitTests/test_TCGAgbm.R)

For computationally intensive  or complex analyses, there are separate R packages for performing these functions.  These are stored 
in [analysisPackages](analysisPackages/) and include methods such as PCA (principle component analysis) and 
PLSR (partial least squares regression).  Have a bioconductor or other tool you'd like to include?  Add it here!

Creating interactive and coupled displays of data and analysis is a major focus of Oncoscape.  Each feature (shown as tabs)
can be individually developed and loosely coupled for users to pass information among tools using the point-and-click interface.
In the current incarnation, each tab/feature contains a widget.html and Module.js file that includes all the necessary HTML and Javascript
code to interpret and display information.  Features can be developed and deployed individually using the makefile within that folder 
-eg [Oncoscape/inst/scripts/pca/makefile](Oncoscape/inst/scripts/pca/makefile) or added to a collection of tabs through the `apps` directory [Oncoscape/inst/scripts/apps/](Oncoscape/inst/scripts/apps/oncoscape/widget.html).


### What needs to be done?

We have a [`help-wanted`](https://github.com/FredHutch/oncoscape/issues?labels=help-wanted&state=open)
tag on our issue tracker to indicate tasks which contributors can pick up.

If you've found something you'd like to contribute to, leave a comment in the issue
so everyone is aware.


## Making Changes

When you're ready to make a change, 
[create a branch](https://help.github.com/articles/fork-a-repo#create-branches) 
off the `develop` branch. We use `develop` as the working branch for the 
repository with the most recent contributions and the `master` branch as our production version.  We found these two
links very helpful [develop/master branching model](http://nvie.com/posts/a-successful-git-branching-model/)
and [github workflow](https://www.atlassian.com/git/tutorials/comparing-workflows)

If you make focused commits (instead of one monolithic commit) and have descriptive
commit messages, this will help speed up the review process.

Oncoscape relies on testing to ensure existing behaviour is unchanged.  This can be easily checked
through the `>make test` command in the root directory.  If you're adding new features, please add some 
tests to your code and include it in the testing heirarchy so your code is safe and secure.


### Submitting Changes

You can publish your branch from GitHub for Windows, or run this command from
the Git Shell:

`git push origin MY-BRANCH-NAME`

Once your changes are ready to be reviewed, publish the branch to GitHub and
[open a pull request](https://help.github.com/articles/using-pull-requests) 
against it.

Some tips with pull requests to help the process:

 - Contribute your work-in-progress by adding the `[WIP]` prefix to the title.  This way we can give feedback early and facilitate the inclusion of your updates.
 - use [checklists](https://github.com/blog/1375-task-lists-in-gfm-issues-pulls-comments) 
   to indicate the tasks which need to be done, so everyone knows how close you are to done.
 - add comments to the PR about things that are unclear or you would like suggestions on

Don't forget to mention in the pull request description which issue/issues are 
being addressed.

Some things that will increase the chance that your pull request is accepted.

* Follow existing code conventions. 
* Include unit tests that would otherwise fail without your code, but pass with it.
* Update the documentation, the surrounding one, examples elsewhere, guides, 
  whatever is affected by your contribution

# Additional Resources

* [General GitHub documentation](http://help.github.com/)
