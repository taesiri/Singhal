#!/bin/bash

docker run -p 51910:5000 -d taesiri/singhal-coordinator
docker run -d taesiri/singhal-slave http://192.168.99.100:51910 1 10 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51910 2 10 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51910 3 10 1
