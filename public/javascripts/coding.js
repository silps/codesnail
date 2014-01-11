var socket = undefined;
var editor = undefined;
var editor_other = undefined;
var oldCode = undefined;

/* When DOM has been loaded */
window.onload = function() {
	socket = io.connect();

	/* Aquire all the users */
	socket.on("users", function (users) {
		/* When the online users div does not exist */
		if ($("#online-users") == null) return;
		/* Empty the online users div */
		$("#online-users").html("");
		/* Populate all the online users */
		for (var key in users) {
			$("#online-users").html( $("#online-users").html() + 
			'<div id="'+users[key].name.replace(/ /g, "")+'" class="user" onclick="javascript:getCode(\'' + users[key].email + '\')">' +
			'<a class="mugshot-link" href="#" title="show code">' +
			'<img class="mugshot" src="' + users[key].profile.mugshot + '" alt="mugshot" />' +
			'<p>' + users[key].name + '</p><p>points: ' + users[key].profile.points + '</p></a></div>');
		}
		$("input[name='points']").val(users[key].profile.points);
	});

	/* Receive the requested users code */
	socket.on("receive-code", function (code) {
		editor_other.setValue(code);
		$("#code-message").slideDown("fast")
		setTimeout(function() { $("#code-message").slideUp("fast"); }, 2000);
	});

	/* Receive the requested task */
	socket.on("receive-task", function (task) {
		$('#task').fadeOut("slow", function() {
			$("#task").html("<p>" + task.name + "</p>");
			$("#task").fadeIn("slow");
		});
	});

	/* Receive the requested task */
	socket.on("receive-task-verification", function (name, points) {
		/* When someone solved the task */
		if (name) {
			/* Animate the user win */
			var offset = $("#"+name.replace(/ /g, "")).offset();
			$("#code-win").css({ top: offset.top + 15, left: offset.left - 10 });
			$("#code-win").fadeIn("fast");
			setTimeout(function() { $("#code-win").fadeOut("fast"); }, 2000);
			/* Animate the use points */
			$("#code-points").css({ top: offset.top, left: offset.left });
			$("#code-points").html(points);
			$("#code-points").toggle("bounce", { times: 1 }, "slow");
			$("#code-points").fadeOut("fast");
		}
	});

	/* Get the task */
	socket.emit("get-task");

	/* Execute in intervals */
	setInterval(function() {
		var code = editor.getValue();
		/* When the users code has changed */
		if (oldCode != code)
			/* Send it for verification and saving */
			socket.emit("verify-task", editor.getValue());
		oldCode = code;
	}, 1000);

	/* Execute in intervals */
	setInterval(function() {
		/* Send ping to keep connection alive */
		socket.emit("ping");
	}, 10000);

	/* ACE editor initialization */
	editor_other = ace.edit("code-message");
	editor_other.session.setMode("ace/mode/html");
	editor_other.setOptions({ maxLines: 10, minLines: 10 });

	editor = ace.edit("code");
	editor.session.setMode("ace/mode/html");
	editor.setOptions({ maxLines: 10, minLines: 10 });
	editor.setAutoScrollEditorIntoView(true);

	/* Load emmet for fast coding */
	ace.config.loadModule("ace/ext/emmet", function() {
		ace.require("ace/lib/net").loadScript("http://nightwing.github.io/emmet-core/emmet.js", function() {
			editor.setOption("enableEmmet", true);
		});

		editor.setOptions({
			enableSnippets: true,
			enableBasicAutocompletion: true
		});
	});

	/* Enable autocomplete */
	ace.config.loadModule("ace/ext/language_tools", function() {
		editor.setOptions({
			enableSnippets: true,
			enableBasicAutocompletion: true
		});
	});
}

/* Get a users code */
function getCode(userEmail) {
	socket.emit("get-code", userEmail);
}