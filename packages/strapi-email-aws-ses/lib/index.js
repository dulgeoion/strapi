'use strict';

/**
 * Module dependencies
 */

/* eslint-disable import/no-unresolved */
/* eslint-disable prefer-template */
// Public node modules.
const _ = require('lodash');
const AWS = require('aws-sdk');

/* eslint-disable no-unused-vars */
module.exports = {
  provider: 'aws-ses',
  name: 'AWS SES',
  auth: {
    aws_ses_default_from: {
      label: 'AWS SES Default From',
      type: 'text'
    },
    aws_ses_default_replyto: {
      label: 'AWS SES Default Reply-To',
      type: 'text'
    },
    region: {
      label: 'Region',
      type: 'enum',
      values: [
        'us-east-1',
        'us-west-2',
        'eu-west-1',
      ]
    },    
  },

  init: (config) => {

    AWS.config.update({
      region: config.region
    });

    return {
      send: async (options, cb) => {
        // Default values.
        options = _.isObject(options) ? options : {};
        options.from = options.from || config.aws_ses_default_from;
        options.replyTo = options.replyTo || config.aws_ses_default_replyto;
        options.text = options.text || options.html;
        options.html = options.html || options.text;

        let msg = {
          from: options.from,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html
        };
        msg['h:Reply-To'] = options.replyTo;

        let params = {
          Destination: { 
            ToAddresses: [
              msg.to
            ],
            BccAddresses: [
              msg['h:Reply-To']
            ],
          },
          Message: { 
            Body: { 
              Html: {
                Charset: 'UTF-8',
                Data: msg.html
              },
              Text: {
                Charset: 'UTF-8',
                Data: msg.text
              }
            },
            Subject: {
              Charset: 'UTF-8',
              Data: msg.subject,
            }
          },
          Source: msg.from 
        };       

        const sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();
        
        return sendPromise.then((result)=> result)
          .catch((error)=>{
            if (error.code === "CredentialsError"){
              throw new Error('Please make sure, that you put AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to .env file!');
            }
            throw new Error(error.message);
          });      
      }
    };
  }
};
