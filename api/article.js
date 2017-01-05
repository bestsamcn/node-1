var express = require('express');
var router = express.Router();
var xss = require('xss');
var ueditor = require('ueditor');
var ArticleModel = require('../mongo/schema/Article').ArticleModel;
var allowAdminOnly = require('./index').allowAdminOnly;
var imageSize = require('image-size');
var gm = require('gm');
var crypto = require('crypto');

var globalConfig = require('../config');

/**
* 添加文章 /api/article/addArticle
* 输入 {category [number],isHot [number],author [_id],title [string],content [string]}
* 输出 100030=>内容不能为空, 0=>发布成功
*/
router.post('/addArticle', function(req,res){
	var _category = parseInt(req.body.category),
		_isHot = parseInt(req.body.isHot),
		_title = req.body.title,
		_content = xss(req.body.content);
	if(!_content){
		res.json({ retCode:100030, msg:'文章内容不能为空', data:null });
		res.end();
		return;
	}
	var reg = /(<|&lt;)img\s+src=(\"|&quot;)(.*\.(png|jpg|gif|bmp))\2\s+title=(\"|&quot;).*(\"|&quot;)\s+alt=\2(.*\.(png|jpg|gif|bmp))\2\/(>|&gt)/im;
	

	//我发现node代码不能使用/开头的绝对路径，node会以磁盘为根目录
	var _thumbnailDir = _content.match(reg)[3].substring(1);

	// var _thumbnailSize = imageSize(_thumbnailDir);
	// console.log(_thumbnailSize.width, _thumbnailSize.height)
	var md5 = crypto.createHash('md5');
	var _thumbnailName = md5.update(globalConfig.imageSecret+Date.now()).digest('hex')+'.png';
	var _thumbnail = 'public/ueditor/picture/'+_thumbnailName;
	gm(_thumbnailDir).thumb(150, 100, _thumbnail, 8, function(terr){
		if(terr){
			res.sendStatus(500);
			res.end();
			return;
		}
		ArticleModel.create({
			author:req.session.user._id,
			deliverTime:Date.now(),
			isHot:_isHot,
			category:_category,
			title:_title,
			content:_content,
			thumbnail:_thumbnail
		},function(cerr){
			if(cerr){
				res.sendStatus(500);
				res.end();
				return;
			}
			res.json({ retCode:0, msg:'文章发布成功', data:null });
			res.end();
			return;
		});
	});
});

/**
* 获取文章列表分页 /api/article/addArticle
* 输入 {pageIndex [number],pageSize [number],category [number]}
* 输出 100031=>无分类内容, 0=>发布成功
* 输出 {pageIndex [number],,pageSize [number],category [number],total [number],data [array]}
*/
router.get('/getArticleList',function(req,res){
	var _pageIndex = parseInt(req.query.pageIndex) - 1 || 0;
    var _pageSize = parseInt(req.query.pageSize) || 10;
    var _total = 0;
    ArticleModel.find().skip(_pageIndex * _pageSize).limit(_pageSize).sort({
        deliverTime: -1,
        isHot:-1
    }).exec(function(err, data) {
        if (err) {
            res.sendStatus(500);
            res.end();
            return;
        }
        ArticleModel.count({}, function(mcerr, mccol) {
            if (mcerr) {
                res.sendStatus(500);
                res.end();
                return;
            }
            _total = mccol || 0;
            res.json({
                retCode: 0,
                msg: '查询成功',
                data: data,
                pageIndex: _pageIndex + 1,
                pageSize: _pageSize,
                total: _total
            });
            res.end()
        });
    });
});


module.exports = router;