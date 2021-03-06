var _config = {
	host:'localhost',
	port:'80',
	redisConfig:{
		name: 'JSESSIONID',
	    secret: 'node-1',
	    cookie: {
	        maxAge: 1000 * 60 * 60 * 24,
	        httpOnly:true
	    },
	    sessionStore: {
	        host: '10.28.5.197',
	        port: '6379',
	        db: 1,
	        ttl: 60 * 60 * 24,
	        logErrors: true
	    }
	},
	mongoConfig:{
		mongodb: 'mongodb://admin:123123@10.28.5.197/swyc',
		// mongodb: 'mongodb://10.28.5.197/swyc',
	    database: 'swyc',
	    server: '10.28.5.197'
	},
	authSecret:'080994c0cce4b706',
	imageSecret:'swyc'
}
module.exports= _config;