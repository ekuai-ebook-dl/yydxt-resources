let config = {
	contentId: "4310622109",
	renderQuestion(question, index, choice) {
		return `<div>
			<div>${index}.${question.content.title}</div>
			<div>
				${choice}
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
		</div>`;
	},
	renderChoice(choice, questionType) {

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

function sleep(ms) {
	return new Promise(function (resolve) {
		setTimeout(() => {
			resolve();
		}, ms);
	});
}

function parseDom(arg) {
	let objE = document.createElement("div");
	objE.innerHTML = arg;
	return objE.childNodes;
}

function renderFile(fileName, data) {
	let content = `<!DOCTYPE html>
	<html lang="zh">
		<head>
			<meta charset="UTF-8">
			<title>${fileName}</title>
		</head>
		<body>
			<div>${data}</div>
		</body>
	</html>
`;
	saveFile(fileName + ".html", content);
}

let getChapterPractice = async function (chapterId) {
	let questions = [], num = 1, currentPage = 0;
	do {
		currentPage++;
		let chapter = await postURL("http://www.yiyaodxt.com/qcloud/feildSubject.jspx", `chapterId=${chapterId}&pageNo=${currentPage}`);
		chapter = JSON.parse(chapter);
		num = chapter.body.size;
		chapter = JSON.parse(chapter.body.content);
		questions = questions.concat(chapter);
		console.log(chapterId, currentPage, questions.length, num, questions);
	} while (questions.length < num);
	return questions;
};

let outputChapter = async function (chapter) {
	let questions = await getChapterPractice(chapter.id);
	let data = "";
	for (let i = 0; i < questions.length; i++) {
		let question = questions[i];
		question.content = JSON.parse(question.content);
		let choice = "";
		for (let j = 0; j < question.content.choiceList.length; j++) {

		}
		data += config.renderQuestion(question, i, choice);
	}
	console.log(chapter, questions);
};

let main = async function () {
	let fragment = await postURL("http://www.yiyaodxt.com/qcloud/study/lianxi.jspx", "contentId=" + config.contentId);
	fragment = parseDom(fragment);
	fragment = fragment[1].querySelector(".train_box").children;
	console.log(fragment);
	for (let i = 0; i < fragment.length; i++) {
		outputChapter(fragment[i]).then(() => {
			console.log(`thread ${i} started`);
		});
	}

	return Promise.resolve();
};
main().then(() => {
	console.log("main thread finished");
});
