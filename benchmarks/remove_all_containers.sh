#!/bin/bash

 docker ps -a | awk '{ print $1,$2 }' | grep taesiri | awk '{print $1 }' | xargs -I {} docker kill {}
  docker ps -a | awk '{ print $1,$2 }' | grep taesiri | awk '{print $1 }' | xargs -I {} docker rm {}
