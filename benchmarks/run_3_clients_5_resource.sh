#!/bin/bash

docker run -p 51901:5000 -d taesiri/singhal-coordinator
docker run -d taesiri/singhal-slave http://192.168.99.100:51901 1 3 5
docker run -d taesiri/singhal-slave http://192.168.99.100:51901 2 3 5
docker run -d taesiri/singhal-slave http://192.168.99.100:51901 3 3 5
