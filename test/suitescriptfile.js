/**
 * @fileoverview some file
 * @file SuiteScripts/somedir/somefile.js
 * @description a description
 * @NApiVersion 2.1
 * @module if you please
 * @NModuleScope SameAccount
 * @author Gerald Gillespie <gerald.gillespie@inscio.com>
 * @copyright Inscio, LLC 2022
 */

const {helloWorld} = require('./helloWorld');

define(['N/log'], (log)=>{
  return {helloWorld };
});
