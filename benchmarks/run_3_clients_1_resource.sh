#!/bin/bash

docker run -p 51900:5000 -d taesiri/singhal-coordinator
docker run -d taesiri/singhal-slave http://192.168.99.100:51900 1 3 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51900 2 3 1
docker run -d taesiri/singhal-slave http://192.168.99.100:51900 3 3 1
