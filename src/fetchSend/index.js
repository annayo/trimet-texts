const AWS = require('aws-sdk');
const sns = new AWS.SNS();
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
};
