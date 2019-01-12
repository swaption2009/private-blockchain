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

class Block{
  constructor(data) {
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
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
      console.log('This block has been added to levelDB: ');
      console.log(res);
    });
  }

  // Get block height
    getBlockHeight() {
      let lastIndex = this.chain.length - 1;
      let returnedBlockHeight = getLevelDBData(db, lastIndex);
      returnedBlockHeight.then(function(res) {
        return res;
      });
    };

    // get block
    getBlock(blockHeight) {
      // return object as a single string
      let returnedBlock = levelSandbox.getLevelDBData(db, blockHeight);
      returnedBlock.then(function(res) {
        return res;
      });
    }

    // validate block
    validateBlock(blockHeight) {
      // get block object
      let block = this.getBlock(blockHeight);
      // get block hash
      let blockHash = block.hash;
      // remove block hash to test block integrity
      block.hash = '';
      // generate block hash
      let validBlockHash = SHA256(JSON.stringify(block)).toString();
      // Compare
      if (blockHash===validBlockHash) {
          return true;
        } else {
          console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
          return false;
        }
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


// validate a block using block height (or leveldb key) from levelDB
// blockchain.getBlock(2);
// blockchain.validateBlock(2);
/*
Value = {"hash":"b830b838a173883204dd8848f01a4ed26013cff64a7f92555ad554ac19ff5678",
         "height":2,"body":"test data 1","time":"1547194102",
         "previousBlockHash":"f8552f1c93f53f4eb0abc0b6a44885d70f21d6a5fcd1a56b0ed77dfec13c041b"}
*/


// Get the last block from levelDB
// blockchain.getBlockHeight();
/*
Value = {"hash":"74325bb4335c785cf12e7a02319067736d11f240be1b3e76dfcda3e77a7b6a80",
         "height":11,"body":"test data 10","time":"1547195321",
         "previousBlockHash":"d174c93b81990df2880d0baef6fa96e8d533dfd6889c431ab25c84c034af6b29"}
*/

// blockchain.validateChain;


