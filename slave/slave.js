var prompt = require('prompt');
var io = require('socket.io-client');
var socketURL = 'http://0.0.0.0:5000';

var options = {
  transports: ['websocket'],
  'force new connection': true,
  reconnect: true
};

var States = {
    H: 0,
    R: 1,
    E: 2,
    N: 3
};

var tokensInSite = [];
var tokens = [];

var Sv=[[],[]];
var Sn=[[],[]];

var slaveId;
var slave;
var totalSites;

var jobQ = [];

var IsIdle = true;

var numberOfResources=1;

OnConnect = function (data) {
    RegsiterOnCoordinator();
}

OnStateMatrixRequested = function(data) {
    slave.emit('StateMatrix', {'id' : slaveId, "matrix": Sv, "resources" : numberOfResources});
}

OnJobSchedule = function(data) {
    AddToJobQueue(data);
    console.log(data);
}

function AddToJobQueue(job) {
    jobQ.push(job);
    // At the moment dont Schedule more than one job at a time!
    if(IsIdle == true) {
       RunJob();
    }
}

function RemoveFinishedJob(){
    // Decide to Forward Token or run another job!
    console.log("RemoveFinishedJob");
    
    updatTokens();
    forwardTokens();
    jobQ.splice(0,1);
    IsIdle = true;
    if ( jobQ.length>0 ){
        setTimeout(function(){
            RunJob();
        }, 500);
    }
}


function RunJob() {
    if(jobQ.length <= 0){
        return  false;
    }

    IsIdle = false;
    
    var currentJob = jobQ[0];
    var resources = currentJob.resources;

    console.log("Current job requires this resources: " + resources);
    console.log("Tokens in this site: ", tokensInSite);
    
    if(canEnterCS()){
         CriticalSection(currentJob);
    } else {
      
        resources.forEach(function(r){
            RequestToken(r);
        });
        
        IsIdle=true;
    }
}


function canEnterCS(job){
    
    if(jobQ.length<=0){
        return false;
    }
    
    // check if we have all needed tokens!
    var currentJob = jobQ[0];
    var resources = currentJob.resources;

    var canRun = true;
    // wrong usage of forEach!!!
    resources.forEach(function(r){
        if(tokensInSite.indexOf(r)==-1){
            canRun = false;    
        }
    });
    
    return canRun;    
}

function CriticalSection(currentJob) {
    
    var jobtime = currentJob.time;
    var resources = currentJob.resources;

    resources.forEach(function(r){
       Sv[r][slaveId] = States.E; 
    });
    
    console.log("Executing CS: " + jobtime);
    
    setTimeout(function(){
        resources.forEach(function(r){
            Sv[r][slaveId] = States.N;
            tokens[r].TSv[slaveId] = States.N;
        });
        
        RemoveFinishedJob(); 
    }, jobtime*1000); 
}

function forwardTokens() {
    // TODO : Check who needs token, then frwd token to it!
    console.log("ForwardTokens()");
    console.log("tokens in this site ", tokensInSite);
    
    var fwrdList = [];
    
    tokensInSite.forEach(function(r){
        
        console.log("running for r ", r);
        
        var requestings = Sv[r].filter(function(elem, index, array) {
            return elem == States.R && index!=slaveId;
        });

        if(requestings.length == 0) {
            Sv[r][slaveId] = States.H;
            console.log("Token: " + r + "  will remains here!");
            return false;
        }

        var SnSvPair = [];
        for(var i=0; i< Sv[r].length ; i++){
            if(i!=slaveId){
                var item = {};
                item.Sv = Sv[r][i];
                item.Sn = Sn[r][i];
                item.id = i;
                SnSvPair.push(item);
            }
        }

        SnSvPair.sort(function(itemA,itemB) {
            if(itemA.Sn < itemB.Sn){
                return -1;
            } else if (itemA.Sn > itemB.Sn) {
                return 1;
            } else {
                return 0;
            }
        });

        for(var i=0; i < SnSvPair.length ; i++){
           if(SnSvPair[i].Sv == States.R){
               console.log("Forward Token " + r +  " to " + SnSvPair[i].id);
               
               Sv[r][SnSvPair[i].id] = States.R;
               fwrdList.push({id:SnSvPair[i].id, rId: r});

               break;
           }
        }
        
    });
    
    
    for(var i=0; i < fwrdList.length; i++) {
           //SendToken(SnSvPair[i].id , r);
        SendToken(fwrdList[i].id, fwrdList[i].rId);
    }
    
    
    return true;
}


function RequestToken(r) {
    
    console.log("Requesting Token " + r + " Sv: " + Sv[r]);
    // Requesting Token
    Sv[r][slaveId] = States.R;
    Sn[r][slaveId] += 1;
    
    for(var i=1;i<Sv[r].length; i++){
        if(Sv[r][i] == States.R && i != slaveId){
            SendRequest(i , r);
            console.log("Requesting Token from: " + i);
        }
    }
}

function SendRequest(target, rId) {
    var message={};
    message.source = slaveId;
    message.target = target;
    message.sn = Sn[rId][slaveId];
    message.rId = rId;
    slave.emit("RequestToken", message);
}

function SendToken(target, rId){
    console.log("Sending Token to " + target);
    var message={};
    message.source = slaveId;
    message.target = target;
    message.TSn = tokens[rId].TSn;
    message.TSv = tokens[rId].TSv;
    message.rId = rId;
    console.log("tokens in this site ", tokensInSite);
    tokensInSite.splice(tokensInSite.indexOf(rId),1);
    console.log("tokens in this site ", tokensInSite);
    
    Sv[rId][slaveId] = States.N;
    Sv[rId][target] = States.R;
    
    slave.emit("ForwardToken", message);
}

OnTokenReuqested = function(requestMessage) {
    console.log("tokens in this site ", tokensInSite);
    var sender = requestMessage.source;
    var resourceId = requestMessage.rId;
    
    console.log("Token Request Message from " + sender + " , Wants token " + resourceId);
    
    if ( Sn[resourceId][sender] > requestMessage.sn ){
        //Do Nothing
        return;
    } else {
        
        Sv[resourceId][sender] = States.R;
        Sn[resourceId][sender] = requestMessage.sn;
        
        if(Sv[resourceId][slaveId]== States.H && IsIdle){
            // ? Immediate forward!
            SendToken(sender,resourceId);
            Sv[resourceId][slaveId]== States.N;
        }
    }
}

OnTokenReceievd = function(rToken) {
    console.log('OnTokenReceievd');
    var rID = rToken.rId;
    
    tokensInSite.push(rID);
    
    tokens[rID].TSn = rToken.TSn;
    tokens[rID].TSv = rToken.TSv;
    
    Sv[rID][slaveId] == States.H;
    
    if(canEnterCS()&&jobQ.length>0){
        RunJob();
    }
    
    console.log("Tokens in Site: " + tokensInSite);
}


function updatTokens() {
    
    tokensInSite.forEach(function(r){
         for(var i=1;i<=totalSites;i++){
             
             if(Sn[r][i] > tokens[r].TSn[i]){
                 tokens[r].TSv[i] = Sv[r][i];
                 tokens[r].TSn[i] = Sn[r][i];
             } else {
                 Sv[r][i] = tokens[r].TSv[i];
                 Sn[r][i] = tokens[r].TSn[i];
             }
         }
    });
    
}



function initializeTokens() {
    
    // this code only runs on Site 1 (salve #1)
    
    //  dummy!
    tokens.push({
            TSv: [],
            TSn: []
        });
    
    for(var r = 1; r<=numberOfResources; r++){
        
        tokens.push({
            TSv: [],
            TSn: [],
            rId: r
        });
        
        for(var i = 1; i<=totalSites; i++) {
            tokens[r].TSn[i] = 0;
            tokens[r].TSv[i] = States.N;
        }
        
        if(slaveId==1){
            tokensInSite.push(r);
            Sv[r][1] = States.H;
        } else {
              Sv[r][1] = States.R;
        }  
    }
}


function initializeSlave(id, n, r) {
    
    slaveId = id;
    slave = io.connect(socketURL, options);
    numberOfResources = r;
    
    slave.on('connect', OnConnect);
    slave.on('GetStateMatrix', OnStateMatrixRequested);
    slave.on('ScheduleJob', OnJobSchedule);
    slave.on('TokenReuqested', OnTokenReuqested);
    slave.on('TokenReceievd', OnTokenReceievd);
    
    for(var r = 1; r<=numberOfResources; r++){
         Sn[r] = [];
         Sv[r] = [];
         for(var i = 1; i<=n; i++) {
             
            Sn[r][i]=0;

            if(i<id){
                Sv[r][i]= States.R;
            } else {
                Sv[r][i] = States.N;
            }
        }
    }
    
    totalSites=n;
    
    
    initializeTokens();
   
    console.log(tokens);
}


function RegsiterOnCoordinator() {
    slave.emit('RegisterSite', slaveId);
}


prompt.start();

prompt.get(['id', 'n', 'r'], function (err, result) {
    if (err) { return onErr(err); }    
    initializeSlave(result.id, result.n, result.r);  
});

function onErr(err) {
    console.log(err);
    return 1;
}
