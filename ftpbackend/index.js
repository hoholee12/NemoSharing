const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const multer = require('multer');
const FTPStorage = require('multer-ftp');

var app = express();
app.use(cors());
app.use(morgan("combined"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var upload = multer({
  storage: new FTPStorage({
    basepath: '',
    ftp: {
      host: '115.145.170.225',
	  port: '1111',
      secure: false,
      user: '',
      password: ''
    },
    destination: function (req, file, options, cb) {
		cb(null, '/destination/'+ file.originalname)
	},

  })
});

app.post('/upload', upload.single('file'),function(req, res) {
  console.log(req.file);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("backend server is running...");
});

