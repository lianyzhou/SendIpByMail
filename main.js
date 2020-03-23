var fs = require("fs");
var ps = require("child_process");
var mailer = require("nodemailer");
var config = require("./config");
var queryUrlList = [
  {name: "cip_cc", url: "http://www.cip.cc/"},
  {name: "tool_lu", url: "https://tool.lu/ip/"},
];

function pad(num) {
  if (num < 10) {
    return '0' + num;
  }
  return num + '';
}



// 获取日期文件名
function getDateFileName(name) {
  var date = new Date();
  var logName = [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-') + name + ".log";
  return logName;
}

function startQuery() {
  var params = queryUrlList.pop();
  if (!params) {
    return;
  }
  ps.exec("curl " + params.url, {}, function(err, stdout, stderr) {
    if (err) {
      sendEmail({
        subject: "查询ip出错" + params.name,
        html: "查询ip出错," + stderr,
        name: params.name
      });
      console.log("查询ip出错," + params.name + "," + stderr);
      startQuery();
    } else {
      var reg = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
      var result = stdout.match(reg);
      if (result) {
        var resultIp = result[0];
        sendEmail({
          subject: "ip地址：" + resultIp,
          html: "ip地址：" + resultIp,
          name: params.name
        });
        console.log("ip地址：" + resultIp);
      } else {
        console.log("未获取到ip:" + params.name);
        sendEmail({
          subject: "未获取到ip:" + params.name,
          html: "未获取到ip:" + params.name,
          name: params.name
        });
        startQuery();
      }
    }
  });
}

function sendEmail(params) {
  var subject = params.subject;
  var html = params.html;
  var transporter = mailer.createTransport(
    {
      host: "smtp.163.com",
      secure: true,
      auth: {
        user: config.email,
        pass: config.password
      },
    },
    {
      from: config.email
    }
  );
  var message = {
    to: config.email,
    subject: subject,
    html: html
  };
  transporter.sendMail(message, (error, info) => {
    if (error) {
      var fileName = getDateFileName(params.name);
      var errorInfo = error.toString();
      var fileContentArr = [
        "name:" + params.name,
        "邮件主题:" + subject,
        "邮件内容:" + html,
        "发邮件错误:" + errorInfo
      ];
      var fileContent = fileContentArr.join('\n');
      fs.writeFileSync(fileName, fileContentArr, "utf8");
      startQuery();
    } else {
      console.log("邮件发送成功");
    }
    transporter.close();
  });
}

startQuery();

