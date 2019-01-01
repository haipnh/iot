const mysql = require('mysql');

const mySqlPool = mysql.createPool({
   connectionLimit: 5,
   host: "localhost",
   user: "root",
   password: "root",
   database: "dbiot"
});

module.exports = {
   mySqlQuery: function(query, callback){      
      mySqlPool.getConnection(function(err, connection){
         if(err) throw err;
         mySqlPool.query(query, function (err, result, fields) {
            if (err) throw err;
            console.log("[","\x1b[32m", "OK" , "\x1b[0m", "] " + query);
            if(typeof callback=="function"){  // Kiem tra neu co callback thi xu ly              
               if(result instanceof Array){ // Kiem tra neu ket qua truy van la kieu mang thi xu ly theo kieu mang
                  for(var i = 0; i< result.length; i++){
                     delete result[i].Id;
                  }
               }else{ // Neu la mot ket qua duy nhat thi loai bo truong Id
                  delete result.Id;
               }               
               callback(result);
            }   
         }); 
         connection.release();
      });   
   },

   mySqlInit: function(callback){
      module.exports.mySqlQuery("CREATE TABLE IF NOT EXISTS Data (Id MEDIUMINT NOT NULL AUTO_INCREMENT, DateTime DATETIME NOT NULL, Light TINYINT NOT NULL, SoilMoisture TINYINT NOT NULL, PRIMARY KEY(Id))", function(){
         module.exports.mySqlQuery("CREATE TABLE IF NOT EXISTS Log (Id MEDIUMINT NOT NULL AUTO_INCREMENT, Thing TINYINT NOT NULL, State TINYINT NOT NULL, " + 
         "AutoMode TINYINT NOT NULL, AutoBy TINYINT, IfGreaterThan TINYINT, Threshold TINYINT, LastChange DATETIME NOT NULL, PRIMARY KEY(Id))", function(){
         if(typeof callback == "function")   callback();
         });
      });
      console.log("[","\x1b[32m", "Attaching MySQL" , "\x1b[0m", "] ");
   },
   
   getLastestData: function(callback){
      module.exports.mySqlQuery("SELECT * FROM Data ORDER BY Id DESC LIMIT 1", function(callback2){
         if(typeof callback=="function") callback(callback2);
      });
   },
   
   getLastestData: function(numberOfRows, callback){
      module.exports.mySqlQuery("SELECT * FROM (SELECT * FROM Data ORDER BY Id DESC LIMIT " + numberOfRows + ") AS T ORDER BY Id", function(callback2){
         if(typeof callback=="function") callback(callback2);
      });
   },
   
   getLastestState: function(thing, callback){
      // SELECT * FROM Log WHERE Thing=1 ORDER BY Id DESC LIMIT 1;
      var query = "SELECT * FROM Log WHERE Thing = " + thing + " ORDER BY Id DESC LIMIT 1";
      module.exports.mySqlQuery(query, function(callback2){
         if(typeof callback=="function") callback(callback2[0]);
      });
   },
      
   // INSERT INTO Log (Thing, State, AutoMode, AutoBy, Threshold, LastChange) VALUES (1, 1, 0, 0, 0, '2018-12-28 12:45:59');
   insertState: function(thing){
      if(thing!=null){
         var value = thing.Thing + ", " + thing.State + ", " + thing.AutoMode + ", " + thing.AutoBy + ", " + thing.IfGreaterThan + ", " + thing.Threshold + ", '" + thing.LastChange + "'";
         var sql = "INSERT INTO Log (Thing, State, AutoMode, AutoBy, IfGreaterThan, Threshold, LastChange) VALUES (" + value + ")";
         // console.log("sql query : " + sql);
         module.exports.mySqlQuery(sql);
      }
   },
   
   insertData: function(data){   
      var sql = "INSERT INTO Data (DateTime, Light, SoilMoisture) VALUES ('" + data.DateTime + "', " + data.Light + ", " + data.SoilMoisture + ")";
      module.exports.mySqlQuery(sql);         
   }   
};