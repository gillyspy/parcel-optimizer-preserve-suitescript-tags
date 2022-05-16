/**
 * @description examines the asset for a jsdoc header at the very beginning of the file.
 * if it exists and it contains NApiVersion 2 tag then:
 * - re-include it in the final version
 * - update the sourcemap lines
 * [extraction](//https://regex101.com/r/5K4f2H/2) example here
 * @todo work with non-string buffers
 */
const { Optimizer } = require('@parcel/plugin');
const {
  countLines,
} = require('@parcel/utils');
const SourceMap = require('@parcel/source-map').default;
const fs = require('fs');

function getSource(assetFile){
  try{
    return fs.readFileSync(assetFile, { encoding : 'utf8' });
  }catch(e){
    // weird if we cannot find the file but we'll let it go and do nothing
  }
}

function hasHeader(source){
  return /@NApiVersion\s/i.test(source);
}

function createHeader(source) {
  if(!source) return '';

  const extractHeaderRegex=/^(\/\*\*(.*\s)+\*\/)(.*\s*)+/;

  return hasHeader(source) ? source.replace(extractHeaderRegex,'$1') : '' ;
}

module.exports = new Optimizer({
  async optimize({
    bundle,
    contents,
    map,
    options
  }) {
    // only work with string buffers for now
    if( typeof contents !== 'string') return { contents, map };

    // contents often does not contain the header we need but check first
    if( hasHeader(contents) ) return {contents,map};

    let header = '';

    // check the original source files
    if(!header){
      bundle.traverse( node => {
        if (node.type !== 'asset') {
          return;
        }
        const asset = node.value;
        const filePath = [asset.filePath].flat();
        let sourceCode;
        while( !header && filePath.length ){
          console.log({path});
           sourceCode = getSource(path);
        }

        if(sourceCode && !header)
          header = createHeader( sourceCode ) + '\n';
      });
    }

    // still no header then nothing to do
    if( !header )
      return { contents, map };

    // update and return optimized content
    if (options.sourceMaps) {
      const newMap = new SourceMap(options.projectRoot);
      const mapBuffer = map.toBuffer();
      const lineOffset = countLines(header) - 1;
      newMap.addBufferMappings(mapBuffer, lineOffset);

      return { contents: header + contents, map: newMap };
    }

    return { contents : header + contents, map };
  }
});
