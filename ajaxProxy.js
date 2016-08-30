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
			if (reqUrl.indexOf(val.cgiUrl) != -1) { //模糊匹配, 只匹配到了接口名就可以
				proxyOpt = val;
				return false;
			}
		})

		oriSuccessCallback && (reqOpt[successCallbackFieldName] = function(data, status, xhr) { //zepto标准
			console.log("Proxy success callback");
			if (data.ret != 0) { // 此处也可能有其他正常的返回码
				console.warn("后台接口可能跪了, 尝试读取上一次正常返回, url:", proxyOpt.cgiUrl);
				try {
					data = JSON.parse(localStorage[proxyOpt.cgiUrl]);
					console.info("已成功读取上一次的返回值");
				} catch (_) {
					console.log("尝试读取上一次后台返回数据失败");
				}
			}

			// 修改返回值
			if (proxyOpt && proxyOpt.dataRecomposer) {
				data = dataRecomposer(data);
				console.info(proxyOpt.cgiUrl + "的返回已经ajaxProxy修改");
			}

			oriSuccessCallback(data, status, xhr);
		})

		oriErrorCallback && (reqOpt[errorCallbackFieldName] = function(xhr, errorType, error) { //zepto标准
			console.error("后台接口可能跪了", xhr, errorType, error);
			console.warn("尝试读取上一次正常返回");
			alert("后台接口可能跪了, 尝试读取上一次正常返回, url: " + proxyOpt.cgiUrl);
			try {
				data = JSON.parse(localStorage[proxyOpt.cgiUrl]);
				oriSuccessCallback(data);
				console.info("已成功读取上一次的返回值");
			} catch (_) {
				console.log("尝试读取上一次后台返回数据失败");
				oriErrorCallback(xhr, errorType, error);
			}
		})

		oriFn.call(referrer, reqOpt);
	}
}

ajaxProxy.addProxy = function(opt) {
	// var _opt = {
	// 	cgiUrl: 'location.href',
	// 	dataRecomposer: function(data) {data.aa=1}
	// }
	this.proxyPool.push(opt);
}