#!/bin/bash

docker run -p 51905:5000 -d taesiri/singhal-coordinator
docker run -d taesiri/singhal-slave http://192.168.99.100:51905 1 5 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51905 2 5 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51905 3 5 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51905 4 5 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51905 5 5 1
