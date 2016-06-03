var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);
var Promise = require('promise');

var sites = [];
var clients = [];
var lastState = [];

var tmp_table = [];
var tmp_gsm = [];
var tmp_rsm = [];
var tmp_browserClient;

var globalLog = "";

app.use(express.static('public'));

app.get('/', function(req, res){
      res.sendFile(__dirname  +'/index.html');
});


OnPartialStateMatrixReceievd = function(data) {

    var found=-1;
    
    for(var i=0; i<tmp_rsm.length ; i++){
        if(tmp_rsm[i] == data['id']){
            found=i;
        }
    }
    
    if(found==-1){
        console.log("Something went wrong!");        
        return;
    }

    tmp_rsm.splice(found,1);
    
    var item = [];
    item.push(data['id']);
    
    var row = data['matrix'];
    
    //console.log("row ", row);
    
    for(var i =1 ;i<row.length; i++){
        item.push(row[i]);
    }
    
    tmp_table.push(item);
    
    tmp_gsm.push(data);
    
    //tmp_browserClient.emit('GlobalStateMatrixPartial', tmp_table);
    
    if(tmp_rsm.length == 0 ) {
        tmp_browserClient.emit('GlobalStateMatrixComplete', tmp_table);
        tmp_gsm = [];
    }
    
    //console.log("item " ,item);
    
}


OnConnection = function(socket){
    doLog('Client Connected!');
    clients.push(socket);
    
    socket.on('StateMatrix', OnPartialStateMatrixReceievd);
    
    socket.on('BrowserClient',function(msg){
        onBrowser(msg, socket)
    });
    
    socket.on('ScheduleJob',function(msg){
        onScheduleJob(msg, socket)
    })
    
    socket.on('RequestToken', onRequestToken);
    
    socket.on('ForwardToken', onForwardToken);
    
    socket.on('disconnect', function() {
        clients.splice(clients.indexOf(socket), 1);
    });

    socket.on('RegisterSite', function(siteName){
        for(var i=0; i<sites.length ; i++){
            if(sites[i].id == siteName){
                doLog("Client id already exist, updating the Socket!");
                sites[i].socket = socket;
                return;
            }
        }
        
        var item = {};
        item.id = siteName;
        item.socket = socket;
        
        sites.push (item);
    });
}

onBrowser = function(data, browserClient){
    
    switch(data){
        case "GetTotalNumberOfClients":
            browserClient.emit("UpdateNumberOfClients", sites.length);
            break;
        case "CreateGlobalStateMatrix":
            CreateGlobalStateMatrix();
            tmp_browserClient = browserClient;
            break;
        case "GetGlobalLog":
            browserClient.emit("GlobalLog", globalLog);
            break;
        default:
            break;       
    }
}


onScheduleJob = function(data, browserClient){
    doLog('onScheduleJob ' + data);
    for(var i=0, n=sites.length; i<n;i++){
        if(sites[i].id == data.client){
            
            doLog('jobSceduled!');
            sites[i].socket.emit('ScheduleJob', data);
            
            return;
        }
    }
}


onRequestToken = function(requestMessage) {
    doLog('Token Requesteted from: ' + requestMessage.source + "  , target :" + requestMessage.target);
    for(var i=0, n=sites.length; i<n;i++){
        if(sites[i].id == requestMessage.target){
            
            doLog('Forwarding Request Token message to : ', requestMessage.target);
            sites[i].socket.emit('TokenReuqested', requestMessage);
            
            return;
        }
    }
}

onForwardToken = function(tokenData) {
    doLog('TokenReceived from' + tokenData.source + "  , target :" + tokenData.target);
    for(var i=0, n=sites.length; i<n;i++){
        if(sites[i].id == tokenData.target){
            
            doLog('Forwarding Token to :', tokenData.target);
            sites[i].socket.emit('TokenReceievd', tokenData);
            
            return;
        }
    }
}

function CreateGlobalStateMatrix(){
    tmp_rsm = [];
    tmp_table = [];
    tmp_gsm = [];
    
    for(var i=0; i<sites.length; i++) {
        sites[i].socket.emit("GetStateMatrix","-1");
        tmp_rsm.push(i+1);
    }
}


function doLog(message) {
    console.log(message);
    globalLog += message + '\n';
}

io.on('connection', OnConnection);

http.listen(5000, function(){
  doLog('listening on *:5000');
});
