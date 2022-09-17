/**
 * @description Examines the asset for a jsdoc header at the very beginning of the file.
 * if it exists and it contains NApiVersion 2 tag then:
 * - re-include it in the final version
 * - update the sourcemap lines
 * [extraction](//https://regex101.com/r/5K4f2H/2) example here.
 * @todo work with non-string buffers
 */
const { Optimizer } = require('@parcel/plugin');
const { countLines } = require('@parcel/utils');
const SourceMap = require('@parcel/source-map').default;
const fs = require('node:fs');

const hasHeaderRegex = /\/\*\*[\s\S]+@NApiVersion[\s\S]+?\*\//;
const beginWithHeaderRegex = /^\/\*\*[\s\S]+@NApiVersion[\s\S]+?\*\//;
const extractHeaderRegex = /[\s\S]*([/][*][*][\s\S]*?@NApiVersion 2[\s\S]*?[*][/])[\s\S]*/;

/**
 * @description Reads the file Synchronously and returns decoded string.
 * @private
 * @param assetFile
 * @returns {string}
 * @throws {Error} When reading file is not possible.
 * @example //
 */
function getSource(assetFile) {
  try {
    return fs.readFileSync(assetFile, { encoding: 'utf8' });
  } catch (e) {
    // weird if we cannot find the file but we'll let it go and do nothing
    return '';
  }
}

/**
 * @description Extracts the Header from the code.
 * @private
 * @param {string} source
 * @returns {string} The extracted header or a blank string;.
 * @example //
 */
const createHeader = (source) => (source && hasHeaderRegex.test(source) ? source.replace(extractHeaderRegex, '$1') : '');

/**
 * @description Writes a message.
 * @private
 * @param {object} options
 * @param {string} options.contents
 * @param {object} options.map
 * @returns {options}
 * @example //
 */
function finish({ contents, map }) {
  process.stdout.write(`ℹ️ Finished preserve-suitescript-tags\n`);
  return { contents, map };
}

module.exports = new Optimizer({
  /**
   * @description Asynchronously applies the changes for header and map file to each input.
   * @param {object} options Options object.
   * @param {object} options.bundle
   * @param {string} options.contents
   * @param {string} options.map
   * @param options.options
   * @returns {{finish()}}
   * @example //
   */
  async optimize({ bundle, contents, map, options }) {
    process.stdout.write(`ℹ️ Processing preserve-suitescript-tags\n`);

    // only work with string buffers for now
    if (typeof contents !== 'string') return finish({ contents, map });

    let pathToUse = '';
    let header;
    let tempContents = '';
    const iifeToInject = '(function(){})()';

    // contents often does not contain the header we need but check first
    if (beginWithHeaderRegex.test(contents)) {
      process.stdout.write(`ℹ️ Found Header in contents\n`);
      header = '';
    }

    // check the original source files
    bundle.traverse((node) => {
      if (node.type !== 'asset') return;

      const asset = node.value;
      const filePath = [asset.filePath].flat();
      [pathToUse] = filePath;
      let sourceCode;

      while ( header === '' && filePath.length) {
        const path = filePath.shift();
        sourceCode = getSource(path);
        if (sourceCode) {
          header = createHeader(sourceCode);
          pathToUse = path;
        }

        if (header) {
          process.stdout.write(`ℹ️ Found Header in ${path}\n`);
          tempContents = contents.replace(header, iifeToInject);
        }
      }
    });

    const trimmed = pathToUse.replace(/^.*SuiteScripts\/?(.*)$/, '/SuiteScripts/$1');

    // remove indentations from header
    const finalHeader = `${header.replace(/^[ ]+[*]/gm, ' *')}\n`;

    process.stdout.write(`ℹ️ Setting sourceMappingURL\n`);
    const finalContents = finalHeader + tempContents.replace(/sourceMappingURL.*\n/, `sourceMappingURL=${trimmed}.map\n`);

    // update and return optimized content
    if (options.sourceMaps) {
      const newMap = new SourceMap(options.projectRoot);
      const mapBuffer = map.toBuffer();
      const lineOffset = countLines(header) - 1;
      newMap.addBufferMappings(mapBuffer, lineOffset);

      return finish({ contents: finalContents, map: newMap });
    }

    return finish({ contents: finalContents, map });
  }
});
