var socket = io();

/* Variables */
var numberofThings = 4;
var States = [];
var dataLength = 24*3;
var newData, Data = [];
var canvas = document.getElementById("canvas");
var myLineChart;
var datasets = [
   {
      label: "Light (%)",
      fontColor: "#fff",
      fill: false,
      lineTension: 0,
      backgroundColor: "rgba(255,99,71,1)",
      borderColor: "rgba(255,99,71,1)",

      pointBorderColor: "rgba(255,99,71,1)",
      pointBackgroundColor: "#fff",
      pointBorderWidth: 1,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: "rgba(255,99,71,1)",
      pointHoverBorderColor: "rgba(255,255,255,1)",
      pointHoverBorderWidth: 2,
      pointRadius: 5,
      pointHitRadius: 10,
      data: [],
   },
   {
      label: "Soil Moisture (%)",
      fill: false,
      lineTension: 0,
      backgroundColor: "rgba(75,192,192,1)",
      borderColor: "rgba(75,192,192,1)",

      pointBorderColor: "rgba(75,192,192,1)",
      pointBackgroundColor: "#fff",
      pointBorderWidth: 1,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: "rgba(75,192,192,1)",
      pointHoverBorderColor: "rgba(255,255,255,1)",
      pointHoverBorderWidth: 2,
      pointRadius: 5,
      pointHitRadius: 5,
      data: [],
   }
]

function initChart(){
   var data = {
      labels: [],
      datasets: datasets
   };

   var option = {
      legend: {
            display: true,
            labels: {
                fontColor: '#000'
            }
        },      
      showLines: true
   };
   
   myLineChart = Chart.Line(canvas,{
      data:data,
      options:option
   });
} 

/* Windows on load event*/
window.onload = function() {
   socket.emit("web2ser", {"Type":"Greeting"});   
   
   for(var i=0; i<numberofThings; i++){
      syncSliderValue(i);
      setEnableAutoPanel(i);
   }
   
   initChart();   
}

/* Event-Driven Functions */
socket.on("ser2web", function(msg){
   console.log(msg.Payload);
   if(msg.Type.localeCompare("State")==0){      
      States = msg.Payload;
      convertAllStateDateTime();
      console.log("States : " + JSON.stringify(States));
      syncPanels();          
   }
   if(msg.Type.localeCompare("Data")==0){
      Data = msg.Payload;
      convertAllDataDateTime();   
      syncChart();
   }
   if(msg.Type.localeCompare("New")==0){
      newData = msg.Payload;
      convertDataDateTime(newData);
      pushData2Array(newData, Data);
      pushData2Chart(newData, myLineChart);
   }   
});

function StateSwitchOnChange(item){
   var index = item.id.replace( /^\D+/g, ''); // Extracting number only from string
   setEnableAutoModeAndPanel(index);
   sendCmd(item);
}

function AutoModeSwitchOnChange(item){
   sendCmd(item);
   var index = item.id.replace( /^\D+/g, ''); // Extracting number only from string
   setEnableAutoPanel(index);
}

function AutoByOnChange(item){
   sendCmd(item);  
}

function IfGreaterThanOnChange(item){
   sendCmd(item);
}

function SliderOnInput(item){
   var index = item.id.replace( /^\D+/g, '');
   document.getElementById("SliderVal"+index).innerHTML = document.getElementById(item.id).value;
}

function SliderOnChange(item){   
   sendCmd(item);   
   SliderOnInput(item);
}

/* Some useful functions */

function makeCmd(index){
   var stateSwitch = document.getElementById("StateSwitch"+index).checked;
   var autoModeSwitch = document.getElementById("AutoModeSwitch"+index).checked;       
   var autoBy = document.getElementById("AutoBy"+index).selectedIndex;
   var ifGreaterThan = document.getElementById("IfGreaterThan"+index).selectedIndex;
   var threshold = document.getElementById("Slider"+index).value;
     
   var obj = new Object(); 
   obj.Type = "Command";
   obj.Thing = parseInt(index, 10);
   obj.State = stateSwitch ? 1 : 0;
   obj.AutoMode = autoModeSwitch ? 1 : 0;      
   obj.AutoBy = parseInt(autoBy, 10);
   obj.IfGreaterThan = parseInt(ifGreaterThan, 10);
   obj.Threshold = parseInt(threshold, 10);  

   console.log(obj);
   
   return obj;
}

function sendCmd(item){
   var index = item.id.replace( /^\D+/g, ''); // Extracting number only from string   
   var cmd = makeCmd(index);
   socket.emit("web2ser", cmd);
   console.log("Sent : " + JSON.stringify(cmd));
}

function syncSliderValue(index){
   var sliderVal =  document.getElementById("Slider"+index).value;
   document.getElementById("SliderVal"+index).innerHTML = sliderVal;
}

function setEnableAutoModeAndPanel(index){
   document.getElementById("AutoModeSwitch"+index).disabled = !document.getElementById("StateSwitch"+index).checked;
   setEnableAutoPanel(index);
}

function setEnableAutoPanel(index){
   var state = document.getElementById("StateSwitch"+index).checked;
   var autoMode = document.getElementById("AutoModeSwitch"+index).checked;
   var combobox1 = document.getElementById("AutoBy"+index);
   var combobox2 = document.getElementById("IfGreaterThan"+index);
   var slider = document.getElementById("Slider"+index);
   combobox1.disabled = combobox2.disabled = slider.disabled = !(state&&autoMode);
} 

function syncPanel(thing){
   var index = thing.Thing;
   document.getElementById("StateSwitch"+index).checked = thing.State==1 ? true : false;
   document.getElementById("AutoModeSwitch"+index).checked = thing.AutoMode==1 ? true : false;       
   document.getElementById("AutoBy"+index).selectedIndex = thing.AutoBy;
   document.getElementById("IfGreaterThan"+index).selectedIndex = thing.IfGreaterThan;
   document.getElementById("SliderVal"+index).innerHTML = document.getElementById("Slider"+index).value = thing.Threshold;
   document.getElementById("LastChange"+index).innerHTML = thing.LastChange.toLocaleString("en-US", {hour12 : false});
   setEnableAutoPanel(index);
}

function syncPanels(){
   for(var i = 0; i < numberofThings; i++){
      if(States[i]!=null) syncPanel(States[i]);
   }
}

function syncChart(){
   if(Data.length>0){
      for(var i = 0; i < dataLength; i++){
         pushData2Chart(Data[i], myLineChart);
      }
   }
}

function pushData2Array(data, array){
   if(array.length == dataLength){
      array.shift();
   }
   array.push(data);
}

function convertStateDateTime(state){
   if(state!=null) state.LastChange = new Date(state.LastChange);
}

function convertAllStateDateTime(){
   for(i = 0;i< numberofThings; i++){
      convertStateDateTime(States[i]);
   }
}

function convertDataDateTime(data){   
   if(data!=null) {
      //var offset = new Date().getTimezoneOffset();
      //console.log("Offset : " + offset);
      //console.log("Before : " + data.DateTime);
      data.DateTime = new Date(data.DateTime);
      //console.log("After : " + data.DateTime);
   }
}

function convertAllDataDateTime(){
   for(var i = 0 ; i < dataLength; i++){
      convertDataDateTime(Data[i]);
   }
}

function pushData2Chart(data, chart) {    
   if(data!=null){
      if(chart.data.datasets[0].data.length == dataLength){
         chart.data.datasets[0].data.shift();      
      }
      if(chart.data.datasets[1].data.length == dataLength){
         chart.data.datasets[1].data.shift();
      }
      if(chart.data.labels.length == dataLength){
         chart.data.labels.shift();
      }
      chart.data.datasets[0].data.push(data.Light);
      chart.data.datasets[1].data.push(data.SoilMoisture);
      chart.data.labels.push(data.DateTime.toLocaleTimeString("en-US", {hour12 : false}));
      chart.update();
   }
}
