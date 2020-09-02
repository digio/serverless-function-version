// eslint-disable-next-line unicorn/filename-case
'use strict';

/**
 * This module allows us to get the full function ARN & VERSION number of a Lambda Function for use within environment variables.
 * This capability allows us to use the serverless-plugin-canary-deployments to have a pre/postTraffic Lambda call
 * the lambda-we-want-to-test, by passing an environment variable with the lambda-we-want-to-test's ARN and version number.
 * ``` js
 * // serverless.js
 * ...
 * functions: {
 *   getPhone: {...},   // This is the Lambda we want to test
 *   getPhonePreDeployHook: {
 *    handler: 'src/getPhone/hooks.pre',
 *    environment: {
 *      FUNCTION_TO_TEST: '${functionVersionArn:GetPhoneLambdaFunction}', // This converted to the ARN at deployment-time
 *    },
 * }
 * ```
 */

// Code is based on https://raw.githubusercontent.com/tea-v/mux/7a9ef690e108fbcf2951b1d28929faf6837397f0/plugins/serverless-update-function-versions.js

const FUNCTION_VERSION_ARN_VAR_KEY = 'functionVersionArn';
const FUNCTION_VERSION_VAR_KEY = 'functionVersion';

class UpdateFunctionVersions {
  constructor(serverless) {
    this.serverless = serverless;

    // From https://serverless.com/framework/docs/providers/aws/guide/plugins#custom-variable-types
    // Not really necessary, but provides a defined syntax for specifying that you wish to use this plugin
    this.variableResolvers = {
      [FUNCTION_VERSION_ARN_VAR_KEY]: async (x) => '[' + x + ']', // use identity function initially, as we cannot replace it until we get the compiledCloudFormationTemplate
      [FUNCTION_VERSION_VAR_KEY]: async (x) => '[' + x + ']', // use identity function initially, as we cannot replace it until we get the compiledCloudFormationTemplate
    };

    this.hooks = {
      'before:package:finalize': this.updateFunctionVersions.bind(this),
    };
  }

  updateFunctionVersions() {
    // By the time this function is called, the this.serverless.service has the compiledCloudFormationTemplate, which is
    // the key ingredient in getting things to work.
    const {
      provider: {
        compiledCloudFormationTemplate: { Resources: compiledResources },
      },
    } = this.serverless.service;

    // Get the entries in compliedResources, to make searching easier
    const compiledResourceEntries = Object.entries(compiledResources);

    // We need to iterate over the compiledResources, replacing the environment vars of any resource
    const resourcesToChange = Object.values(compiledResources).filter((resource) => resource.Properties.Environment);

    resourcesToChange.forEach((res) =>
      replaceFunctionVersionVarsWithVersion(res.Properties.Environment.Variables, compiledResourceEntries)
    );

    return resourcesToChange;
  }
}

function replaceFunctionVersionVarsWithVersion(obj = {}, compiledResourceEntries) {
  for (const prop in obj) {
    //console.log(prop, '=', obj[prop]);
    if (typeof obj[prop] === 'string' && obj[prop].indexOf('[' + FUNCTION_VERSION_ARN_VAR_KEY) === 0) {
      const functionName = obj[prop].match(/:(.+?)]$/)[1];
      // Update the key with the function version expression
      obj[prop] = getVersionedARN(compiledResourceEntries, functionName);
    } else if (typeof obj[prop] === 'string' && obj[prop].indexOf('[' + FUNCTION_VERSION_VAR_KEY) === 0) {
      const functionName = obj[prop].match(/:(.+?)]$/)[1];
      // Update the key with the function version expression
      obj[prop] = getVersion(compiledResourceEntries, functionName);
    }
  }
}

function getVersionedARN(compiledResourceEntries, arn) {
  const key = getFunctionKey(compiledResourceEntries, arn);
  return (
    key && {
      'Fn::Join': ['', [{ 'Fn::GetAtt': [arn, 'Arn'] }, ':', { 'Fn::GetAtt': [key, 'Version'] }]],
    }
  );
}

function getVersion(compiledResourceEntries, arn) {
  const key = getFunctionKey(compiledResourceEntries, arn);
  return key && { 'Fn::GetAtt': [key, 'Version'] };
}

function getFunctionKey(compiledResourceEntries, arn) {
  const [key] =
    compiledResourceEntries.find(
      ([
        ,
        // ignore key-element, just use value-element...
        {
          Properties: { FunctionName: { Ref } = {} },
          Type,
        },
      ]) => Ref === arn && Type === 'AWS::Lambda::Version'
    ) || [];

  return key;
}

module.exports = UpdateFunctionVersions;
