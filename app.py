import os

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_socketio import SocketIO, emit

from flask_session import Session
from collections import deque
from datetime import datetime,timezone

app = Flask(__name__)

app.url_map.strict_slashes = False
app.config['SECRET_KEY'] = "test_secret_key_090897"
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config["TEMPLATES_AUTO_RELOAD"] = True
Session(app)
socketio = SocketIO(app)

# manually entered users FOR_TESTING
users_list = {'1':'Gowrienanthan Balarupan','2':'Vihan Wickramasurendra','3':'Visura Silva'}
users_count = 3

# manually created chats until 'add chat' feature is functional
chats_list = {'1':{'name':'Chat_1','id':'1'},'2':{'name':'Chat_2','id':'2'},'3':{'name':'Chat_3','id':'3'},'4':{'name':'Chat_4','id':'4'}}
chats_count = 3
# messages = {'1':deque(maxlen=100),'2':deque(maxlen=100),'3':deque(maxlen=100),'4':deque(maxlen=100)}

# chat with manually enetered messages FOR_TESTING
messages = {'1': deque([{'sender_id': '1', 'sender_name': 'Gowrienanthan Balarupan', 'time': '2020-08-14T08:32:13.182156+00:00', 'chat_id': '1', 'text': 'Hi guys!'}, {'sender_id': '1', 'sender_name': 'Gowrienanthan Balarupan', 'time': '2020-08-14T08:32:37.730851+00:00', 'chat_id': '1', 'text': 'Anyone there?'}, {'sender_id': '3', 'sender_name': 'Visura Silva', 'time': '2020-08-14T08:36:08.880304+00:00', 'chat_id': '1', 'text': 'Hi Gowrie'}, {'sender_id': '2', 'sender_name': 'Vihan Wickramasurendra', 'time': '2020-08-14T08:36:51.888373+00:00', 'chat_id': '1', 'text': 'Oh hey'}, {'sender_id': '2', 'sender_name': 'Vihan Wickramasurendra', 'time': '2020-08-14T08:37:08.694067+00:00', 'chat_id': '1', 'text': 'Whats up? Anything urgent?'}], maxlen=100)
,'2':deque(maxlen=100),'3':deque(maxlen=100),'4':deque(maxlen=100)}


@app.route("/")
def index():
	if 'user_id' in session:
		return render_template('index.html', auth_display='hidden',main_display='',authenticated='true')
	else:
		return render_template('index.html',auth_display='',main_display='hidden',authenticated='false')

@app.route('/logout')
def logout():
	if 'user_id' in session:
		session.pop('user_id')
		session.pop('display_name')
		return redirect(url_for('index'))

@app.route("/users", methods=["GET","POST"])
def users():
	if request.method == "POST":
		display_name = request.form["display_name"]
		
		if display_name.lower() not in [x.lower() for x in users_list.values()]:
			global users_count
			users_count+= 1
			
			users_list[str(users_count)] = display_name;
			user_id = str(users_count)
			
		else:
			user_id, display_name = [(key,value) for key,value in users_list.items() if value.lower()==display_name.lower()][0]
			#print("display name:",display_name,user_id)

		session['user_id'] = user_id
		session['display_name'] = display_name


	if request.method == "GET":
		if 'user_id' in session:
			user_id = session['user_id']
			
		else:
			return(redirect(url_for('index')))

	
	return jsonify({'user_id':user_id,'success':'true'})

	


@app.route('/users/<user_id>')
def get_user_info(user_id):
	if 'user_id' in session:
		if session['user_id'] == user_id:
			response = dict()
			
			response['chats'] = list(chats_list.values())
			response['users'] = [{'id':key,'name':value} for key, value in users_list.items() if key!=user_id]
			response['self_id'] = user_id
			response['display_name'] = session['display_name']
			response['success'] = 'true'
			
			return jsonify(response)

	return jsonify({'success':'false'}) #have to figure out how to show an error page here


@app.route('/chatrooms/<chat_id>')
def get_messages(chat_id):
	if 'user_id' in session:
		response = dict()
		if chat_id in messages.keys():
			response['messages'] = list(messages[chat_id])
			response['success'] = 'true'
		else:
			response['success'] = 'false'
			
		
		return jsonify(response)
	else:
		return 'Please Log In' # ----- add code to show error page --------



@socketio.on('submit_message')
def handle_message(data):
	if 'user_id' in session:
		chat_id = str(data['chat_id'])
		if chat_id in messages.keys():
			message = dict()
			message['sender_id'] = session['user_id']
			message['sender_name'] = session['display_name']
			message['time'] = datetime.now(timezone.utc).isoformat()
			message['chat_id'] = chat_id
			message['text'] = data['text']

			messages[chat_id].append(message)
			print(messages)
			emit('new_message', message,broadcast=True)

		
