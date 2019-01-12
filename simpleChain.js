/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');


/* ===== Persist data with LevelDB ============================
|  Learn more: level: https://github.com/Level/level          |
|  ==========================================================*/

const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);


/* ============================================================
|  import functions from levelSandbox.js                      |
|  ============================================================*/

const levelSandbox = require('./levelSandbox');
let addLevelDBData = levelSandbox.addLevelDBData;
let getLevelDBData = levelSandbox.getLevelDBData;
let addDataToLevelDB = levelSandbox.addDataToLevelDB;


/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block {
  constructor(data) {
    this.hash = "",
    this.height = 0,
    this.body = data,
    this.time = 0,
    this.previousBlockHash = ""
  };
};

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {
  constructor() {
    this.chain = [];
    this.addBlock(new Block("First block in the chain - Genesis block"));
  }

  // Add new block
  addBlock(newBlock) {
    // Block height
    newBlock.height = this.chain.length;
    // UTC timestamp
    newBlock.time = new Date().getTime().toString().slice(0,-3);
    // previous block hash
    if(this.chain.length>0) {
      newBlock.previousBlockHash = this.chain[this.chain.length-1].hash;
    }
    // Block hash with SHA256 using newBlock and converting to a string
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
    // Adding block object to chain
    this.chain.push(newBlock);
    // Adding block object to levelDB
    addLevelDBData(db, newBlock.height, newBlock).then(function(res) {
      // console.log('This block has been added to levelDB: ');
      // console.log(res);
    });
  }

  // Get block height
  getBlockHeight() {
    let lastIndex = this.chain.length - 1;
    let returnedBlockHeight = getLevelDBData(db, lastIndex);
    returnedBlockHeight.then(function(res) {
      return res;
    });
  }

  // get block
  getBlock(blockHeight) {
    return new Promise(function(resolve, reject) {
      let returnedBlock = levelSandbox.getLevelDBData(db, blockHeight);
      returnedBlock.then(function(res) {
        resolve(res);
      });
    });
  }

  // validate block
  validateBlock(blockHeight) {
    // get block object
    let block = this.getBlock(blockHeight);
    block.then(function(res) {
      // console.log(typeof(res));
      // console.log('res :' + JSON.stringify(res));
      let block_dict = JSON.parse(res);
      // get block hash
      let blockHash = SHA256(block_dict.hash);
      // console.log('blockHash: ' + blockHash)
      // remove block hash to test block integrity
      block.hash = '';
      // generate block hash
      let validBlockHash = SHA256(JSON.stringify(block)).toString();
      // console.log('validBlockHash :' + validBlockHash);
      // Compare
      if (blockHash===validBlockHash) {
        return true;
      } else {
        console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
        return false;
      }
    });
  }

 // Validate blockchain
  validateChain() {
    let errorLog = [];
    for (var i = 0; i < this.chain.length-1; i++) {
      // validate block
      if (!this.validateBlock(i))errorLog.push(i);
      // compare blocks hash link
      let blockHash = this.chain[i].hash;
      let previousHash = this.chain[i+1].previousBlockHash;
      if (blockHash!==previousHash) {
        errorLog.push(i);
      }
    }
    if (errorLog.length>0) {
      console.log('Block errors = ' + errorLog.length);
      console.log('Blocks: '+errorLog);
    } else {
      console.log('No errors detected');
    }
  }
}


/* ======================================================================
|  COMMAND LINES TO CREATE BLOCKCHAIN AND SAVE 10 BLOCKS IN LEVELDB     |
|  =====================================================================*/

// clear "chaindata" folder if exists
const fs = require('fs');
const path = require('path');
const dir = path.join(path.dirname(fs.realpathSync(__filename)), './chaindata');

const exec = require('child_process').exec;
exec('rm -Rf dir');


// create blockchain with Genesis block and additional 10 blocks and save to levelDB
let blockchain = new Blockchain();

for (var i = 0; i <= 10; i++) {
  blockchain.addBlock(new Block("test data "+i));
}


/* ============================================================
|  COMMAND LINES TO INTERACT WITH BLOCKCHAIN LEVELDB DATA     |
|  ============================================================*/

// blockchain.getBlock(2);

// blockchain.validateBlock(2);

// blockchain.getBlockHeight();

// blockchain.validateChain();


