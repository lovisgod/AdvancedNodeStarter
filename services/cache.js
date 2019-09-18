const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');

const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);
client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;
let useCache = false;
let hashKey = ''
mongoose.Query.prototype.cache = function(options = {}){
 useCache = true;
 hashKey = JSON.stringify(options.key || 'default');
 return this;
};

mongoose.Query.prototype.exec = async function() {
    const key = JSON.stringify(Object.assign({}, this.getQuery(), { 
        collection: this.mongooseCollection.name
    }));
    
    if (useCache == false ) {
        const result = await exec.apply(this, arguments);
        return result;    
    }else{
       // //see if we have a value from key in redis,
    const cacheValue = await client.hget(hashKey, key);
    console.log(hashKey)
    // if yes, return cache, 
    if (cacheValue) { 
        const doc = JSON.parse(cacheValue);
        return Array.isArray(doc) ? doc.map(d => new this.model(d))  : new this.model(doc);
    };
    // else perform the request and save it into redis
    const result = await exec.apply(this, arguments);
    client.hset(hashKey, key, JSON.stringify(result), 'EX', 10);
    return result;
    }
   
}

module.exports = {
    clearHash(hashKey) {
        client.del(JSON.stringify(hashKey));
    }
}