# Docker Compose
Welcome to the docker compose source files!

# strategy
The [local-compose.yml](./local-compose.yml) file is used to handle all the containers on the local machine. This is used to run and test the system locally.

The [dev-compose.yml](./dev-compose.yml) file is used to install updated images to the server on the servers side and allows us (the developers) to test the system on the server side.

The [prod-compose.yml](./prod-compose.yml) file is used to run the containers in production mode on the server which will then be avaliable to the public.