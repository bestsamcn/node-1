var express = require('express');
var router = express.Router();

/* GET home page. */
//权限管理
router.all('*', function(req, res, next) {
	if(!req.session.isLogin){
		res.send(404);
		return;
	}
	next()
});
router.get('/', function(req, res, next) {
	if(!req.session.isLogin){
		res.redirect('/');
	}
	res.render('tpl/user', {
		title: '用户中心',
		routerName: 'user'
	});
});
router.get('/modifyPassword', function(req, res, next) {
	if(!req.session.isLogin){
		res.redirect('/');
	}
	res.render('tpl/modifyPassword', {
		title: '修改密码',
		routerName: 'modifyPassword'
	});
});


module.exports = router;