var fs = require('fs');
var path = require('path');

var multipart = require('connect-multiparty');
var express = require('express');
var nodemailer = require('nodemailer');

var config = require('./config');

var app = express();
var transport = nodemailer.createTransport(config.mailer);

app.set('port', 8088);

app.use(multipart({ uploadDir: path.join(__dirname, 'upload') }));

app.get('/', function(req, res) {
    res.sendFile('/uploader.html', {
        root: __dirname
    });
});

app.post('/upload', function(req, res) {
    if (! /^([a-zA-Z0-9_.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(req.body.to)) {
        return;
    }

    if (!req.files.book || req.files.book.name.search('.txt') == -1) {
        return;
    }

    var bookname = req.files.book.name;
    var bookpath = __dirname + '/books/' + req.files.book.name;

    fs.renameSync(req.files.book.path, bookpath);

    transport.sendMail({
        from: config.mailer.auth.user,
        to: req.body.to,
        subject: 'Convert',
        attachments: [
            {
                path: bookpath
            }
        ]
    }, function(error, info) {
        if (error) {
            console.log('发送失败: ' + error);
        }
        else {
            console.log('发送成功: ' + info.response);
        }

        transport.close();
    });

    res.redirect('/');
});

var server = app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + server.address().port);
});