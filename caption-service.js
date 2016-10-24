// The exported functions in this module makes a call to Microsoft Cognitive Service Computer Vision API and return caption
// description if found. Note: you can do more advanced functionalities like checking
// the confidence score of the caption. For more info checkout the API documentation:
// https://www.microsoft.com/cognitive-services/en-us/Computer-Vision-API/documentation/AnalyzeImage

const request = require('request').defaults({ encoding: null });

const VISION_URL = "https://api.projectoxford.ai/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false&returnFaceAttributes=age,gender";

/** 
 *  Gets the caption of the image from an image stream
 * @param {stream} stream The stream to an image.
 * @return (Promise) Promise with caption string if succeeded, error otherwise
 */
exports.getCaptionFromStream = stream => {
    return new Promise(
        (resolve, reject) => {
            const requestData = {
                url: VISION_URL,
                encoding: 'binary',
                headers: { 'content-type': 'application/octet-stream' 
                           'Ocp-Apim-Subscription-Key': '8f7a031e5133417aa8b1f1ab525efec1'
                          }
            };

            stream.pipe(request.post(requestData, (error, response, body) => {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode != 200) {
                    reject(body);
                }
                else {
                    resolve(extractCaption(JSON.parse(body)));
                }
            }));
        }
    );
}

/** 
 * Gets the caption of the image from an image URL
 * @param {string} url The URL to an image.
 * @return (Promise) Promise with caption string if succeeded, error otherwise
 */
exports.getCaptionFromUrl = url => {
    return new Promise(
        (resolve, reject) => {
            const requestData = {
                url: VISION_URL,
                json: { "url": url }
            };

            request.post(requestData, (error, response, body) => {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode != 200) {
                    reject(body);
                }
                else {
                    resolve(extractCaption(body));
                }
            });
        }
    );
}

/**
 * Extracts the caption description from the response of the Vision API
 * @param {Object} body Response of the Vision API
 * @return {string} Description if caption found, null otherwise.
 */
const extractCaption = body => {
    if (body && body.description && body.description.captions && body.description.captions.length) {
        return body.description.captions[0].faceId
    }

    return null;
}