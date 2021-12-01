"use strict";

var fs = require('fs');

var SFTPServer = require("./node-sftp-server");

var srv = new SFTPServer();

srv.listen(8022);

srv.on("connect", function(auth, info) {
  console.warn("authentication attempted, client info is: "+JSON.stringify(info)+", auth method is: "+auth.method);
  if (auth.method !== 'password' || auth.username !== "brady" || auth.password !== "test") {
    return auth.reject(['password'],false);
  }
  console.warn("We haven't *outhright* accepted yet...");
  var username = auth.username;
  var password = auth.password;

  return auth.accept(function(session) {
    console.warn("Okay, we've accepted, allegedly?");
    session.on("readdir", function(path, responder) {
      var dirs, i, j, results;
      console.warn("Readdir request for path: " + path);
      dirs = (function() {
        results = [];
        for (j = 1; j < 10000; j++){ results.push(j); }
        return results;
      }).apply(this);
      i = 0;
      responder.on("dir", function() {
        if (dirs[i]) {
          console.warn("Returning directory: " + dirs[i]);
          responder.file(dirs[i]);
          return i++;
        } else {
          return responder.end();
        }
      });
      return responder.on("end", function() {
        return console.warn("Now I would normally do, like, cleanup stuff, for this directory listing");
      });
    });
    session.on("readfile", function(path, writestream) {
      return fs.createReadStream("/tmp/grumple.txt").pipe(writestream);
    });
    return session.on("writefile", function(path, readstream) {
      console.warn("WRITE FILE HAS BEEN ATTEMPTED!");
      var something;
      something = fs.createWriteStream("/tmp/garbage");
      readstream.on("end",function() {console.warn("Writefile request has come to an end!!!")});
      return readstream.pipe(something);
    });
  });
});

srv.on("error", function() {
  return console.warn("Example server encountered an error");
});
srv.on("end", function() {
  return console.warn("Example says user disconnected");
});
