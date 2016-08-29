var com = {};
com.req = function(a, b, c) {
	console.log("com.req", a, b, c);
}

com.req(1, 2, 3);

var ajaxProxy = {};

ajaxProxy.proxyPool = [];

ajaxProxy.init = function(opt) {
	//  var opt = {
	// 	oriFnName: 'req',
	// 	referrer: com,
	// 	successCallbackFieldName: 'success',
	// 	errorCallbackFieldName: 'error'
	// }
	var referrer = opt.referrer,
		oriFnName = opt.oriFnName,
		urlFieldName = opt.urlFieldName || 'url',
		successCallbackFieldName = opt.successCallbackFieldName || 'success',
		errorCallbackFieldName = opt.errorCallbackFieldName || 'error',
		oriFn = referrer[oriFnName];

	referrer[oriFnName] = function() {
		var reqOpt = Array.prototype.slice.call(arguments)[0],
			oriSuccessCallback = reqOpt[successCallbackFieldName],
			oriErrorCallback = reqOpt[errorCallbackFieldName],
			reqUrl = reqOpt[urlFieldName];

		var proxyOpt;
		this.proxyPool.forEach(function(val) { // 尝试找到本次请求对应的proxy
			if (reqUrl.indexOf(val.cigUrl) != -1) { //模糊匹配, 只匹配到了接口名就可以
				proxyOpt = val;
			}
		})

		if (!proxyOpt) { // 本次请求没有代理, 直接发送请求
			oriFn.call(referrer, reqOpt);
		} else { //有代理, 启用代理, 修改回调

		}

		oriFn.call(referrer, reqOpt);
	}
}

ajaxProxy.addProxy = function(opt) {
	// var _opt = {
	// 	cgiUrl: 'location.href',
	// 	dataRecomposer: function() {}
	// }
	this.proxyPool.push(opt);
}

