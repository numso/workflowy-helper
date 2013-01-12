SUPERVISOR := ./node_modules/.bin/supervisor

all:
	@make -j browserify server

run: all

install:
	@npm install

server:
	@$(SUPERVISOR) -q -w controllers,middlewares,app.js app

browserify:
	@$(SUPERVISOR) -q -w views/public,client/requires bin/browserify

.PHONY: server browserify install run all
