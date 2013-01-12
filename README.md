Boilerplate
===========

Use this code when starting out node projects

## Setting Everything up

###To start a project:
    git clone git@github.com:numso/boilerplate.git mynewproject
    cd mynewproject
    git remote rename origin bp
    git remote add origin <git-url>
    git push -u origin master

###To install the app:

    make install

###To run the app:

    make

Go to http://localhost:3000.

###To update to the latest boilerplate

    git pull bp master
    # merge any conflicts

## Where files go

###Any requires you want loaded on page load
put them inside client/  
require them inside client/main.js

###Any requires you want to be able to require after load
put them inside client/requires/

###Any Javascript libraries
put them inside public/js/lib/

###Any Jade files you want to access from the client
put them inside views/public/

###Any Styles
put them inside public/css/
import them inside public/css/main.styl

###All the controllers
put them inside controllers/

###All the Jade files
put them inside views/

###All the middleware
put them inside middleware/

###All the models
put them inside models/
