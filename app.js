// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
let response;

/*
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
 const fs = require("fs");
 var {Buffer} = require('buffer')
 var AWS = require("aws-sdk");

 
 
 const files = [1];
 
 const fileContents = fs.readFileSync('./notasbase64.txt').toString()
 let notes = [];
 
 const config = {
     api: {
       bodyParser: false,
     },
   };
   

 
 var signatures = {
     JVBERi0: "application/pdf",
   };
   
 function detectMimeType(b64) {
     for (var s in signatures) {
       if (b64.indexOf(s) === 0) {
         return signatures[s];
       }
     }
 }


//exports.lambdaHandler =
(async (event, context) => {
    try {
        const s3 = new AWS.S3({
            accessKeyId:  xxx,
            secretAccessKey:  xxx,
            region: xxx,
            signatureVersion: 'v4',
        });
        const name =   Math.random().toString(36).slice(2) + '.pdf';
        const path = './tmp/' + name ;
        console.log(detectMimeType(fileContents));
        const mimetype=detectMimeType(fileContents);
        if(mimetype=='application/pdf'){
            await Promise.all(files.map(async (file) => {
               
                const s3path=  'pdf' + '/' + name;
                const baseurl=xxx;
                s3.putObject({
                    Bucket : xxx,
                    Key : s3path,
                    Body :  Buffer.from(fileContents, 'base64'),
                    ContentType : "application/pdf",
                    ACL: 'public-read',
                 },
                 function(error, data) {
    
                    if (error != null) {
                       console.log("error: " + error);
                    } else {
                        console.log('upload data : ', data);

                       return (null, {
                           url:  baseurl +  '/' + s3path
                       });
                    }
    
                 });
        
                
             
        
            }));
            
        }else{
            return "erro";
        }

        response = {
            'statusCode': 200,
            'body': JSON.stringify({
                message: ' funcionou',
            })
        }
    } catch (err) {
        console.log(err);
        return err;
    }

    return response
})();
