Boilerplate
===========

Use this code when starting out node projects

###To start a project:
    git clone git@github.com:numso/boilerplate.git mynewproject
    cd mynewproject
    git remote rename origin bp
    git remote add origin <git-url>
    git push -u origin master

###To install the app:

    make install

###To run the app:

    make run

Go to http://localhost:3000.

###To update to the latest boilerplate

    git pull bp master
    # merge any conflicts