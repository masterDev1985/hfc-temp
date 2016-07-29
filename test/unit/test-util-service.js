/**
 * Created by davery on 7/28/2016.
 */

/**
 * Simple asset management use case where authentication is performed
 * with the help of TCerts only (use-case 1) or attributes only (use-case 2).*/

var hfc = require('../..');
var util = require('util');
var fs = require('fs');

var TAG = "Test Setup:";

function getCredentials() {
    // information needed to connect to the peers
    var pem;
    var users;
    var peers;
    var ca;

// Obtain the certificate needed to establish a TLS connection to the peers
// TODO this should be obtained from the credentials themselves
    var filename = "blockchain-service-root.pem";
    console.log(TAG, 'loading certificate file from', filename);
    pem = fs.readFileSync(filename);

// Obtain manually given credentials from a files from a file
    try{
        var manual = JSON.parse(fs.readFileSync('mycreds.json', 'utf8'));
        peers = manual.credentials.peers;
        console.log(TAG, 'loading hardcoded peers');

        ca = manual.credentials.ca[0];
        console.log(TAG, 'loading hardcoded ca');

        users = null;																		//users are only found if security is on
        if(manual.credentials.users) users = manual.credentials.users;
        console.log(TAG, 'loading hardcoded users');
    }
    catch(e){
        console.error(TAG, 'Error - could not find hardcoded peers/users, this is okay if running in bluemix');
    }

    if(process.env.VCAP_SERVICES){															//load from vcap, search for service, 1 of the 3 should be found...
        var servicesObject = JSON.parse(process.env.VCAP_SERVICES);
        for(var i in servicesObject){
            if(i.indexOf('ibm-blockchain') >= 0){											//looks close enough
                if(servicesObject[i][0].credentials.error){
                    console.log('!\n!\n! Error from Bluemix: \n', servicesObject[i][0].credentials.error, '!\n!\n');
                    peers = null;
                    users = null;
                    process.error = {type: 'network', msg: 'Due to overwhelming demand the IBM Blockchain Network service is at maximum capacity.  Please try recreating this service at a later date.'};
                }
                if(servicesObject[i][0].credentials && servicesObject[i][0].credentials.peers){
                    console.log('overwritting peers, loading from a vcap service: ', i);
                    peers = servicesObject[i][0].credentials.peers;
                    ca = servicesObject[i][0].credentials.ca[0];
                    if(servicesObject[i][0].credentials.users){
                        console.log('overwritting users, loading from a vcap service: ', i);
                        users = servicesObject[i][0].credentials.users;
                    }
                    else users = null;														//no security
                    break;
                }
            }
        }
    }

    return {
        users: users,
        peers: peers,
        ca: ca,
        pem: pem,
    }
}

function getAddress(peer_creds, tls) {
    var header = 'grpc://';
    if(tls) header = 'grpcs://';
    return header + peer_creds.discovery_host + ':' + peer_creds.discovery_port
}


function getTestChain(name) {
    var creds = getCredentials();
    name = name || "testChain";
    var chain = hfc.newChain(name);
    chain.setKeyValStore(hfc.newFileKeyValStore('/tmp/keyValStore'));
    //chain.setECDSAModeForGRPC(true);
    chain.setECDSAModeForGRPC(false);

    // Load the CA and peers
    if (pem) {
        chain.setMemberServicesUrl(getAddress(creds.ca, true), { pem: creds.pem});
    } else {
        chain.setMemberServicesUrl(getAddress(creds.ca, false));
    }

    for (var index in creds.peers) {
        var peer = creds.peers[index];
        if(creds.pem) {
            chain.addPeer(getAddress(peer, true), {pem: creds.pem});
        } else {
            chain.addPeer(getAddress(peer, false));
        }
    }

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
