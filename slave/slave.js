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

OnExecuteJobRequested = function(data) {
    
}

OnJobSchedule = function(data) {
    jobQ.push(data);
    console.log(data);
}

function RegsiterOnCoordinator() {
    slave.emit('RegisterSite', slaveId);
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

function forwardToken(id) {
    
    
}


function RequestToken(id) {
    
    // Requesting Token
    Sv[slaveId] = States.R;
    Sn[slaveId] += 1;
    for(var i=1;i<slaveId; i++){
        if(Sv[i] == States.R){
            SendRequest(i);
        }
    }
}


function SendRequest(target){
    var message={};
    message.target = target;
    message.body =  "Gimme the Token!";
    
    slave.emit("Request", message);
}

function RunJob() {
    if(Sv[slaveId] == States.H){
        // Have Token Ready to Go!
        
        CriticalSection();
    } else {
        RequessToken();
        
        //BLOCK! Wait for Token receieve event
    }
    
    //RequestToken!
    //if have token go to CS
    CriticalSection();
}

function OnReceiveToken(id) {
    
}

function CriticalSection(id) {
    //BEFORE CS
    Sv[slaveId] = States.E;
    
    
    //ACTUAL CS
    
    //AFTER CS
    
    Sv[slaveId] = States.N;
    token.TSv[i] = States.N;
    
    updatToken(id);
    forwardToken(id);
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

prompt.start();

prompt.get(['id', 'n'], function (err, result) {
    if (err) { return onErr(err); }    
    initializeSlave(result.id, result.n);  
});

function onErr(err) {
    console.log(err);
    return 1;
}
