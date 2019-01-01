var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');

var mySqlHelper = require("./mySqlHelper.js");
var myUtils = require("./myUtils.js");

// Attaching SQL and get lastest data
mySqlHelper.mySqlInit(function(){
   mySqlHelper.getLastestData(dataLength, function(callback){
      Data=callback;   
      New = Data[Data.length-1];
   });

   for(var i = 0; i < numberOfThings;i++){
      mySqlHelper.getLastestState(i, function(callback){
         if(callback!=null) States.push(callback);
      });
   }
});

const dataLength = 24;
const numberOfThings = 4;

var dataCycleInSecond = 15;
var dataCycleInMinute = 60;

var States = []; 
var Data = []; 



// Starting HTTP
// Express HTTP-server that serves static files
app.use(express.static(__dirname + "/sites"));

io.on("connection", function(socket){
   console.log("A client connected");
      
   socket.on("web2ser", function(msg){
      console.log("web2ser : " + JSON.stringify(msg));
      webHandler(msg);
   });
   
   socket.on("node2ser", function(msg){   
      console.log("node2ser : " + JSON.stringify(msg));   
      nodeHandler(msg);      
   });
   
   socket.on("disconnect", function(){
      console.log("Client disconnected");
   });
});

http.listen(80, function(err){
	if (err) throw err;
    console.log("[","\x1b[32m", "HTTP" , "\x1b[0m", "] ");
});

function webHandler(jsonData){
   var type = jsonData.Type;
   if(type !=null){
      if(type.localeCompare("Greeting")==0){ 
         io.emit("ser2web", {"Type":"State", "Payload": States});
         io.emit("ser2web", {"Type":"Data", "Payload": Data});
      }   
      if(type.localeCompare("Command")==0){ 
         myUtils.emit2Node(jsonData, io);  
         jsonData.LastChange = new Date();      
         myUtils.pushThing2Array(jsonData, States);     
         var sqlData = jsonData;            
         sqlData.LastChange = myUtils.convertToSqlDateTime(jsonData.LastChange);
         mySqlHelper.insertState(sqlData);   
      }   
   }
}

function nodeHandler(jsonData){
   if(jsonData.Type.localeCompare("Greeting")==0){
      console.log("Connected node : " + jsonData.MacAddress);
      //for(var i = 0; i < numberOfThings; i++){
      //   if(States[i]!=null) myUtils.emit2Node(States[i], io);
      //}
   }   
   if(jsonData.Type.localeCompare("Data")==0){
      if(typeof jsonData.DateTime == "undefined")
         jsonData.DateTime = new Date();
      var lastest;
      var dataLen = Data.length;
      if(dataLen>1) lastest = Data[dataLen-1];
      if(lastest==null){                    
         delete jsonData.Type;  
         myUtils.pushData2Array(jsonData, Data, dataLength, function(){
            var newData = Data[Data.length-1];
            newData.DateTime = new Date(newData.DateTime);
            io.emit("ser2web", {"Type":"New", "Payload": newData});
            console.log("ser2web : "+ JSON.stringify(newData));
            jsonData.DateTime = myUtils.convertToSqlDateTime(jsonData.DateTime);     
            mySqlHelper.insertData(jsonData);
         });
      //}else if(myUtils.calcElapsedMinutes((new Date(lastest.DateTime)), jsonData.DateTime)>=dataCycleInMinute){
      }else if(myUtils.calcElapsedSeconds((new Date(lastest.DateTime)), jsonData.DateTime)>=dataCycleInSecond){  
         delete jsonData.Type;  
         myUtils.pushData2Array(jsonData, Data, dataLength, function(){
            var newData = Data[Data.length-1];
            newData.DateTime = new Date(newData.DateTime);
            io.emit("ser2web", {"Type":"New", "Payload": newData});
            console.log("ser2web : "+ JSON.stringify(newData));
            jsonData.DateTime = myUtils.convertToSqlDateTime(jsonData.DateTime);     
            mySqlHelper.insertData(jsonData);
         });
      }else console.log("Ignored data due to not reaching time limit");        
   }
}

function emit2Node(obj2node){
   io.emit("ser2node", obj2node);
   console.log("ser2node : " + JSON.stringify(obj2node));
}
