var singhal = [];
var raymond = [];

for (var i = 1; i<101; i++) {
  var nodeId = Math.round(getRandom(1,3));
  var jobTime = Math.round(getRandom(1,100)) * 10;
  var resources = Math.round(getRandom(0,4));

  singhal.push(i + ":" + nodeId + ":" + jobTime + ":" + (resources+1));
  raymond.push(i + ":" + nodeId + ":" + jobTime + ":" + resources);

}

console.log("Singhal Jobs :");
singhal.forEach(function (element, index) {
  console.log(element);
});

console.log("=============");
console.log("Raymond Jobs :");
raymond.forEach(function (element, index) {
  console.log(element);
});



function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

