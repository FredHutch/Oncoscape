var util = require('util'),
	async = require('async'),
	path = require('path'),
	buffer = require('buffer'),
	fs = require('fs'),
	jszip = require('./jszip');

function EasyZip(){
	jszip.JSZip.apply(this,arguments);
}

util.inherits(EasyZip, jszip.JSZip);

function toArrayBuffer(buffer) {
    var ab = new ArrayBuffer(buffer.length),
    	view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return ab;
}

EasyZip.prototype.addFile = function(file,filePath,callback){
	var datas = [],
		me = this,
		rs = fs.createReadStream(filePath);
	
	rs.on('data',function(data){
		datas.push(data);
	})
	
	rs.on('end',function(){
		var buf = Buffer.concat(datas);
		me.file(file, toArrayBuffer(buf),{base64:false, binary: true});
		callback();
	})
}

EasyZip.prototype.batchAdd = function(files,callback) {
	var me = this;
	async.each(files,function(item,callback){
		var source = item.source,
			target = item.target,
			appender = me,
			folder = item.folder,
			fileName = path.basename(target),
			dirname = path.dirname(target);
		
		if(dirname!='.'){
			appender = me.folder(dirname);
		}
		
		if(source != null && source.trim()!=''){
			appender.addFile(fileName,source,function(){
				callback();
			});
		}else{
			//if no source ,make the target as folder
			me.folder(target);
			callback();
		}
		
	},function(){
		callback(me);
	});
}


EasyZip.prototype.zipFolder = function(folder,callback) {
	if(!fs.existsSync(folder)){
		callback(new Error('Folder not found'),me);
	}else{
		var me = this,
			files = fs.readdirSync(folder),
			rootFolder = path.basename(folder),
			zips = [],
			file,stat,targetPath,sourcePath;
		
		while(files.length > 0){
			file = files.shift();
			sourcePath = path.join(folder,file);
			targetPath = path.join(rootFolder,file);
			stat = fs.statSync(sourcePath);
			
			if(stat.isFile()){
				zips.push({
					target : targetPath,
					source : sourcePath
				});
			}else{
				zips.push({
					target : targetPath
				});
				
				//join the path
				async.map(fs.readdirSync(sourcePath),function(item,callback){
					callback(null,path.join(file,item));
				},function(erro,result){
					files = files.concat(result);
				});
				
			}
		}
		
		me.batchAdd(zips,function(){callback(null,me)});
		
	}
}

EasyZip.prototype.writeToResponse = function(response,attachmentName){
	attachmentName = attachmentName || new Date().getTime();
	attachmentName += '.zip';
	response.setHeader('Content-Disposition', 'attachment; filename="' +attachmentName + '"');
	response.write(this.generate({base64:false,compression:'DEFLATE'}),"binary");
	response.end();
}

EasyZip.prototype.writeToFile = function(filePath,callback){
		var data = this.generate({base64:false,compression:'DEFLATE'});
		fs.writeFile(filePath, data, 'binary',callback);
}

EasyZip.prototype.writeToFileSycn = function(filePath){
	  var data = this.generate({base64:false,compression:'DEFLATE'});
	  fs.writeFileSync(filePath, data, 'binary');
}

EasyZip.prototype.clone = function() {
   var newObj = new EasyZip();
   for (var i in this) {
      if (typeof this[i] !== "function") {
         newObj[i] = this[i];
      }
   }
   return newObj;
}

exports.EasyZip = EasyZip;
