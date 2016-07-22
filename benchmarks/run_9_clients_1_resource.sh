#!/bin/bash

docker run -p 51909:5000 -d taesiri/singhal-coordinator
docker run -d taesiri/singhal-slave http://192.168.99.100:51909 1 9 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51909 2 9 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51909 3 9 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51909 4 9 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51909 5 9 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51909 6 9 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51909 7 9 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51909 8 9 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51909 9 9 1
