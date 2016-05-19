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

app.use(express.static('public'));

app.get('/', function(req, res){
      res.sendFile(__dirname  +'/index.html');
});

OnRequest = function (data) {
    
}

OnPartialStateMatrixReceievd = function(data) {

    var found=-1;
    
    for(var i=0; i<tmp_rsm.length ; i++){
        if(tmp_rsm[i] == data['id']){
            found=i;
        }
    }
    
    if(found==-1){
        console.log("Not Found!");        
        return;
    }

    tmp_rsm.splice(found,1);
    
    var item = [];
    item.push(data['id']);
    
    var row = data['matrix'];
    
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
    
}


OnConnection = function(socket){
    console.log('Client Connected!');
    clients.push(socket);
    
    socket.on('Request', OnRequest);
    
    socket.on('StateMatrix', OnPartialStateMatrixReceievd);
    
    socket.on('BrowserClient',function(msg){
        console.log(msg);
        onBrowser(msg, socket)
    });
    
      socket.on('ScheduleJob',function(msg){
        console.log(msg);
        onScheduleJob(msg, socket)
    })
    
    socket.on('disconnect', function() {
        clients.splice(clients.indexOf(socket), 1);
    });

    socket.on('RegisterSite', function(siteName){
        for(var i=0; i<sites.length ; i++){
            if(sites[i].id == siteName){
                console.log("Client id already exist, updating the Socket!");
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
            
        default:
            break;       
    }
}


onScheduleJob = function(data, browserClient){
    console.log('onScheduleJob1' + data);
    console.log('onScheduleJob2' + data);
    console.log('onScheduleJob3' + data);
    for(var i=0, n=sites.length; i<n;i++){
        if(sites[i].id == data.client){
            
            console.log('jobSceduled!');
            sites[i].socket.emit('ScheduleJob', data);
            
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

io.on('connection', OnConnection);

http.listen(5000, function(){
  console.log('listening on *:5000');
});

//function sendMessageTofirstClient(){
//    console.log('sendeting to first user\n');
//    clients[0].emit('fromServer', 'a message sent from server!');
//}
//
//function sendMessageTosecondClient(){
//    console.log('sendeting to second user\n');
//    clients[1].emit('fromServer' , 'a message sent from server!');
//}
//
//function gatherStateMatrix(){
//    lastState = [];
//    for(var i=0; i<clients.length; i++){
//        clients[i].emit('GetStateMatrix','');
//    }
//}

//
//var stdin = process.openStdin();
//
//stdin.addListener("data", function(d) {
//    
//    switch(d.toString().trim()){
//        case 'users':
//            printUsers();
//            break;
//        case 'rooms':
//            printRooms();
//            break;
//        case 'sendtofirst':
//            sendMessageTofirstClient();
//            break;
//        case 'sendtosecond':
//            sendMessageTosecondClient();
//            break;
//        case 'statematrix':
//            gatherStateMatrix();
//            break;
//    }
//    
//});
