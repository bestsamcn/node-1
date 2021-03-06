
var UserModel = require('../mongo/schema/User').UserModel;
var SensitiveModel = require('../mongo/schema/Sensitive').SensitiveModel;
var AccessLogModel = require('../mongo/schema/AccessLog').AccessLogModel;
var fs = require('fs');
var rootPath = process.cwd();

var $$ = require('../utilTools');

//更新个人信息
var _globalConfig = require('../config');
var _getMe = function(app){
	app.use(function(req,res,next){
		app.locals.globalConfig = _globalConfig;
		if (req.session.isLogin) {
	        UserModel.findOne({ _id: req.session.user._id }, function(e, d) {
	            if (d) {
	                req.session.user = d;
	                req.session.save();
	                res.locals.session = req.session;
	                return next()
	            }
	        });
	    }else{
	    	//如果用户没登录，需要预留session作为判断，否则res.locals.session = undefined
	    	res.locals.session = req.session;
	        next()
	    }
	});
}

//管理员拦截器
var _allowAdminOnly = function(req,res,next){
	//如果头部没添加authSecret，或者authsecret不等于配置的密钥就返回
	if ((req.get('authSecret') && req.get('authSecret') === globalConfig.authSecret) || (req.session.isLogin && req.session.user.userType > 0)) {
	 	next();
	}else{
		res.sendStatus(401);
        res.end();
        return;
	}
}

//获取所有管理员id中间件
var _getAllAdmins = function(req,res,next){
    UserModel.find({ userType: {$in:[1,2]}}, function(ferr, fcol) {
    	req.session.adminIdList = [];
        if (ferr) {
            return next()
        }
        for(var i =0 ; i< fcol.length; i++){
        	req.session.adminIdList.push(fcol[i]._id.toString())
        }
        req.session.save();
        next();
    });
};

//登录拦截器
var _loginInterceptor = function(req,res,next){
	if(!req.session.isLogin){
		res.send(404);
		res.end();
		return;
	}
	next();
}

//获取铭感词汇列表
var _sensitiveInterceptor = function(req,res,next){
	SensitiveModel.find({},function(ferr,fcol){
		global.sensitiveList = [];
		if(ferr){
			next(ferr.code);
			return;
		}
		var sensitiveListString = [];
		for(var i = 0 ; i<fcol.length; i++){
			//全局保留
			global.sensitiveList.push(fcol[i].keywords);
			//写进敏感词库
			if(i === fcol.length-1){
				sensitiveListString.push(fcol[i].keywords);
			}else{
				sensitiveListString.push(fcol[i].keywords+'\n');
			}
			
			
		}
		// fs.writeFileSync(rootPath+'/keywordFilter/config/keyword.txt',sensitiveListString.join(''),{flags:'w+'});
		next();
	});
}

//判断是否包含敏感词
var _isIncludeSensitive = function(){
	var b = false;
	if(arguments.length < 1){
		return b;
	}
	for(var i=0; i< arguments.length; i++){
		for(var j = 0 ; j<global.sensitiveList.length;j++){
			if(arguments[i].indexOf(global.sensitiveList[j]) !== -1){
				b = true;
				break;
			}
		}
	}
	return b;
}

//用户访问日志
var _userAccessLogs = function(req,res,next){
	var _url = req.path;
	if(!req.session.isLogin || req.session.user.userType !==0 || _url.indexOf('.') !== -1 || /^\/api/.test(_url)){
		return next();
	}
	var _ip = $$.getClientIp(req).match(/\d+\.\d+\.\d+\.\d+/)[0];

	AccessLogModel.create({
		member:req.session.user._id,
		accessIp:_ip,
		accessUrl:_url
	},function(err,doc){
		if(err){
			return next(err);
		}
		next();
	});
}

exports.getMe = _getMe;
exports.getAllAdmins = _getAllAdmins;
exports.loginInterceptor = _loginInterceptor;
exports.sensitiveInterceptor = _sensitiveInterceptor;
exports.isIncludeSensitive = _isIncludeSensitive;
exports.userAccessLogs = _userAccessLogs;
exports.allowAdminOnly = _allowAdminOnly;

//初始化会员列表
