
Array.prototype.getUnique = function(){
   var u = {}, a = [];
   for(var i = 0, l = this.length; i < l; ++i){
      if(u.hasOwnProperty(this[i])) {
         continue;
      }
      a.push(this[i]);
      u[this[i]] = 1;
   }
   return a;
}


for (var i = 1; i<101; i++) {
  var nodeId = Math.round(getRandom(1,3));
  var jobTime = Math.round(getRandom(1,100)) * 10;

 // var resources = Math.round(getRandom(1,5));

  var resources = [] ;
  resources.push(Math.round(getRandom(0,4)));
  resources.push(Math.round(getRandom(0,4)));
  resources.push(Math.round(getRandom(0,4)));


  console.log(i + ":" + nodeId + ":" + jobTime + ":" + resources.getUnique().join("#") );
}

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

