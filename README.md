# parcel-optimizer-preserve-suitescript-tags

## install
`npm install parcel-optimizer-preserve-suitescript-tags --save-dev`;

## Usage
- create a `.parcelrc` like the example below in this project
- configure parcel as normal
  - suggest `Chrome 72` as a SS2.1 compatible `package.json#targets.engine`
- configure the glob pattern to only match potential suitescript files 

## `.parcelrc`
```json
{
           "extends": "@parcel/config-default",
           "optimizers": {
             "*.js" : ["parcel-optimizer-preserve-suitescript-tags"]
           }
 }
 ```

## Why
When building suitescripts via parcel it will often strip off NetSuite's required JSDoc comments at the top. This 
attempts to restore that once per built file. 
Note: there are combinations in parcel where this won't happen.

## Typescript Tips
There is a "bug" in Typescript where comments before the import will get stripped off

This plugin will help with that. You can put the netsuite comments after the import!

It is expected that you will be using compiler settings similar to: 
```json
{
    "module": "AMD",
    "target": "es2019"
}
```

Parcel does not like AMD very much so because of this an noop is injected in the global scope: 
```javascript
(function(){})(); // injected;
define(["require","exports"],factory)
```

Without this parcel might export nothing. 

If you use a module format of "UMD" this wouldn't be an issue but whatevs.

# Features
- restores any stripped JSDoc tag comment that is required by netsuite but removed / moved by parcel
- will not duplicate the restored comment
- if you list your primary file such that it is read first by parcel bundler then this optimizer's task time will be 
  faster. 
- can be configured via .parcelrc
- Supports Parcel 2.x

# testing
Currently, the test is to just run `parcel build` task via npm.  
If you want to test your own files then modify the package.json#targets accordingly. 

# Ideas
- User configuration file support. e.g. include configured tags such as copyright.
- asynchronous examination of source files
- less strict regex

## possible options
- option to cancel build if missing
- permanent tag additions such as copyright or license
- option to cancel build based on NApiVersion value
- watch-out for repeating what eslint can do 
