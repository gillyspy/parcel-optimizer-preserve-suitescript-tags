# parcel-optimizer-preserve-suitescript-tags

## install
`npm install parcel-optimizer-preserve-suitescript-tags --save-dev`;

## Usage
- create a `.parcelrc` like the one in this project
- configure parcel as normal
- configure the glob pattern to only match potential suitescript files 

## Why
When building suitescripts via parcel it will often strip off the required comments at the top. This attempts to 
restore that once per built file. 
Note: there are combinations in parcel where this won't happen



# Features
- restores any stripped JSDoc tag comment that is required by netsuite but removed by parcel
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
