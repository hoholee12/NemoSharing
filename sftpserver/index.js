"use strict";

var fs = require('fs');

var SFTPServer = require("node-sftp-server");

const { exec } = require('child_process');

var srv = new SFTPServer();

srv.listen(8022);
console.log("listening on 8022...");

srv.on("connect", function (auth, info) {
  if (auth.method !== 'password' || auth.username !== "nemoux" || auth.password !== "nemoux") {
    return auth.reject(['password'], false);
  }
  var username = auth.username;
  var password = auth.password;

  return auth.accept(function (session) {
    return session.on("writefile", function (path, readstream) {
      var writestream;
      var filename = path + new Date().getTime() + '.jpeg';
      writestream = fs.createWriteStream(filename);
      readstream.on("end", function () {
        console.log(filename);
        exec("/opt/pkgs/nemo.image/exec -f " + filename + " -a nemo.image", (error, stdout, stderr) => { });

      });
      return readstream.pipe(writestream);
    });
  });
});
