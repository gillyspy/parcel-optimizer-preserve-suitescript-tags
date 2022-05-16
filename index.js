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
const extractHeaderRegex = /^(\/\*\*[\s\S]+@NApiVersion[\s\S]+\*\/)[\s\S]+/;

function getSource(assetFile){
  try{
    return fs.readFileSync(assetFile, { encoding : 'utf8' });
  }catch(e){
    // weird if we cannot find the file but we'll let it go and do nothing
  }
}

const createHeader = (source)=> (source && extractHeaderRegex.test(source) ? source.replace(extractHeaderRegex,'$1') : '' );


function finish({ contents,map}){
  process.stdout.write(`ℹ️ Finished preserve-suitescript-tags`);
  return {contents,map};
}

module.exports = new Optimizer({
  async optimize({
    bundle,
    contents,
    map,
    options
  }) {
    process.stdout.write(`ℹ️ Processing preserve-suitescript-tags`);

    // only work with string buffers for now
    if( typeof contents !== 'string') return finish({ contents, map });

    // contents often does not contain the header we need but check first
    if( extractHeaderRegex.test(contents) ) {
       process.stdout.write(`ℹ️ Found Header in contents\n`);
      return finish({ contents, map });
    }

    let header = '';

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
          if (sourceCode)
            header = createHeader(sourceCode) + '\n';

          if(header) process.stdout.write(`ℹ️ Found Header in ${path}`)
        }
      });
    }

    // still no header then nothing to do
    if( !header )
      return finish({ contents, map });

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
