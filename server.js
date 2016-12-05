var restify = require('restify');
var builder = require('botbuilder');
var restify = require('restify');
var builder = require('botbuilder');
var Face = require('oxford-face-api');
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var request = require("superagent");
var httprequest = require('request').defaults({
  encoding: null
});
const needle = require("needle"),
  url = require('url');

var fs = require('fs'),
  gm = require('gm');

var azure = require('azure-storage');
var blobSvc = azure.createBlobService('13threaltimeinsight', 'fKxio8XGO776YjVV84gDgbYmVQiOdtGtiS9m/8AGoL1xPGK3Yyqso+lgz8wKCyG0vzZVi+UQvyn9L+e+K1CC/w==');
var person_index = -1;
var personid;
var person_confidence = 1;
var young_person_index;
var max_age = 999;
var man_count = 0;
var woman_count = 0;
var max_smile_value = 0;
var smile_person_index = -1;
var filename, smile_filename, dir_filename, smdir_filename, found_filename;
var FACEKEY = "8f7a031e5133417aa8b1f1ab525efec1";
var CROP = true;
var KC_ID = "7c1e96f9-c73c-4eea-951b-61aab07c1b16";
var JERRY_ID = "16ef3542-84b4-448e-9250-9f57773f183b";
var PERSONGROUP_ID = "mtcbotdemo";
var MAXNumOf_CA_Returned = 1 ;
var CONFID_THRESHOLD = 0.623 ;
var FinalName = "";
var found = false;

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
  console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID ,// || "46f3c125-0de0-4793-aa9e-7f2cea05edd8",
  appPassword: process.env.MICROSOFT_APP_PASSWORD// || "sLbbW5UBJT4MkOegHm15m1H"
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

// Create LUIS recognizer 
var model = process.env.LUIS_MODEL_URL || "https://api.projectoxford.ai/luis/v1/application?id=ceb627e1-2d52-4626-9bbd-543a25983862&subscription-key=35820529a1be4e389462b5b4fd14ef90";
var recognizer = new builder.LuisRecognizer(model);
var dialog = new builder.IntentDialog({
  recognizers: [recognizer]
});
bot.dialog('/', dialog);
 
//開場LUIS
dialog.matches('你好', [
  function(session, args, next) {
    console.log("here")
    builder.Prompts.attachment(session, '請上傳一張照片讓我看看在場的俊男美女');
  },
  function(session, results) {
    if (typeof session.message.attachments[0] !== 'undefined') {
      var tok;
      connector.getAccessToken((error, token) => {
        tok = token;
      });
      var options = {
        url: session.message.attachments[0].contentUrl,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Authorization': 'Bearer ' + tok
        }
      };
       upLoadImage(options, session);
     
    }
  }
]);

//intent LUIS 請客     根目錄/smileFace & actionmoneyFace為判斷笑容值 ＆ Jerry/younger 
dialog.matches('開心', [
  function(session, args) {
    var msg = new builder.Message(session);
    console.log("smile_filename", smile_filename);
    msg.attachments([{
      contentType: "image/jpeg",
      contentUrl: "https://13threaltimeinsight.blob.core.windows.net/imagescontainer/" + smile_filename,
    }]);
    session.endDialog(msg);
    var reply_str = '他看起來笑得最燦爛，笑顏值有' + max_smile_value + '分這麼高呢!';
    session.send(reply_str); //Send Photo CT建議放大開心那個人的臉部比較有效果
    max_smile_value = 0;
  },
]);

dialog.matches('認識', [
  function(session, args) {
    var msg = new builder.Message(session);
    if (found) {
      url = "https://13threaltimeinsight.blob.core.windows.net/imagescontainer/" + found_filename;
    } else {
      url = "https://13threaltimeinsight.blob.core.windows.net/imagescontainer/" + filename;
    }
    msg.attachments([{
      contentType: "image/jpeg",
      contentUrl: url,
    }]);
    session.endDialog(msg);
    var reply_str = "";
    if (person_index == -1) {
      if (max_age > 1) {
        max_age = parseInt(max_age);
      }
      reply_str = '當然是看起來最年輕的要請客囉~~就是你啦不要躲，看起來你只有' + max_age + '歲呢!!';
    } else {
      var title_str;
      if (FinalName == "微軟總經理Jerry") {
        title_str = "總經理";
      } else if (FinalName == "微軟副總經理KC") {
        title_str = "副總經理";
      }
      reply_str = '嗨' + FinalName + '，好久不見啦~~';
      person_index = -1;
    }
    session.send(reply_str);
  }
]);

dialog.matches('請客', [
  function(session, args, next) {
    // builder.Prompts.attachment(session, '請上傳一張照片讓我看看今天午餐誰來請客');
    var msg = new builder.Message(session);
    msg.attachments([{
      contentType: "image/jpeg",
      contentUrl: "https://13threaltimeinsight.blob.core.windows.net/imagescontainer/" + filename,
    }]);
    session.endDialog(msg);
    var reply_str = "";
    if (person_index == -1) {
      if (max_age > 1) {
        max_age = parseInt(max_age);
      }
      reply_str = '當然是看起來最年輕的要請客囉~~就是你啦不要躲，看起來你只有' + max_age + '歲呢!!';
    } else {
      var title_str;
      if (FinalName == "微軟總經理Jerry") {
        title_str = "總經理";
      } else if (FinalName == "微軟副總經理KC") {
        title_str = "副總經理";
      }
      reply_str = '當然是' + FinalName + '要請客拉!!，謝謝' + title_str + ' づ(ˊ● ω ●ˋ)づ Let' + '\'s GO~';
      person_index = -1;
    }
    session.send(reply_str);
  }
]);

FaceAnalyze = async(function(att_url,request_body,session){

    session.send("開始分析...");

    var detect_response=sendDetectedFace(request_body,true,true,true,true,true);

    session.send("再給我一下下...");

    if(detect_response.statusCode != 200){
      console.log("detect error");
      return;
    }

    var myJson = JSON.parse(JSON.stringify(detect_response.body));

    for (i = 0; i < myJson.length; i++) {
      if (myJson[i].faceAttributes.age < max_age) {
        young_person_index = i;
        max_age = myJson[i].faceAttributes.age;
      }

      if (myJson[i].faceAttributes.gender == 'male') {
        man_count = man_count + 1;
      } else if (myJson[i].faceAttributes.gender == 'female') {
        woman_count = woman_count + 1;
      }

      if (myJson[i].faceAttributes.smile > max_smile_value) {
        max_smile_value = myJson[i].faceAttributes.smile;
        smile_person_index = i;
      }
    }
   
    
    cropSmileFace(att_url, myJson, smile_person_index);

    session.send("大家都看起來很開心呢!!");

    var total_iter = Math.ceil(myJson.length / 10);
    var residue = myJson.length % 10;
    var count = 0;
   
    for (count = 0; count < total_iter; count++) {
      var facelist = [];
      for (j = 0; j < Math.min(count == total_iter - 1 ? residue : myJson.length, 10); j++) {
        facelist.push(myJson[j + count * 10].faceId);
      }
    
      var identify_response = sendIdentifyFace(PERSONGROUP_ID,facelist,MAXNumOf_CA_Returned,CONFID_THRESHOLD);
      var identify_Json = JSON.parse(JSON.stringify(identify_response.body));
     
      var i_index;  
      for (i_index = 0; i_index < identify_Json.length; i_index++) {

        if (identify_Json[i_index].candidates.length != 0) {

          person_index = i_index + count * 10;
          personid = identify_Json[i_index].candidates[0].personId;
          person_confidence = identify_Json[i_index].candidates[0].confidence;
          if (personid == JERRY_ID) {
            FinalName = "微軟總經理Jerry";
            found = true;
            break;
          } else if (personid == KC_ID) {
            FinalName = "微軟副總經理KC";
            found = true;
            
          }
        }
      }

    }
    
    if (person_index == -1) {
      youngestOrFound(att_url,myJson,young_person_index);
    } else {
      youngestOrFound(att_url,myJson,person_index);
    }

    session.send("分析完畢 :)");

    setTimeout(function() {
      replyGuestNum(session,man_count,woman_count);//your code to be executed after 2.5 second
    }, 2500);
    
  
});
function replyGuestNum(session,man_count,woman_count){

  var reply_str = '我看到了有';
  if (man_count != 0) {
    reply_str = reply_str + man_count + '位男嘉賓';
  }
  if (woman_count != 0) {
    if (man_count != 0) {
      reply_str = reply_str + '和' + woman_count + '位女嘉賓';
    } else {
      reply_str = reply_str + woman_count + '位女嘉賓';
    }
  }
  reply_str = reply_str + '，歡迎參觀微軟 :-)';

  session.send(reply_str);
 
}
function sendDetectedFace(request_body,FaceId,FaceLandmarks,AGE,GENDER,SMILE){

    var faceAttributes="";

    if(AGE){
      faceAttributes=faceAttributes+",age";
    }
    if(GENDER){
      faceAttributes=faceAttributes+",gender";
    }
    if(SMILE){
      faceAttributes=faceAttributes+",smile";
    }

    faceAttributes=faceAttributes.substring(1,faceAttributes.length);
    var response = await(
    request
      .post("https://api.projectoxford.ai/face/v1.0" + "/detect?")
      .query({
        returnFaceId: FaceId
      })
      .query({
         returnFaceLandmarks: FaceLandmarks
      })
      .query({
        returnFaceAttributes: faceAttributes
      })
      .set('Content-Type', 'application/octet-stream')
      .set('Ocp-Apim-Subscription-Key', FACEKEY)
      .send(request_body)
    );

    return response;

}
function sendIdentifyFace(personGroupId,faceIds,maxNumOfCandidatesReturned,confidenceThreshold){
    var identify_reqbody = {
      "personGroupId": personGroupId,
      "faceIds": faceIds,
      "maxNumOfCandidatesReturned": maxNumOfCandidatesReturned,
      "confidenceThreshold": confidenceThreshold
    };
    var response 
      = await( 
              request
                .post("https://api.projectoxford.ai/face/v1.0" + "/identify")
                .set('Content-Type', 'application/json')
                .set('Ocp-Apim-Subscription-Key', FACEKEY)
                .send(identify_reqbody)          
              );
    return response;    
}
function upLoadImage(att_url, session) {
  found = false;
  man_count = 0;
  woman_count = 0;
  httprequest.get(att_url, function(error, response, body) {

    if (!error && response.statusCode == 200) {

      var attachment_img = new Buffer(body, 'binary');
   
      FaceAnalyze(att_url,attachment_img,session);
      
    } else {
      console.log(response.statusCode);
      console.log(error);
      console.log(body);
    }
  });
}
function youngestOrFound(att_url,faces,index){

  var pic = gm(httprequest(att_url));
  pic.stroke('#FFBB00').strokeWidth(5);

  var x = faces[index].faceRectangle.left;
  var y = faces[index].faceRectangle.top;
  var width = faces[index].faceRectangle.width;
  var height = faces[index].faceRectangle.height;

  pic.drawLine(x, y, x + width, y)
     .drawLine(x, y, x, y + height)
     .drawLine(x, y + height, x + width, y + height)
     .drawLine(x + width, y, x + width, y + height);
  filename = './images/' +(Math.random() + 1).toString(24).substring(4) + '.jpg';

  if (found) {
    found_filename = filename
  }

  dir_filename = '' + filename;   
  pic.write(filename, function(err) {
    if (err) {
      console.log(err);
      return;
    }

    blobSvc.createBlockBlobFromLocalFile('imagescontainer', filename, dir_filename, function(error, result, response) {
      if (error) {
        console.log("Couldn't upload imagecontainer stream");
        console.error(error);
        return;
      } 
      console.log('Stream uploaded successfully');
    });
  });
} 
function cropSmileFace(att_url, faces, index) {
  var pic = gm(httprequest(att_url));
  pic.stroke('#FFFF00').strokeWidth(4);

  filename = (Math.random() + 1).toString(24).substring(4) + '.jpg';
  smile_filename = './images/sm_' + filename;
  smdir_filename = '' + smile_filename;
 
  var x = faces[index].faceRectangle.left;
  var y = faces[index].faceRectangle.top;
  var width = faces[index].faceRectangle.width;
  var height = faces[index].faceRectangle.height;

  if (CROP) {
    pic.crop(width, height, x, y);
  } else {
    pic.drawLine(x, y, x + width, y)
      .drawLine(x, y, x, y + height)
      .drawLine(x, y + height, x + width, y + height)
      .drawLine(x + width, y, x + width, y + height);
  }

  pic.write(smile_filename, function(err) {
    if (err) {
      console.log(err);
      return;
    }
    blobSvc.createBlockBlobFromLocalFile('imagescontainer', smile_filename, smdir_filename, function(error, result, response) {
      if (error) {
        console.log("Couldn't upload stream");
        console.error(error);
      }else{
        console.log("upload Smile");
      }
    });
  });
}