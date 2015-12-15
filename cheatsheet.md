## Branching Structure
- **Master**: production branch
- **Develop**: Testing/Staging
- **Feature**: child of develop for updates
- **Hotfix**: child of master for bug fixes

For a full explanation, see the 
[Workflow](http://nvie.com/posts/a-successful-git-branching-model/) or 
[Branching Model](www.atlassian.com/git/tutorials/comparing-workflows) external websites our approach is based on.

This explanation of [merging branches](http://linux.die.net/man/1/git-merge) is also quite helpful.


## 1. Clone
Create a local copy of Oncoscape on your machine
```
>git clone https://github.com/FredHutch/Oncoscape.git
>cd Oncoscape
>git checkout develop  #new features merge to develop
>git status
```

## 2. Create new Feature Branch
Start developing a new feature or edit to contribute
```
>git checkout –b newBranchName develop
>git status
… your changes
>git add [files]
>git commit –m “informative message”   #updates to your local machine
```
##  3. Update Branches
Keep your develop branch current
```
>git pull origin develop #updates local branch using server changes 
```
## 4a. Contribute Feature
Team members contribute updates
```
>git checkout branchName
>git push origin branchName
```
## 4b. Contribute Feature (External)
External collaborators contribute updates
```
>git remote add RepoName https://github.com/FredHutch/Oncoscape.git
>git push RepoName branchName
```
OR
```
>git push –u RepoName branchName  #-u is short for —set-upstream
```
## Create Pull Request
  - Browser: https://github.com/FredHutch/Oncoscape.git
  - Choose branchName
  - Compare & pull request
  - base:develop
  - create pull request

## Accept Pull Request
We love your support.  This is how we show you.
```
>git fetch origin 
>git checkout –b branchName origin/branchName
>git diff --name-status develop..branchName  #check to see which files have changed
>git merge develop
>git checkout develop
>git merge –no-ff branchName #no fast forward groups all individual commits together
>git push origin develop
>git branch -d branchName #deletes branch
>git remote prune origin #removes stale branches
```
## Hotfix Release
When things don't go as planned, the master must be modified.
```
>git checkout master 
>git pull
>git checkout –b hotfix_v[##] master
>git tag –a 0.1 –m “message” master
>git push --tags
```
## Undo/Recommit to Branch
When things really start get confusing...
```
>git reset --soft HEAD^ #each ^ steps back 1 commit
>git reset [commit] #undo, preserves local changes
>git reset --hard [commit] #discard all history
>git checkout branch
>git commit  
```
## View local/remote branch tracking
To see what's in the works
```
>git branch –vv
>git branch –avv #for all branches (including remote)
>git remote show origin
```
## File/Repo Tracking
To update files and repos
```
>git rm [file] #stages deletion of file
>git rm –cached [file] #deletes from repo but keeps local
>git mv [orig-file] [rename-file] #update name and preps for commit
```
```
>git stash #temp storage of modified tracked files
>git stash pop #restores stashed files
>git stash list #list stashed changesets
>git stash drop #discard recent stash
```
## Review History
To see behind the scenes
```
>git log –follow [file] #file version history
>git diff [first branch] … [second branch]  #content difference between branches
>git show [commit] #content changes of commit
```
## Issue Tracking
Tell us what you'd like to see changed!  If you prefer command line issues, check out 
[ghi]( https://github.com/stephencelis/ghi) and the 
[API](manpages.ubuntu.com/manpages/natty/man1/ghi.1.html)
```
>brew install ghi
>ghi config --auth UserName
>ghi open –m “issue title”
```
