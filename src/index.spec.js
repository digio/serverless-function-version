const Plugin = require('./index.js');
const slsConfig = require('../fixtures/serverless.correct.json');

function getConfig() {
  const config = JSON.parse(JSON.stringify(slsConfig)); // cheap deep copy

  // Mock the config.classes.Error class
  config.classes = {
    Error: Error,
  };

  return config;
}

describe('Serverless plugin function ARN resolution', () => {
  it('should return the right thing', () => {
    const config = getConfig();
    const plugin = new Plugin(config);

    const cfResources = plugin.updateFunctionVersions();

    expect(cfResources[0].Properties.Environment.Variables).toEqual({
      FUNCTION_ARN: {
        'Fn::Join': [
          '',
          [
            { 'Fn::GetAtt': ['WebHookLambdaFunction', 'Arn'] },
            ':',
            { 'Fn::GetAtt': ['WebHookLambdaFunctionJNcivYNMb6OXh1g6GW5oLreszRH5VgX9cPOshMeCro', 'Version'] },
          ],
        ],
      },
      FUNCTION_VERSION: {
        'Fn::GetAtt': ['WebHookLambdaFunctionJNcivYNMb6OXh1g6GW5oLreszRH5VgX9cPOshMeCro', 'Version'],
      },
    });
  });
});
