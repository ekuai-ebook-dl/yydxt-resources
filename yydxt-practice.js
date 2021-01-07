let config = {
	contentId: "4310622166",
	dev: 0,//0:关闭;1:只输出第一章;2:只输出第一章第一节
	renderFile(fileName, data) {
		return `<!DOCTYPE html>
		<html lang="zh">
			<head>
				<meta charset="UTF-8">
				<title>${fileName}</title>
			</head>
			<body>
				<div>${fileName}</div><hr/>
				<div>${data}</div>
			</body>
		</html>`;
	},
	renderQuestion(question, index) {
		let choiceDat = this.renderChoice(question);
		return `<div>
			<div>${index + 1}.${question.content.title}</div>
			<div>
				${choiceDat}
			</div>
			<div>
				答案：${question.answer}
			</div>
			<div>
				来源：${question.fieldName}
			</div>
			<div>
				知识点：${question.pointName}
			</div>
		</div><hr/>`;
	},
	renderChoice(question) {
		let choices = question.content.choiceList;
		let questionType = question.questionTypeId;
		let ret = "";
		switch (questionType) {
			case 1://单选
				ret += "单选题";
				for (let key in choices) {
					ret += `<br/><input type="radio" name="${question.questionId}" value="${key}"/>${key}:` + parseDomText(choices[key]);
				}
				break;
			case 2://多选
				ret += "多选题";
				for (let key in choices) {
					ret += `<br/><input type="checkbox" name="${question.questionId}" value="${key}"/>${key}:` + parseDomText(choices[key]);
				}
				break;
			case 3://判断
				ret = `判断题<br/><input type="radio" name="${question.questionId}" value="T:正确">T:正确<br/>
								<input type="radio" name="${question.questionId}" value="F:错误">F:错误`;
				break;
			case 4://填空
				ret = `填空题`;
				break;
			case 5://问答(填空)
				ret = `问答题`;
				break;
			case 8://名词解释(填空)
				ret = `名词解释`;
				break;
			default:
				console.error("unexpected question type", questionType, question);
				ret = "unexpected question type" + questionType;
				break;
		}
		return ret;
	},
};//在此修改配置

function saveFile(fileName, content) {
	let export_blob = new Blob([content], {type: "text/html,charset=UTF-8"});
	let save_link = document.createElement("a");
	save_link.href = window.URL.createObjectURL(export_blob);
	save_link.download = fileName;
	save_link.click();
}

function postURL(URL, params) {
	return new Promise(function (resolve, reject) {
		let req = new XMLHttpRequest();
		req.open("POST", URL, true);
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
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		req.send(params);
	});
}

function parseDom(arg) {
	let objE = document.createElement("div");
	objE.innerHTML = arg;
	return objE.childNodes;
}

function parseDomText(arg) {
	let objE = document.createElement("div");
	objE.innerHTML = arg;
	return objE.innerText;
}

function processImageUrl(data) {
	let objE = document.createElement("div");
	objE.innerHTML = data;
	let imgList = objE.querySelectorAll("img");
	for (let i = 0; i < imgList.length; i++) {
		imgList[i].src = "" + imgList[i].src;
	}
	console.log("output document", objE);
	return objE.innerHTML;
}

let getChapterPractice = async function (chapterId) {
	let questions = [], num = 1, currentPage = 0;
	do {
		currentPage++;
		let chapter = await postURL("http://www.yiyaodxt.com/qcloud/feildSubject.jspx", `chapterId=${chapterId}&pageNo=${currentPage}`);
		chapter = chapter ? chapter : "[]";
		chapter = JSON.parse(chapter);
		num = chapter.body.size;
		chapter = JSON.parse(chapter.body.content);
		questions = questions.concat(chapter);
		console.log(chapterId, currentPage, questions.length, num, questions);
		if (config.dev >= 2) {
			break;
		}
	} while (questions.length < num);
	return questions;
};

let outputChapter = async function (chapter) {
	let questions = await getChapterPractice(chapter.id);
	let chapterName = chapter.querySelector(".train_name").innerHTML;
	let data = "";
	for (let i = 0; i < questions.length; i++) {
		let question = questions[i];
		question.content = JSON.parse(question.content);
		data += config.renderQuestion(question, i);
	}
	data = processImageUrl(data);
	saveFile(chapterName + ".html", config.renderFile(chapterName, data));
	console.log(chapterName, questions);
};

let main = async function () {
	let fragment = await postURL("http://www.yiyaodxt.com/qcloud/study/lianxi.jspx", "contentId=" + config.contentId);
	fragment = parseDom(fragment);
	fragment = fragment[1].querySelector(".train_box").children;
	console.log(fragment);
	for (let i = 0; i < fragment.length; i++) {
		outputChapter(fragment[i]).then(() => {
			console.log(`thread ${i} finished`);
		});
		if (config.dev >= 1) {
			break;
		}
	}
	return Promise.resolve();
};
main().then(() => {
	console.log("main thread finished, please wait...");
});
