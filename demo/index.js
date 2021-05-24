var url_protocol = window.location.protocol;
var url_host = window.location.host;
var rtc_server = url_protocol + '//' + url_host;

// var rtc_server = 'https://rtc2.seeyoulink.com'

var onlineUsers = null;

// ----------------------------------------------
// Cached dom elements
// ----------------------------------------------

var $online_status = $('.syl-status');
var $online_users_btn = $('.syl-online-users');


function infoTemplate(params){
  var body = '';
  var title = '';

  if (params.name.indexOf('status') !== -1) {
    title = 'Connection Status';
  }

  if (params.name.indexOf('users') !== -1) {
    title = 'Online Users';
  }

  if (params.empty) {
    var text = '';

    if (params.name === 'status_disconnected') {
      text = 'You are not connected. Please set the required fields and connect first.';      
    }

    if (params.name === 'users_empty') {
      text = 'There are no online users in your room.'
    }

    body = '<div class="empty">' + text + '</div>';
  }

  if (params.name === 'status_connected') {
    body = '' +
    '<ul class="status-list">' +
      '<li>username : '+ easyrtc.idToName(easyrtc.myEasyrtcid) +'</li>' +
      '<li>room : '+ Object.keys(easyrtc.getRoomsJoined())[0] +'</li>' +
      '<li>rtc_id : '+ easyrtc.myEasyrtcid +'</li>' +    
      '<li>server : '+ sylrtc.config.rtc_server +'</li>' +
    '</ul>';
  }

  if (params.name === 'users_online') {
    var lis = '';

    onlineUsers.forEach(function(user){
      lis += '' +
      '<li data-username="'+ user.username +'">' +
        '<i class="material-icons avatar">person</i>' +
        '<span class="name">'+ user.full_name +'</span>' +
        '<i class="material-icons action call-btn">call</i>' +
        '<i class="material-icons action chat-btn">chat</i>' +
      '</li>';
    });

    body = '<ul class="users-list">' + lis + '</ul>';
  }

  var html = '' +
  '<div id="'+ params.name +'" class="syl-info">' +
    '<div class="header">' +
      '<div class="title">'+ title +'</div>' +
      '<i class="material-icons close-btn">close</i>' +
    '</div>' + 
    body +
  '</div>';

  $('body').append(html);

  if (params.name === 'users_online') {
    $('.syl-info li').on('click', '.material-icons', function(){
      var username = $(this).parent().attr('data-username');      

      if ($(this).hasClass('call-btn')) {
        sylrtc.performCall(username);

      } else {
        // OPEN CHAT        
        sylrtc.chat.open([sylrtc.config.user.username, username]);
      }      
    });
  }

  $('.syl-info .close-btn').on('click', function(){
    $(this).parent().parent().remove();
  });
}


function openInfo(params){
  var $info = $('.syl-info');

  if ($info.attr('id') === params.name) {
    $info.remove();
    return;
  }

  if ($info.length > 0) {
    $info.each(function(){
      $(this).remove();
    });    
  }
  
  if (params.name === 'status_connected') {
    infoTemplate({
      name: params.name
    });
  }

  if (params.name === 'status_disconnected') {
    infoTemplate({
      name: params.name,
      empty: true
    });
  }

  if (params.name === 'users_online') {
    infoTemplate({
      name: params.name,
      users: params.users
    });
  }

  if (params.name === 'users_empty') {
    infoTemplate({
      name: params.name,
      empty: true
    });
  }  
}


function generateToken(){}


function updateOnlineStatus(onOff){  
  var $text = $online_status.find('.text');
  var status = onOff ? 'Connected' : 'Disconnected';

  $online_status.toggleClass('online', onOff);
  $text.text(status);

  if (onOff) {
    $('#connect').html('Disconnect').toggleClass('red', true).toggleClass('green', false);
    $('#customize form').toggleClass('no-border', false);
    $('#apply_changes').css('display', 'block');
  } else {
    $('#connect').html('Connect').toggleClass('red', false).toggleClass('green', true);
    $('#customize form').toggleClass('no-border', true);
    $('#apply_changes').css('display', 'none');
  }
}


// ----------------------------------------------
// Clicks
// ----------------------------------------------

$('.card-title-box').on('click', function(){
  $(this).parent().toggleClass('info-expanded');
});


$('#connect').on('click', function(){
  if (easyrtc.myEasyrtcid) {
    sylrtc.disconnect();
  
  } else {
    var configured = config();   

    if (!configured) { return false; }

    sylrtc.connect().then(function(){      
      saveCredentialsInLS();

    }).catch(function(error){
      console.log('Connect : ERROR : ', error.code, error.message);
      updateOnlineStatus(false);

      sylrtc.notify({
        icon: 'warning',
        icon_color: 'red',
        message: 'Error connecting to the rtc server. Error code: ' + error.code + '. Error message: ' + error.message,
        autohide: true
      });
    });
  }
});


$('#apply_changes').on('click', function(){
  if (sylrtc.callInProgress()) { return; }

  sylrtc.disconnect().then(function(){
    var configured = config();

    if (!configured) {
      updateOnlineStatus(false);

      sylrtc.notify({
        icon: 'warning',
        icon_color: 'red',
        message: 'Error changing settings. Please check your configuration field values and try again.',
        autohide: true
      });

      return false;
    }

    sylrtc.connect().then(function(){
      sylrtc.notify({
        icon: 'refresh',
        icon_color: 'green',
        message: 'You have successfully updated settings',
        autohide: true
      });
    }).catch(function(errCode){
      updateOnlineStatus(false);

      sylrtc.notify({
        icon: 'warning',
        icon_color: 'red',
        message: 'Error connecting to the rtc server. Error code: ' + errCode,
        autohide: true
      });
    });
  });
});


$('#generate_token').on('click', function(){  
  $('#client_id_1').toggleClass('error', false);
  
  var client_id = $('#client_id_1').val();
  var client_token = $('#client_token_1').val();  

  if (client_id === '' || client_token === '') {
    if (client_id === '') {
      $('#client_id_1').toggleClass('error', true);
    }

    if (client_token === '') {
      $('#client_token_1').toggleClass('error', true);
    }
    
    sylrtc.notify({
      icon: 'warning',
      icon_color: 'red',
      message: 'Please provide the Client ID and Client token and try again!',
      autohide: true
    });

    return;
  }
  
  $.post('/api/auth/', {
    client_id: client_id,
    client_token: client_token
  }, function(data, status, xhr) {
    console.log(data);

    if (data.error) {
      sylrtc.notify({
        icon: 'warning',
        icon_color: 'red',
        message: 'Error generating token: '+ data.error,
        autohide: true
      });      
    
    } else {
      var token_html = '' +
      '<div id="auth_token_box" class="response-box">' +
        '<div class="res-info">You have successfully generated the auth token. Your Auth token and Client ID are copied to the Authentication fields.</div>' + 
        '<div class="res-label">Auth token:</div>' +
        '<div class="res-link" id="auth_token_value">'+ data.data.auth_token +'</div>' +
      '</div>';

      $('#user_account')
        .attr('id', 'demo_account')
        .text('Use demo account');
        
      $('#auth_fields').show();

      $('#client_id').toggleClass('error', false).val(client_id);
      $('#client_token').toggleClass('error', false).val('');
      $('#auth_token').toggleClass('error', false).val(data.data.auth_token);

      $('#generate_token').remove();
      $('#generate_auth_token').append(token_html);      
    }
  });
});


$('#quick_call').on('click', function(){
  if (!sylrtc.connected) {
    sylrtc.notify({
      icon: 'warning',
      icon_color: 'red',
      message: 'You are not connected. Please connect and try again.',
      autohide: true
    });

    return;
  }   

  var client_id = $('#client_id').val();
  var client_token = $('#client_token').val();
  var auth_token = $('#auth_token').val();
  var username_prefix = $('#username_prefix').val();
  var user_id = $('#user_id').val();
  var user_full_name = $('#full_name').val();
  var username = username_prefix+ '-'+ user_id+ '-'+ user_full_name;
  var invited_person_name = $('#invited_person_name').val();
  var room = $('#room_name').val();
  var avatar = '';

  if (invited_person_name === '') {
    invited_person_name = 'Test ' + Math.floor(100000 + Math.random() * 900000);
    $('#invited_person_name').val(invited_person_name);
  }

  if (client_id === '' || client_token === '') {
    if (client_id === '') {
      $('#client_id').toggleClass('error', true);
    }

    if (client_token === '') {
      $('#client_token').toggleClass('error', true);
    }
    
    sylrtc.notify({
      icon: 'warning',
      icon_color: 'red',
      message: 'Authentication error. Please check Client ID and Client token and try again.',
      autohide: true
    });

    return;
  }
  
  $.get('/api/quick_calling/', { 
    client_id: client_id,
    client_token: client_token,
    username: username,
    user_full_name: user_full_name,
    avatar: avatar,
    invited_person_name: invited_person_name,
    room: room
  
  }, function(data, status, xhr) {
    console.log(data);
    
    if (data.error) {
      sylrtc.notify({
        icon: 'warning',
        icon_color: 'red',
        message: 'Error: '+ data.error + '. Please check Client ID and Client token in the authentication section and try again.',
        autohide: true
      });      
    
    } else {
      var localtime = new Date(data.data.expiration_time).toString().split(' GMT')[0];
      var link = rtc_server + '/demo/calling.html?quick_call_token=' + data.data.quick_call_token;      

      var link_html = '' +
      '<div class="quick-link-box">' +
        '<div class="label">Quick call link for '+ invited_person_name + ',</div>' +
        '<div class="expiration">expires at '+ localtime +'.</div>' +
        '<a class="link" href="'+ link +'" target="_blank">'+ link +'</a>' +
      '</div>';

      copyTextToClipboard(link);
      
      $('#quick_call_links').append(link_html);

      $('#invited_person_name').val('');
    }
  });
});


$('#open_quick_links_list').on('click', function(){
  if (!sylrtc.connected) {
    sylrtc.notify({
      icon: 'warning',
      icon_color: 'red',
      message: 'You need to be connected in order to view quick links.',
      autohide: true
    });    
  
  } else {
    sylrtc.quickLinks.open();
  }
});


$('#media_message_btn').on('click', function(){
  if (!sylrtc.connected) {
    sylrtc.notify({
      icon: 'warning',
      icon_color: 'red',
      message: 'You are not connected. Please coonect first and try again.',
      autohide: true
    });

    return;
  }
  
  var recipient_name = $('#recipient_name').val();

  if (recipient_name === '') {
    recipient_name = 'Test ' + Math.floor(100000 + Math.random() * 900000);
    $('#recipient_name').val(recipient_name);
  }
  
  sylrtc.recorder.open({
    full_name: recipient_name
  });

  $('#recipient_name').val('');
});


$('#screencast_btn').on('click', function(){
  if (!sylrtc.connected) {
    sylrtc.notify({
      icon: 'warning',
      icon_color: 'red',
      message: 'You are not connected. Please connect, and try again.',
      autohide: true
    });

    return;
  }
  
  var title = $('#screencast_title').val();

  if (title === '') {
    title = 'Screencast ' + Math.floor(100000 + Math.random() * 900000);
    $('#screencast_title').val(title);
  }
  
  sylrtc.recorder.createScreencast({
    title: title
  });

  $('#screencast_title').val('');
});


$('#online_users_list').on('click', 'li', function(){
  var username = $(this).attr('data-username');  
  sylrtc.performCall(username);
});


$('.link-btn').on('click', function(){
  var id = $(this).attr('id');

  if (id === 'demo_account') {    
    var demo_client_id = 'syldemo';
    var demo_client_token = '265697885748763436541355943228197879285666311';

    $(this).text('Use your client account');
    $(this).attr('id', 'user_account');

    $('#auth_fields').hide();
    $('#client_id').val(demo_client_id);
    $('#client_token').val(demo_client_token);    
  
  } else if (id === 'user_account') {
    $(this).text('Use demo account');
    $(this).attr('id', 'demo_account');

    $('#client_id').val('');
    $('#client_token').val('');
    $('#auth_token').val('');
    $('#auth_fields').show();
  }
});


$('#confroom_btn').on('click', function(){
  if (sylrtc.connected) {
    if (sylrtc.config.credentials.client_id === 'syldemo') {
      sylrtc.notify({
        icon: 'warning',
        icon_color: 'red',
        message: 'You can\'t create conference room with the demo account. Contact us in order to get a valid account.',
        autohide: true
      });
    } else {
      sylrtc.confRoom.open();
    }
  } else {
    sylrtc.notify({
      icon: 'warning',
      icon_color: 'red',
      message: 'You have to be connected in order to create the conference room',
      autohide: true
    });
  }
});


$('#open_confrooms_list').on('click', function(){
  if (!sylrtc.connected) {
    sylrtc.notify({
      icon: 'warning',
      icon_color: 'red',
      message: 'You need to be connected in order to view list of conference rooms.',
      autohide: true
    });    
  
  } else {
    sylrtc.confRoom.openList();
  }
});


$('#call_phone_number_btn').on('click', function(){
  if (sylrtc.config.credentials.client_id === 'syldemo') {
    sylrtc.notify({
      icon: 'warning',
      icon_color: 'red',
      message: 'You can\'t call phone numbers with the demo account. Contact us in order to get a valid account.',
      autohide: true
    });
  } else if (!sylrtc.connected) {
    sylrtc.notify({
      icon: 'warning',
      icon_color: 'red',
      message: 'You need to be connected in order to call phone.',
      autohide: true
    });

  } else {
    sylrtc.phoneCall.open();
  } 
});


$('#send_sms_btn').on('click', function(){
  if (sylrtc.config.credentials.client_id === 'syldemo') {
    sylrtc.notify({
      icon: 'warning',
      icon_color: 'red',
      message: 'You can\'t send sms messages with the demo account. Contact us in order to get a valid account.',
      autohide: true
    });
  } else if (!sylrtc.connected) {
    sylrtc.notify({
      icon: 'warning',
      icon_color: 'red',
      message: 'You need to be connected in order to send sms message.',
      autohide: true
    });    
  
  } else {
    sylrtc.sms.open();
  }
});


$('form input').on('change', function(){  
  $(this).toggleClass('error', false);
});


$online_status.on('click', function(){
  var status = $(this).hasClass('online') ? 'connected' : 'disconnected';  
  openInfo({ name: 'status_' + status });
});


$online_users_btn.on('click', function(){
  var online = onlineUsers && onlineUsers.length ? 'online' : 'empty';
  openInfo({ name:  'users_' + online });
});


$('#open_av_messages').on('click', function(){
  if (!sylrtc.connected) {
    sylrtc.notify({
      icon: 'warning',
      icon_color: 'red',
      message: 'You need to be connected in order to view your messages.',
      autohide: true
    });    
  
  } else {
    sylrtc.AVMessages.open();
  }
});


// ----------------------------------------------
// SYLRTC
// ----------------------------------------------

function config(){
  $('#config_and_connect input').each(function(i, el){
    $(el).toggleClass('error', false);
  });

  var ui_mode = $('#ui_mode').val();
  var start_call_with_cam = $('#start_call_with_cam').val();
  
  if (start_call_with_cam === 'true') {
    start_call_with_cam = true;
  
  } else if (start_call_with_cam === 'false'){
    start_call_with_cam = false;
  
  } else {
    start_call_with_cam = true;
  }

  var single_incoming_call_only = $('#single_incoming_call_only').val();
  
  if (single_incoming_call_only === 'false') {
    single_incoming_call_only = false;
  
  } else if (single_incoming_call_only === 'true') {
    single_incoming_call_only = true;

  } else {
    single_incoming_call_only = false;
  }
  
  var show_buttons_label = $('#show_buttons_label').val();
  
  if (show_buttons_label === 'true'){
    show_buttons_label = true;

  } else if (show_buttons_label === 'false'){
    show_buttons_label = false;
  
  } else {
    show_buttons_label = false;
  }

  var language = $('#language').val();
  var ui_size = $('#ui_size').val();
  var room_name = $('#room_name').val();
  var username_prefix = $('#username_prefix').val();
  var user_id = $('#user_id').val();
  var full_name = $('#full_name').val();
  var client_id = $('#client_id').val();
  var client_token = $('#client_token').val();
  var auth_token = $('#auth_token').val();  

  var credentials;
  
  if (auth_token !== '') {
    credentials = {
      client_id: client_id,
      auth_token: auth_token
    };

  } else {
    credentials = {
      client_id: client_id,
      client_token: client_token
    };
  }

  var has_errors = false;

  if (user_id === '') {
    $('#user_id').toggleClass('error', true);
    has_errors = true;
  }

  if (full_name === '') {
    $('#full_name').toggleClass('error', true);
    has_errors = true;
  }

  if (client_id === '') {
    $('#client_id').toggleClass('error', true);
    has_errors = true;
  }

  if (client_token === '' && auth_token === '') {    
    $('#client_token').toggleClass('error', true);
    $('#auth_token').toggleClass('error', true);
    has_errors = true;
  }

  if (has_errors) {
    
    return false;
  }

  console.log(credentials);

  sylrtc.configure({
    room_name: room_name,
    ui_size: ui_size,
    language: language,
    show_buttons_label: show_buttons_label,
    ui_mode: ui_mode,
    start_call_with_cam: start_call_with_cam,
    single_incoming_call_only: single_incoming_call_only,
    rtc_server: rtc_server,
    user: {
      username_prefix: username_prefix,
      id: user_id,
      full_name: full_name
    },
    credentials: credentials,
    //using i18n keys you can override any UI copy from sylrtc-client/app/langs/en.js language file
    i18n: {
      processing_message: 'Processing your message, please wait...',
      message_uploaded: 'Your message is ready, here is the message link that you can send to the message recipient.'
    },
    preserve_chat_conversations_in_local_storage: false,
    chat_message_getter: getChatMessages
  });

  sylrtc
  
  return true;
}


sylrtc.on('onlinepresencechanged', function(_onlineUsers){
  console.log(_onlineUsers);

  $('.counter').text(_onlineUsers.length);
  onlineUsers = _onlineUsers;

  if ($('#users_online').length > 0 || $('#users_empty').length) {
    var online = onlineUsers && onlineUsers.length ? 'online' : 'empty';
    openInfo({ name:  'users_' + online });
  }
});


sylrtc.on('connected', function(_onlineUsers){
  updateOnlineStatus(true);
});


sylrtc.on('disconnected', function(_onlineUsers){
  updateOnlineStatus(false);
});


sylrtc.on('chatmessage', function(message){
  message.participants = message.participants.join();

  if (message.file) {
    message.file = JSON.stringify(message.file);
  }

  let data = {
    client_id: $('#client_id').val(),
    client_token: $('#client_token').val(),
    message: message
  };  

  $.ajax({
    type: 'POST',
    url: '/api/save_chat_message/',
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify(data),    
    success: function(res){
      console.log(res);
    }
  });
});


function getChatMessages(participants){  
  return new Promise(function(resolve, reject){
    var data = {
      client_id: $('#client_id').val(),
      client_token: $('#client_token').val(),
      participants: participants.join()
    };
  
    $.get( "/api/get_chat_conversation/", data, function(data) {      
      var messages = data.data.map(function(msg){
        msg.participants = msg.participants.split(',');
        if (msg.file) { msg.file = JSON.parse(msg.file); }
        return msg;
      });
      resolve(messages);
    });
  });
}



sylrtc.init({});


function saveCredentialsInLS(){
  localStorage.setItem('user_id', $('#user_id').val());
  localStorage.setItem('user_full_name', $('#full_name').val());
  localStorage.setItem('client_id', $('#client_id').val());
  localStorage.setItem('client_token', $('#client_token').val());
}


function tryCredentialsFromLS(){
  var user_id = localStorage.getItem('user_id');
  if (user_id) { $('#user_id').val(user_id); }

  var user_full_name = localStorage.getItem('user_full_name');
  if (user_full_name) { $('#full_name').val(user_full_name); }

  var client_id = localStorage.getItem('client_id');
  if (client_id) { $('#client_id').val(client_id); }

  var client_token = localStorage.getItem('client_token');
  if (client_token) { $('#client_token').val(client_token); }
}

tryCredentialsFromLS();

async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('Text copied to clipboard');
  } catch(err) {
    console.log('Error in copying text: ', err);
  }
}
