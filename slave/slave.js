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

var token = {
    TSv: [],
    TSn: []
};

var Sv=[];
var Sn=[];
var slaveId;
var slave;
var totalSites;
var slaveHasToken = false;

var jobQ = [];

var IsIdle = true;
var WaitForToken = false;

OnConnect = function (data) {
    RegsiterOnCoordinator();
}

OnRequest = function(data){
    var senderId = data['sender'];
    var sequenceNumber = data['sn'];
    
    if(sequenceNumber<Sn[senderId])
        return;
    
    switch(Sv[slaveId]){
        case States.N:
            Sv[senderId] = States.R;
            break;
        case States.R:
            if(Sv[senderId] != States.R){
                // TODO : Send a Fwd Request to  (J,SNj[j]);
            } else {
                // DO Nothing!
            }
            break;
        case States.E:
            Sv[senderId] = States.R;
            break;
        case States.H:
            Sv[senderId] = States.R;
            
            token.TSn[senderId] = sequenceNumber;
            
            // TODO : Send token to sender of request!
            break;
    }
}


OnStateMatrixRequested  = function(data) {
    slave.emit('StateMatrix', {'id' : slaveId, "matrix": Sv});
}

OnJobSchedule = function(data) {
    AddToJobQueue(data);
    console.log(data);
}


function AddToJobQueue(job){
    jobQ.push(job);
    // At the moment dont Schedule more than one job at a time!
    if(IsIdle == true) {
       RunJob();
    }
}

function RemoveFinishedJob(){
    // Decide to Forward Token or run another job!
    console.log("RemoveFinishedJob");
    updatToken();
    var isTokenForwarded = forwardToken();
    jobQ.splice(0,1);
    IsIdle = true;
    
    if (!isTokenForwarded &&  jobQ.length>0 ){
        console.log('Since no body wants the token, i will re-enter to the CS');
        RunJob();
    } else if (isTokenForwarded &&  jobQ.length>0 ){
        setTimeout(function(){
            RunJob();
        }, 500);
    }
}


function RunJob() {
    if(jobQ.length<=0){
        return;
    }
    
    IsIdle = false;
    
    var currentJob = jobQ[0];
    var jobTime = currentJob.time;
    
    if(Sv[slaveId] == States.H){
        // Have Token Ready to Go!
        CriticalSection(jobTime);
       
    } else {
        WaitForToken = true;
        RequestToken();
    }
    
}

function CriticalSection(jobtime) {
    Sv[slaveId] = States.E;
    console.log("Executing CS");
    console.log(jobtime);
    setTimeout(function(){
        Sv[slaveId] = States.N;
        token.TSv[slaveId] = States.N;
         
        RemoveFinishedJob(); 
       
    }, jobtime*1000);
}

function forwardToken() {
    // TODO : Check who needs token, then frwd token to it!
    console.log("Forwarding Token");
    
    var requestings = Sv.filter(function(elem, index, array) {
                        return elem == States.R && index!=slaveId;
    });
    
    if(requestings.length == 0) {
        Sv[slaveId] = States.H;
        console.log("Token will remains here!");
        return false;
    }
    
    var SnSvPair = [];
    for(var i=0; i< Sv.length ; i++){
        if(i!=slaveId){
            var item = {};
            item.Sv = Sv[i];
            item.Sn = Sn[i];
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
    
    for(var i=0; i< SnSvPair.length ; i++){
       if(SnSvPair[i].Sv == States.R){
           
           console.log("Forward Token to " + SnSvPair[i].id);
           
           Sv[SnSvPair[i].id] = States.R;
           
           SendToken(SnSvPair[i].id);
           
           break;
       }
    }
    
    return true;
    
}


function RequestToken() {
    console.log("Requesting Token " + Sv);
    // Requesting Token
    Sv[slaveId] = States.R;
    Sn[slaveId] += 1;
    
    for(var i=1;i<Sv.length; i++){
        if(Sv[i] == States.R && i != slaveId){
            SendRequest(i);
            console.log("Requesting Token from: " + i);
        }
    }
}

function SendRequest(target) {
    var message={};
    message.source = slaveId;
    message.target = target;
    message.sn = Sn[slaveId];
    
    slave.emit("RequestToken", message);
}

function SendToken(target){
    var message={};
    message.source = slaveId;
    message.target = target;
    message.TSn = token.TSn;
    message.TSv = token.TSv;
    
    slave.emit("ForwardToken", message);
}

OnTokenReuqested = function(requestMessage) {
    var sender = requestMessage.source;
    
    if ( Sn[sender] > requestMessage.sn ){
        //Do Nothing
        return;
    } else {
        
        Sv[sender] = States.R;
        Sn[sender] = requestMessage.sn;
        
        if(Sv[slaveId]== States.H && IsIdle){
            // ? Immediate forward!
            SendToken(sender);
            Sv[slaveId]== States.N;
        }
    }
}

OnTokenReceievd = function(rToken) {
    // TODO : Check TokenID;
    // We assume this is the correct token! (maybe WRONG!)

    token.TSn = rToken.TSn;
    token.TSv = rToken.TSv;
    
    if(WaitForToken) {
        WaitForToken = false;
        Sv[slaveId] = States.H
        RunJob();
    } else if(Sv[slaveId] == States.R){
        Sv[slaveId] = States.H
        RunJob();
    } else if (IsIdle) {
        // Does this matters?
//        Sv[slaveId] = States.H
//        RunJob();
    }
}


function updatToken(id) {
    
    for(var i=1;i<=totalSites;i++){
        if(Sv[i]==States.R && token.TSv[i]==States.N){
            if(Sn[i]==token.TSn[i]) {
                Sv[i]=States.N;
            } else if (Sn[i] > token.TSn[i]) {
                token.TSv[i] = States.R;
                token.TSn[i] = Sn[i];
            } else if (Sn[i] < token.TSn[i]) {
                Sv[i] = States.N;
                Sn[i] = token.TSn[i];
            }
        } else if(Sv[i]==States.N && token.TSv[i] == States.R){
            if(Sn[i]==token.TSn[i]) {
                // Cannot Occure!
            } else if (Sn[i] > token.TSn[i]) {
                // Cannot Occure!
            } else if (Sn[i] < token.TSn[i]) {
                Sv[i] = States.T;
                Sn[i] = token.TSn[i];
            }
        } else if(Sv[i]==States.N && token.TSv[i] == States.N){
            if(Sn[i]==token.TSn[i]) {
                // Do nothing!
            } else if (Sn[i] > token.TSn[i]) {
                // Cannot Occure!
            } else if (Sn[i] < token.TSn[i]) {
                Sn[i] = token.TSn[i];
            }
        } else if(Sv[i]==States.R && token.TSv[i] == States.R){
             if(Sn[i]==token.TSn[i]) {
                // Do nothing!
            } else if (Sn[i] > token.TSn[i]) {
                // Cannot Occure!
            } else if (Sn[i] < token.TSn[i]) {
                Sn[i] = token.TSn[i];
            }   
        }
    }
}



function initializeToken() {
    
    // this code only runs on Site 1 (salve #1)
    
    slaveHasToken = true;
    
    for(var i = 1; i<=totalSites; i++) {
        token.TSn[i] = 0;
        token.TSv[i] = States.N;
    }
    
    Sv[1] = States.H;
}


function initializeSlave(id, n) {
    
    slaveId = id;
    slave = io.connect(socketURL, options);

    slave.on('connect', OnConnect);
    slave.on('GetStateMatrix', OnStateMatrixRequested);
    slave.on('ScheduleJob', OnJobSchedule);
    slave.on('TokenReuqested', OnTokenReuqested);
    slave.on('TokenReceievd', OnTokenReceievd);
    
    for(var i = 1; i<=n; i++) {
        Sn[i]=0;
        
        if(i<id){
            Sv[i]= States.R;
        } else {
            Sv[i] = States.N;
        }
    }
    
    totalSites=n;
    
    if(id==1){
        initializeToken();
    }
}


function RegsiterOnCoordinator() {
    slave.emit('RegisterSite', slaveId);
}


prompt.start();

prompt.get(['id', 'n'], function (err, result) {
    if (err) { return onErr(err); }    
    initializeSlave(result.id, result.n);  
});

function onErr(err) {
    console.log(err);
    return 1;
}
