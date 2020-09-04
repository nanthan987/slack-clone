const message_template = Handlebars.compile(document.querySelector('#message-template').innerHTML);
const chat_window_template = Handlebars.compile(document.querySelector('#chat-window-template').innerHTML);
const chat_template = Handlebars.compile(document.querySelector('#chat-template').innerHTML);
const user_template = Handlebars.compile(document.querySelector('#user-template').innerHTML);




document.addEventListener('DOMContentLoaded', function() {

    if (document.querySelector('.auth').dataset.authenticated == 'true') {
        console.log('authenticated');
        const request = new XMLHttpRequest();
        request.open('GET', '/users');
        request.onload = () => {
            const data = JSON.parse(request.responseText);
            if (data.success) {
                getUserInfo(data.user_id);
            }

        }

        request.send();
    } else {
        console.log('not authenticated');
    }

    // By default, submit button is disabled
    document.querySelector('#display-name-form button').disabled = true;

    // Enable button only if there is text in the input field
    document.querySelector('#display-name-input').onkeyup = () => {
        if (document.querySelector('#display-name-input').value.length > 0)
            document.querySelector('#display-name-form button').disabled = false;
        else
            document.querySelector('#display-name-form button').disabled = true;
    };

    document.querySelectorAll(".dropdown-toggle-btn").forEach(el => {
        el.onclick = function() {
            const ul = this.parentElement.parentElement.querySelector(".dropdown-content");
            console.log(ul);
            ul.classList.toggle('hidden');
        };
    });

    document.querySelector('#add-chat-btn').onclick = ()=>{

    	// ------------------ add code to create new chat ------------------------

    	return false;

    }

    document.querySelector("#display-name-form").onsubmit = () => {
        const request = new XMLHttpRequest();
        request.open('POST', '/users');

        request.onload = () => {
            const data = JSON.parse(request.responseText);
            console.log('got here in js, form request loaded')
            getUserInfo(data.user_id);

        }

        const data = new FormData();
        const display_name = document.querySelector('#display-name-input').value;
        data.append("display_name", display_name);
        request.send(data);



        return false;
    }





})


function getUserInfo(user_id) {
    console.log('getting user info', user_id)
    const request = new XMLHttpRequest();
    request.open('GET', `/users/${user_id}`);

    request.onload = () => {
        console.log('got user info')
        const data = JSON.parse(request.responseText);
        if (data.success == 'true') {
            loadUserPage(data);
        }
    }

    request.send();
}

function loadUserPage(data) {
    document.querySelector("#display-name").innerHTML = data.display_name;

    //fill chatrooms list
    const chat_list = chat_template({ 'chats': data.chats });
    document.querySelector("#chats-list").innerHTML = chat_list;

    //fill users list
    const user_list = user_template({ 'users': data.users });
    document.querySelector("#users-list").innerHTML = user_list;

    // connect socket to server
    connectSocket();

    // set onclick methods for chat links
    setLinksOnClicks();

    // store user_id and display name in sessionStorage for later access
    sessionStorage.setItem('user_id', data.self_id);
    sessionStorage.setItem('display_name', data.display_name);

    auth = document.querySelector('.auth');
    main = document.querySelector('main');

    if (!auth.classList.contains('hidden')) {
        auth.classList.add('hidden');
    }
    if (main.classList.contains('hidden')) {
        main.classList.remove('hidden');
    }

    highlightSelectedChat();

}

function setLinksOnClicks() {
    document.querySelectorAll('.chat a').forEach(el => {
        el.onclick = function() {

            const chat_id = this.parentElement.dataset.id;
            console.log(`${chat_id} button pressed`);

            if(sessionStorage['user_id']){
            	localStorage[sessionStorage['user_id']] = chat_id;
            }
            highlightSelectedChat();

            return false;
        }
    })
}

function renderChat(chat_id) {
    //check if selected chat has already been downloaded
    console.log(`#chat_${chat_id}`);
    var chat = document.querySelector(`#chat_${chat_id}`);
    var chats = document.querySelectorAll('.message-list');

    if (chat !== null) {
        for (var j = 0, len = chats.length; j < len; j++) {

            if (!chats[j].classList.contains('hidden')) {
                chats[j].classList.add('hidden');
            }
            if (chats[j].classList.contains('active')) {
                chats[j].classList.remove('active');
            }
        }

        chat.classList.remove('hidden');
        chat.classList.add('active');
        document.querySelector('.send-message-btn').dataset.chat_id = chat_id;

        return;
    }



    const request = new XMLHttpRequest();
    request.open('GET', `/chatrooms/${chat_id}`);

    request.onload = () => {
    	console.log('request loaded');
        const data = JSON.parse(request.responseText);
        if (data.success == 'true') {
            renderMessages(data, chat_id);
        }
        return;
    }
    request.send();

    return;
}

function renderMessages(data, chat_id) {

    for (i in data.messages) {
        var message = data.messages[i];

        // set correct time (convert utc to local)
        const localTime = new Date(message.time);
        console.log(localTime);

        var hours = localTime.getHours();
    	var minutes = localTime.getMinutes();
    	var period = 'AM';
   		if (hours > 12) {
        	hours = hours - 12;
        	period = 'PM';
    	}
    	if (hours < 10){
    		hours = `0${hours}`;
    	}
    	if (minutes < 10){
    		minutes = `0${minutes}`;
    	}
    
    	message.time = hours + ':' + minutes + ' ' + period;

        // set message class (for styling)
        if (message.sender_id == sessionStorage.getItem('user_id')) {
            message['class'] = 'sender-me';
        } else {
            message['class'] = 'sender-other';
        }
    }



    const messages = chat_window_template({ 'messages': data.messages, 'active': 'active', 'id': chat_id })

    // deactivate and hide other chat windows
    document.querySelectorAll('.message-list').forEach(el => {
        if (el.classList.contains('active')) {
            el.classList.remove('active');
        }
        if (!el.classList.contains('hidden')) {
            el.classList.add('hidden');
        }
    });
    // add new chat window to the enclosing div
    document.querySelector('#messages-window').insertAdjacentHTML('beforeend', messages);
    document.querySelector('.send-message-btn').dataset.chat_id = chat_id;


    var ul = document.querySelector('.message-list,.active');
    ul.scrollTop = ul.scrollHeight;

}

function renderNewMessage(message) {
    // set correct time (convert utc to local)
    const localTime = new Date(message.time);
    console.log(localTime);
    var hours = localTime.getHours();
    var minutes = localTime.getMinutes();
    var period = 'AM';
    if (hours > 12) {
        hours = hours - 12;
        period = 'PM';
    }
    if (hours < 10){
    	hours = `0${hours}`
    }
    if (minutes < 10){
    	minutes = `0${minutes}`
    }

    message.time = hours + ':' + minutes + ' ' + period;

    // set message class (for styling)
    if (message.sender_id == sessionStorage.getItem('user_id')) {
        message['class'] = 'sender-me';
    } else {
        message['class'] = 'sender-other';
    }

    const new_message = message_template({ 'message': message });
    const parent_chat = document.querySelector(`#chat_${message.chat_id}`);
    parent_chat.insertAdjacentHTML('beforeend', new_message);
    console.log(parent_chat.children.length);
    if (parent_chat.children.length > 100) {
        for (var i = 0, len = parent_chat.children.length; i < len - 100; i++) {
            parent_chat.children[i].remove();
        }
    }

    var ul = document.querySelector(`#chat_${message.chat_id}`);
    ul.scrollTop = ul.scrollHeight;
}




function connectSocket() {
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    socket.on('connect', () => {
        document.querySelector('.send-message-btn').onclick = function() {
            if (this.dataset.chat_id) {
                if (document.querySelector('#message-input').value.length > 0) {
                    socket.emit('submit_message', { 'chat_id': this.dataset.chat_id, 'text': document.querySelector('#message-input').value });
                }
            }
            document.querySelector('#message-input').value = '';
            return false;
        }
    });

    socket.on('new_message', data => {
        renderNewMessage(data);
    });
}

function highlightSelectedChat() {
    var chat_links = document.querySelector('#chats-list').children;
    const selected_chat = localStorage[sessionStorage['user_id']];
    if(!selected_chat){
    	selected_chat = 1;
    }
    console.log(selected_chat);
    if (selected_chat){
        for (var i = 0, len = chat_links.length; i < len; i++) {
            if (chat_links[i].dataset.id == selected_chat) {
                if (!chat_links[i].classList.contains('active-chat')) {
                    chat_links[i].classList.add('active-chat');
                }
            } else {
                if (chat_links[i].classList.contains('active-chat')) {
                    chat_links[i].classList.remove('active-chat');
                }
            }
        }

        renderChat(selected_chat);
    }




}

function newChat(){
	const request = new XMLHttpRequest();
	request.open('POST','/chatrooms/add');

	// ------------------ add code to create new chat ------------------------
}