#!/bin/bash

docker run -p 51907:5000 -d taesiri/singhal-coordinator
docker run -d taesiri/singhal-slave http://192.168.99.100:51907 1 7 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51907 2 7 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51907 3 7 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51907 4 7 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51907 5 7 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51907 6 7 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51907 7 7 1
