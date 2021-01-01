let config = {
	url: "http://app.yiyaodxt.com/qcloud/api/v1/chapter/list/4310622430",
	delay: 200,
};//在此修改配置

function getURL(URL) {
	return new Promise(function (resolve, reject) {
		let req = new XMLHttpRequest();
		req.open("GET", URL, true);
		req.onload = function () {
			if (req.status === 200) {
				resolve(req.responseText);
			} else {
				reject(new Error(req.statusText));
			}
		};
		req.onerror = function () {
			reject(new Error(req.statusText));
		};
		req.send();
	});
}

function sleep(ms) {
	return new Promise(function (resolve) {
		setTimeout(() => {
			resolve();
		}, ms);
	});
}

let main = async function () {
	let mainJson = await getURL(config.url);
	mainJson = JSON.parse(mainJson);
	mainJson = mainJson.body.qcChapters;
	console.log(mainJson);
	let ret = "";
	for (let i = 0; i < mainJson.length; i++) {
		let json = mainJson[i].attachmentList;
		console.log(i, mainJson.length, json);
		for (let j = 0; j < json.length; j++) {
			await sleep(config.delay);
			console.log(i, mainJson.length, j, json.length, json[j]);
			let attachment = await getURL("http://app.yiyaodxt.com/qcloud/api/v1/resourceFile/resource/" + json[j].attachmentId);
			attachment = JSON.parse(attachment);
			attachment = attachment.body.qcResourceFile;
			ret += json[j].attachmentName + "|http://file.yiyaoxt.com" + attachment.filePath + "\r\n";
		}
	}
	return Promise.resolve(ret);
};
main().then((e) => {
	console.log(e);
});
