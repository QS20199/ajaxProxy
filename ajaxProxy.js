var ajaxProxy = {};

ajaxProxy.proxyPool = [];
ajaxProxy.enable = false;

ajaxProxy.start = function() {
	ajaxProxy.enable = true;
}

ajaxProxy.stop = function() {
	ajaxProxy.enable = false;
}

ajaxProxy.init = function(opt) {
	var referrer = opt.referrer,
		oriFnName = opt.oriFnName,
		urlFieldName = opt.urlFieldName || 'url',
		successCallbackFieldName = opt.successCallbackFieldName || 'success',
		errorCallbackFieldName = opt.errorCallbackFieldName || 'error',
		commonCheckOccurError = opt.commonCheckOccurError;
	oriFn = referrer[oriFnName];

	referrer[oriFnName] = function() {
		if (!ajaxProxy.enable) {
			oriFn.call(referrer, reqOpt);
			return;
		}

		var reqOpt = Array.prototype.slice.call(arguments)[0],
			oriSuccessCallback = reqOpt[successCallbackFieldName],
			oriErrorCallback = reqOpt[errorCallbackFieldName],
			reqUrl = reqOpt[urlFieldName];

		var proxyOpt;
		ajaxProxy.proxyPool.forEach(function(val) { // 尝试找到本次请求对应的proxy
			if (reqUrl.indexOf(val.cgiUrl) != -1) { //模糊匹配, 只匹配到了接口名就可以
				proxyOpt = val;
				return false;
			}
		})

		if (!(proxyOpt && proxyOpt.checkOccurError) && !commonCheckOccurError) throw ("AjaxProxy Error: proxyOpt.checkOccurError 和 commonCheckOccurError 至少要有一个");

		oriSuccessCallback && (reqOpt[successCallbackFieldName] = function(data, status, xhr) { //zepto标准
			console.log("Proxy success callback");
			if (proxyOpt && proxyOpt.checkOccurError && proxyOpt.checkOccurError(data) || commonCheckOccurError(data)) { // 优先用proxyOpt.checkOccurError
				if (confirm(reqUrl + "\n这个接口可能跪了, 是否尝试读取上一次的正常返回?")) {
					try {
						data = JSON.parse(localStorage[reqUrl]);
						console.info("已成功读取上一次的返回值");
					} catch (_) {
						console.info("读取上一次后台返回数据失败");
					}
				}
			} else { //正常返回则写入到本地储存中
				localStorage[reqUrl] = JSON.stringify(data);
			}

			// 修改返回值
			if (proxyOpt && proxyOpt.dataRecomposer) {
				data = proxyOpt.dataRecomposer(data);
				console.info(reqUrl + "的返回已经ajaxProxy修改");
			}

			oriSuccessCallback(data, status, xhr);
		})

		oriErrorCallback && (reqOpt[errorCallbackFieldName] = function(xhr, errorType, error) { //zepto标准
			console.error("后台接口可能跪了", xhr, errorType, error);
			if (confirm(reqUrl + "\n这个接口可能跪了, 是否尝试读取上一次的正常返回?")) {
				try {
					data = JSON.parse(localStorage[reqUrl]);
					oriSuccessCallback(data);
					console.info("已成功读取上一次的返回值");
				} catch (_) {
					console.info("读取上一次后台返回数据失败");
					oriErrorCallback(xhr, errorType, error);
				}
			} else {
				oriErrorCallback(xhr, errorType, error);
			}
		})

		oriFn.call(referrer, reqOpt);
	}
}

ajaxProxy.addProxy = function(opt) {
	this.proxyPool.push(opt);
}

//========调用demo========

ajaxProxy.init({
	oriFnName: 'ajax',
	referrer: $,
	successCallbackFieldName: 'success',
	errorCallbackFieldName: 'error',
	commonCheckOccurError: function(data) {
		return !(data.c == 200 || data.ret == 0);
	}
})

ajaxProxy.addProxy({
	cgiUrl: 'CmsCFTContentFromOutsideList',
	// checkOccurError: function() {

	// },
	dataRecomposer: function(data) {
		data.ret = 404;
		data.msg = "test";
		return data;
	}
})

ajaxProxy.start();
