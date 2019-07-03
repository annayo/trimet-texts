const AWS = require('aws-sdk');
const fetch = require('isomorphic-fetch');
const moment = require('moment');

const sns = new AWS.SNS();
const appId = '0BAC5803E13E9DCE2A9EDE2D3';

exports.handler = async (event, context) => {
  const topicArn = process.env.TOPIC_ARN;
  const endpoint = 'anna@stackery.io';

  const stopId = 7747;
  const route = 8;

  const subscriptionsResults = await sns.listSubscriptionsByTopic({ TopicArn: topicArn }).promise();
  const subscriptions = subscriptionsResults.Subscriptions;

  if (!subscriptions.find(subscription => subscription.Endpoint === endpoint)) {
    await sns.subscribe({
      Protocol: 'email',
      TopicArn: topicArn,
      Endpoint: endpoint,
      Attributes: {
        FilterPolicy: JSON.stringify({
          stopId: [stopId],
          route: [route],
          isScheduledTime: [true]
        })
      }
    }).promise();
  }

  const url = `https://developer.trimet.org/ws/v2/arrivals?locIDs=${stopId}&appID=${appId}`;
  const options = {
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'GET'
  };

  const fetchArrivals = await fetch(url, options);
  const fetchArrivalsResults = await fetchArrivals.json();
  const arrivalsByRoute = fetchArrivalsResults.resultSet.arrival.filter(arrival => arrival.route === route && !arrival.dropOffOnly);

  await Promise.all(arrivalsByRoute.map(arrival => (
    sns.publish({
      Subject: `Bus ${arrival.route} comin up ${moment().to(new Date(arrival.estimated))}!`,
      Message: `Bus ${arrival.route} comin up ${moment().to(new Date(arrival.estimated))}!`,
      TopicArn: topicArn,
      MessageAttributes: {
        'stopId': {
          DataType: 'Number',
          StringValue: `${stopId}`
        },
        'route': {
          DataType: 'Number',
          StringValue: `${route}`
        },
        'isScheduledTime': {
          DataType: 'String',
          StringValue: 'true'
        }
      }
    }).promise()
  )));
};
