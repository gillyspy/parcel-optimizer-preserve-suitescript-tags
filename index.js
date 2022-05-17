/**
 * @description examines the asset for a jsdoc header at the very beginning of the file.
 * if it exists and it contains NApiVersion 2 tag then:
 * - re-include it in the final version
 * - update the sourcemap lines
 * [extraction](//https://regex101.com/r/5K4f2H/2) example here
 * @todo work with non-string buffers
 */
const { Optimizer } = require('@parcel/plugin');
const {  countLines } = require('@parcel/utils');
const SourceMap = require('@parcel/source-map').default;
const fs = require('fs');
const hasHeaderRegex = /\/\*\*[\s\S]+@NApiVersion[\s\S]+?\*\//;
const extractHeaderRegex = /^(\/\*\*[\s\S]+@NApiVersion[\s\S]+?\*\/)[\s\S]+/;

function getSource(assetFile){
  try{
    return fs.readFileSync(assetFile, { encoding : 'utf8' });
  }catch(e){
    // weird if we cannot find the file but we'll let it go and do nothing
  }
}


const createHeader = (source)=> (source && hasHeaderRegex.test(source) ? source.replace(extractHeaderRegex,'$1') : '' );


function finish({ contents,map}){
  process.stdout.write(`ℹ️ Finished preserve-suitescript-tags`);
  return {contents,map};
}

module.exports = new Optimizer({
  async optimize({
    bundle,
    contents,
    map,
    options,
    getSourceMapReference
  }) {
    process.stdout.write(`ℹ️ Processing preserve-suitescript-tags`);


    // only work with string buffers for now
    if( typeof contents !== 'string') return finish({ contents, map });

    let pathToUse = '';
    let header = '';

    // contents often does not contain the header we need but check first
    if( hasHeaderRegex.test(contents) ) {
       process.stdout.write(`ℹ️ Found Header in contents\n`);
       header = '\n';
    }

    // check the original source files

      bundle.traverse( node => {
        if (node.type !== 'asset') return;

        const asset = node.value;
        const filePath = [asset.filePath].flat();
        [pathToUse] = filePath;
        let sourceCode;
        while( !header && filePath.length ) {
          const path = filePath.shift();
          sourceCode = getSource(path);
          if (sourceCode){
            header = createHeader(sourceCode) + '\n';
            pathToUse = path;
          }

          if(header) process.stdout.write(`ℹ️ Found Header in ${path}`)
        }
      });


    // still no header then nothing to do

    const trimmed = pathToUse.replace(/^.*SuiteScripts\/?(.*)$/,'/SuiteScripts\/$1')

    let url = await getSourceMapReference(map);

    contents = contents.replace(/sourceMappingURL.*\n/,`sourceMappingURL=${trimmed}.map\n`);

    console.log({pathToUse, trimmed});
    // update and return optimized content
    if (options.sourceMaps) {
      const newMap = new SourceMap(options.projectRoot);
      const mapBuffer = map.toBuffer();
      const lineOffset = countLines(header) - 1;
      newMap.addBufferMappings(mapBuffer, lineOffset);

      return  finish({ contents: header + contents, map: newMap });
    }


    return finish({ contents : header + contents, map });
  }
});
/**
 * @description examines the asset for a jsdoc header at the very beginning of the file.
 * if it exists and it contains NApiVersion 2 tag then:
 * - re-include it in the final version
 * - update the sourcemap lines
 * [extraction](//https://regex101.com/r/5K4f2H/2) example here
 * @todo work with non-string buffers
 */
const { Optimizer } = require('@parcel/plugin');
const {  countLines } = require('@parcel/utils');
const SourceMap = require('@parcel/source-map').default;
const fs = require('fs');
const hasHeaderRegex = /\/\*\*[\s\S]+@NApiVersion[\s\S]+?\*\//; 
const extractHeaderRegex = /^(\/\*\*[\s\S]+@NApiVersion[\s\S]+?\*\/)[\s\S]+/;

function getSource(assetFile){
  try{
    return fs.readFileSync(assetFile, { encoding : 'utf8' });
  }catch(e){
    // weird if we cannot find the file but we'll let it go and do nothing
  }
}

const createHeader = (source)=> (source && hasHeaderRegex.test(source) ? source.replace(extractHeaderRegex,'$1') : '' );


function finish({ contents,map}){
  process.stdout.write(`ℹ️ Finished preserve-suitescript-tags`);
  return {contents,map};
}

module.exports = new Optimizer({
  async optimize({
    bundle,
    contents,
    map,
    options,
    getSourceMapReference
  }) {
    process.stdout.write(`ℹ️ Processing preserve-suitescript-tags`);

    // only work with string buffers for now
    if( typeof contents !== 'string') return finish({ contents, map });

    // contents often does not contain the header we need but check first
    if( hasHeaderRegex.test(contents) ) {
       process.stdout.write(`ℹ️ Found Header in contents\n`);
      return finish({ contents, map });
    }

    let header = '';
    let pathToUse = '';

    // check the original source files
    if(!header){
      bundle.traverse( node => {
        if (node.type !== 'asset') return;
        if (header !== '') return;

        const asset = node.value;
        const filePath = [asset.filePath].flat();
        let sourceCode;
        while( !header && filePath.length ) {
          const path = filePath.shift();
          sourceCode = getSource(path);
          if (sourceCode){
            header = createHeader(sourceCode) + '\n';
            pathToUse = path; 
          }

          if(header) process.stdout.write(`ℹ️ Found Header in ${path}`)
        }
      });
    }

    // still no header then nothing to do

    const trimmed = pathToUse.replace(/^.*SuiteScripts\/?(.*)$/,'/SuiteScripts\/$1')
    
    let url = await getSourceMapReference(map);
    
    contents = contents.replace(/sourceMappingURL.*\n/,`sourceMappingURL=${trimmed}.map\n`);
      
    
    // update and return optimized content
    if (options.sourceMaps) {
      const newMap = new SourceMap(options.projectRoot);
      const mapBuffer = map.toBuffer();
      const lineOffset = countLines(header) - 1;
      newMap.addBufferMappings(mapBuffer, lineOffset);

      return  finish({ contents: header + contents, map: newMap });
    }      


    return finish({ contents : header + contents, map });
  }
});
