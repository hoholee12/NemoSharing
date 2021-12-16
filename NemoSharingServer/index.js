"use strict";

//initial variables
var fs = require('fs');
var SFTPServer = require("node-sftp-server");
const { exec } = require('child_process');
var nemosftpsrv = new SFTPServer();

//listen to 8022(client)
nemosftpsrv.listen(8022);
console.log("listening on 8022...");

//connect to client
nemosftpsrv.on("connect", function (auth, info) {
  //reject if its not a connection from client..
  if (auth.method !== "password" || auth.username !== "nemoux" || auth.password !== "nemoux") {
    return auth.reject(["password"], false);
  }
  //auth variables
  var username = auth.username;
  var password = auth.password;

  //accept client
  return auth.accept(function (session) {
    //override writefile
    return session.on("writefile", function (path, readstream) {
      //variables for writestream
      var writestream;
      var filename = path + new Date().getTime() + '.jpeg';

      //create writestream
      writestream = fs.createWriteStream(filename);
      readstream.on("end", function () {
        console.log(filename);
        exec("/opt/pkgs/nemo.image/exec -f " + filename + " -a nemo.image", (error, stdout, stderr) => { });

      });
      //readstream a writestream of sftp connection to client
      return readstream.pipe(writestream);
    });
  });
});

