help:
	@echo "make"
	@echo "   run:       run the code"
	@echo "   install:   install dependencies"
	@echo "   help:      shows these instructions"

run:
	@supervisor -q -w controllers,middlewares,app.js app

install:
	@npm install -g supervisor
	@npm install