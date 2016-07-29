/**
 * Copyright 2016 IBM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
/**
 * Licensed Materials - Property of IBM
 * © Copyright IBM Corp. 2016
 */

/**
 * Simple asset management use case where authentication is performed
 * with the help of TCerts only (use-case 1) or attributes only (use-case 2).*/

var hfc = require('../..');
var util = require('util');
var fs = require('fs');

//var filename = "tlsca.pem";
var filename = "blockchain-service-root.pem";
//var filename = "DigiCertCA.crt";
//var filename = "blockchain.ibm.com.pem";
//var filename = "blockchain-ca-cert.crt";
//var filename = "blockchain-cert.pem";
//var filename = "blockchain-key.pem";

function getTestChain(name) {
    name = name || "testChain";
    var chain = hfc.newChain(name);
    chain.setKeyValStore(hfc.newFileKeyValStore('/tmp/keyValStore'));
    //chain.setECDSAModeForGRPC(true);
    chain.setECDSAModeForGRPC(false);
    if (fs.existsSync(filename)) {
        console.log("Using certificate:", filename);
        var pem = fs.readFileSync(filename);
        //chain.setMemberServicesUrl("grpcs://015f743f-1de1-4b37-bcda-2fbad8db56e9_ca.blockchain.ibm.com:30304", { pem: pem, hostnameOverride: 'tlsca' });
        //chain.setMemberServicesUrl("grpcs://015f743f-1de1-4b37-bcda-2fbad8db56e9_ca.blockchain.ibm.com:30304", {});
        chain.setMemberServicesUrl("grpcs://5c77a7b3-7c9b-441c-b61c-63b9e0e00a57_ca.dev.blockchain.ibm.com:30304", { pem: pem});
    } else {
        chain.setMemberServicesUrl("grpc://localhost:50051");
    }
    //chain.addPeer("grpc://localhost:30303");

    //
    // Set the chaincode deployment mode to either developent mode (user runs chaincode)
    // or network mode (code package built and sent to the peer).
    //
    var mode = process.env.DEPLOY_MODE;
    console.log("$DEPLOY_MODE: " + mode);
    if (mode === 'dev') {
        chain.setDevMode(true);
    } else {
        chain.setDevMode(false);
    }
    return chain;
}

exports.getTestChain = getTestChain;
