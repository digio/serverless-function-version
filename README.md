# Serverless Function Version Plugin

[![serverless][sls-image]][sls-url]
[![npm package][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![Downloads][downloads-image]][npm-url]

> A Serverless plugin to use a *function version* within an environment variable.

## Motivation

There are circumstances where you may need to reference a function's version within an environment variable.
For example, when using CodeDeploy, the pre/post-traffic Lambdas need to know which version of a function to test.

Serverless produces a `AWS::Lambda::Version` resource - which contains the Lambda version reference - using
a dynamically generated name. This makes it impossible to reference this resource at configuration time
within the Serverless config file.

This plugin solves the problem by finding the `AWS::Lambda::Version` resource after the CloudFormation template
has been generated, then including a reference to the resource as the variable-value.

## Installation

```
npm install --save-dev serverless-function-version
```

Add the plugin to serverless.yml:

```yaml
plugins:
  - serverless-function-version
```

**Note**: Node 10.x or higher runtime required.

## Usage

Inside your Serverless config, include this plugin.

```yaml
plugins:
  - serverless-function-version    
```

Then you can use the following syntax to get the function version:

- `${functionVersionArn:...}` is replaced with the full ARN of the function, including the version number
- `${functionVersion:...}` is replaced with just the version number

```yaml
# serverless.yml

 functions: 
   getPhone: {...}, # This is the function we want to reference
   getPhonePreDeployHook:
    handler: 'src/getPhone/hooks.pre'
    environment:
      FUNCTION_TO_TEST: '${functionVersionArn:GetPhoneLambdaFunction}', # This is converted to the ARN including the VERSION at deployment-time
      FUNCTION_VERSION_ONLY: '${functionVersion:GetPhoneLambdaFunction}'
```

**NOTE**: The `${functionVersion*}` variables can _only_ be used within the `provider.environment` section,
or within a function's `environment` section. 

[sls-image]: http://public.serverless.com/badges/v3.svg
[sls-url]: http://www.serverless.com
[npm-image]: https://img.shields.io/npm/v/serverless-function-version.svg
[npm-url]: http://npmjs.org/package/serverless-function-version
[travis-image]: https://travis-ci.org/digio/serverless-function-version.svg?branch=master
[travis-url]: https://travis-ci.org/digio/serverless-function-version
[coveralls-image]: https://coveralls.io/repos/github/digio/serverless-function-version/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/digio/serverless-function-version?branch=master
[downloads-image]: https://img.shields.io/npm/dm/serverless-function-version.svg
