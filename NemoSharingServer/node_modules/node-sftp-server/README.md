
# node-sftp-server

A simple interface to be able to implement an SFTP Server using Node.js. Based 
on excellent work by [@mscdex](https://github.com/mscdex) - [ssh2](https://github.com/mscdex/ssh2) and [ssh2-streams](https://github.com/mscdex/ssh2-streams). Without
which none of this would be possible.

In all cases, this library will only ever perform a subset of what can be 
accomplished with [ssh2](https://github.com/mscdex/ssh2). If there's something more advanced you need
to do and this library won't support it, that one is probably the one to look 
at. And certainly pull requests would be welcome, too!

The easiest way to get the hang of this library is probably to look at the 
`server_example.js` to start with, until this documentation gets more fully
fleshed-out.

# Installation

```
npm install --save node-sftp-server
```

# Usage

```js
var SFTPServer=require('node-sftp-server');
```

## SFTPServer Object

### constructor

```js
var myserver = new SFTPServer({ privateKeyFile: "path_to_private_key_file" });
```

This returns a new `SFTPServer()` object, which is an EventEmitter. If the private
key is not specified, the constructor will try to use `ssh_host_rsa_key` in the current directory.

### debugging

You can supply a `debug: true` option to the constructor like this:

```js
var myserver = new SFTPServer({
    privateKeyFile: "path_to_private_key_file",
    debug: true
});
```

The `debug` option turns on console logging for SSH2 streams so you can see what's going on under the
hood to help debug authentication problems, or other low level issues you may encounter. 

### temporary files

The server stores temporary files while users are downloading. These are handled by the [tmp library](https://www.npmjs.com/package/tmp).
Permissions for these files are set to 600 (read and write for the node user, no permission for any other users) and 
are stored in your platform's default temporary file location. You can control which directory these files appear in
by passing the `temporaryFileDirectory` to the constructor like this:

```js
var myserver = new SFTPServer({
    privateKeyFile: "path_to_private_key_file",
    temporaryFileDirectory: "/some/temporary/file/path/here"
});
```

### methods 
```js
.listen(portnumber)
```
Listens for an SFTP client to connect to the server on this port.

### events
`connect` - passes along two parameters. The first is a simple context object which has - 

- username: 
- password:
- method: 

The second is a client-info parameter, which has elements like:
{"ip":"::1","header":{"identRaw":"SSH-2.0-FileZilla_3.27.1","versions":{"protocol":"2.0","software":"FileZilla_3.27.1"}}}
- ip (the remote IP)
- header
  - identRaw (client identification string, like "SSH-2.0-FileZilla_3.27.1")
  - versions
    - protocol (example: "2.0")
    - software (example: "FileZilla_3.27.1")

With the context object, you can call `.reject(methodsLeft, isPartial)` to reject the connection, or call `.accept(callback)`
to work with the new connection. The accept callback will be passed a Session object
as its parameter. The `methodsLeft` parameter is an array of acceptable authentication
methods, two of which are 'password' and 'none'. `isPartial` is whether or not the 
attempt should be considered a partial success.

`end` - emitted when the user disconnects from the server.

`error` - emitted when the ssh server throws an error. passes error object

## Session Object

This object is passed to you when you call `.accept(callback)` - your callback
should expect to be passed a session object as a parameter. The session object
is an EventEmitter as well.

### events

`.on("realpath",function (path,callback) { })` - the server wants to determine the 'real' path
for some user. For instance, if a user, when they log in, is immediately deposited
into `/home/<username>/` - you could implement that here. Invoke the callback 
with the calculated path - e.g. `callback("/home/"+username)`.  *TODO* - Error 
management here!

`.on("stat",function (path,statkind,statresponder) { })` - on any of STAT, LSTAT, or FSTAT
requests (the type will be passed in "statkind"). The statresponder object is a `Statter`
object from the source code. Communicate status back by calling methods and setting properties
on the object like this:

#### Directory
```js
session.on('stat', function(path, statkind, statresponder) {
    statresponder.is_directory();      // Tells statresponder that we're describing a directory.
    statresponder.permissions = 0o755; // Octal permissions, like what you'd send to a chmod command
    statresponder.uid = 1;             // User ID that owns the file.
    statresponder.gid = 1;             // Group ID that owns the file.
    statresponder.size = 0;            // File size in bytes.
    statresponder.atime = 123456;      // Created at (unix style timestamp in seconds-from-epoch).
    statresponder.mtime = 123456;      // Modified at (unix style timestamp in seconds-from-epoch).

    statresponder.file();   // Tells the statter to actually send the values above down the wire.
});
```

#### File
```js
session.on('stat', function(path, statkind, statresponder) {
    statresponder.is_file();           // Tells statresponder that we're describing a file.
    statresponder.permissions = 0o644; // Octal permissions, like what you'd send to a chmod command
    statresponder.uid = 1;             // User ID that owns the file.
    statresponder.gid = 1;             // Group ID that owns the file.
    statresponder.size = 1234;         // File size in bytes.
    statresponder.atime = 123456;      // Created at (unix style timestamp in seconds-from-epoch).
    statresponder.mtime = 123456;      // Modified at (unix style timestamp in seconds-from-epoch).

    statresponder.file();   // Tells the statter to actually send the values above down the wire.
});
```

#### Errors

You can also respond with file not found messages like this:

```js
session.on('stat', function(path, statkind, statresponder) {
    statresponder.nofile(); // Tells the statter to send a file not found stat down the wire.
});
```

`.on("readdir", function (path, responder) { })` - on a directory listing attempt, the `responder` will
keep emitting `dir` messages, allowing you to respond with `responder.file(filename, attrs)` to return a file
entry in the directory, or `responder.end()` if the directory listing is complete. See `server_example.js` for a
complete example.

Some explanation on `attrs` param:
```js
var fs = require('fs');

/*
* Explanation for attrs.mode 
* 
* You may use type bit from fs lib constants and add permissions to it
* 
* Permissions mask would look like 0oXXX where XXX is file octal permissions
* 
* If you'd like to explain directory use:
* fs.constants.S_IFDIR | 0oXXX
* 
* If you'd like to explain file use:
* fs.constants.S_IFREG | 0oXXX
* 
*/

var attrs = {
	'mode': fs.constants.S_IFDIR | 0o644 	// Bit mask of file type and permissions 
	'permissions': 0o644, 					// Octal permissions, like what you'd send to a chmod command
	'uid': 1, 								// User ID that owns the file.
	'gid': 1, 								// Group ID that owns the file.
	'size': 1234, 							// File size in bytes.
	'atime': 123456, 						// Created at (unix style timestamp in seconds-from-epoch).
	'mtime': 123456 						// Modified at (unix style timestamp in seconds-from-epoch).
}

```

`.on("readfile",function (path,writable_stream) { })` - the client is attempting to read a file
from the server - place or pipe the contents of the file into the `writable_stream`.

`.on("writefile",function (path,readable_stream) { })` - the client is attempting to write a 
file to the server - the `readable_stream` corresponds to the actual file. You
may `.pipe()` that into a writable stream of your own, or use it directly.

`.on("delete",function (path,callback) { })` - the client wishes to delete a file. Respond with
`callback.ok()` or `callback.fail()` or any of the other error types

`.on("rename",function (oldPath,newPath,callback) { })` - the client wishes to rename a file. Respond with
`callback.ok()` or `callback.fail()` or any of the other error types

`.on("mkdir",function (path,callback) { })` - the client wishes to create a directory. Respond with
`callback.ok()` or `callback.fail()` or any of the other error types

`.on("rmdir",function (oldPath,callback) { })` - the client wishes to remove a directory. Respond with
`callback.ok()` or `callback.fail()` or any of the other error types

## Error Callbacks

Many of the session events pass some kind of 'responder' or 'callback' object
as a parameter. Those typically will have several error conditions that you can
use to refuse the request - 

- `responder.fail()` - general failure?
- `responder.nofile()` - no such file or directory
- `responder.denied()` - access denied
- `responder.bad_message()` - protocol error; bad message (unusual)
- `responder.unsupported()` - operation not supported
- `responder.ok()` - success
